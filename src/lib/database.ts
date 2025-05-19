import Dexie, { Table } from 'dexie';
import { Conversation, Message, SearchResult, DateFilter } from './types';

class ClaudeDatabase extends Dexie {
  conversations!: Table<Conversation, number>;
  messages!: Table<Message, number>;
  
  constructor() {
    super('claudeConversationsDB');
    
    this.version(1).stores({
      conversations: '++id, claude_id, created_at, updated_at, title',
      messages: '++id, conversationId, role, created_at, [conversationId+created_at]'
    });
  }
  
  async resetDatabase() {
    await this.conversations.clear();
    await this.messages.clear();
  }
  
  async addConversation(conversation: Omit<Conversation, 'id'>) {
    return await this.conversations.add(conversation);
  }
  
  async addMessages(messages: Omit<Message, 'id'>[]) {
    return await this.messages.bulkAdd(messages);
  }
  
  async getConversationMessages(conversationId: number) {
    return await this.messages
      .where('conversationId')
      .equals(conversationId)
      .toArray();
  }
  
  async searchConversations(term: string, dateFilter: DateFilter): Promise<SearchResult[]> {
    const searchTerm = term.toLowerCase();
    
    // Create a filter function for dates
    const isWithinDateRange = (date: string | null) => {
      if (!date) return true;
      const timestamp = new Date(date).getTime();
      
      if (dateFilter.startDate && timestamp < new Date(dateFilter.startDate).getTime()) {
        return false;
      }
      
      if (dateFilter.endDate) {
        const endDate = new Date(dateFilter.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (timestamp > endDate.getTime()) {
          return false;
        }
      }
      
      return true;
    };
    
    // Search in conversation titles and messages
    const [titleMatches, messageMatches] = await Promise.all([
      // Search in titles
      this.conversations
        .filter(conversation => 
          conversation.title.toLowerCase().includes(searchTerm) &&
          isWithinDateRange(conversation.created_at)
        )
        .toArray(),
      
      // Search in messages
      this.messages
        .filter(message => 
          message.text.toLowerCase().includes(searchTerm)
        )
        .toArray()
    ]);
    
    // Group message matches by conversation
    const messageMatchesByConversation = new Map<number, Message[]>();
    messageMatches.forEach(message => {
      const matches = messageMatchesByConversation.get(message.conversationId) || [];
      matches.push(message);
      messageMatchesByConversation.set(message.conversationId, matches);
    });
    
    // Get conversations for message matches
    const conversationsFromMessages = await Promise.all(
      Array.from(messageMatchesByConversation.keys()).map(id => 
        this.conversations.get(id)
      )
    );
    
    // Filter conversations by date range
    const filteredConversationsFromMessages = conversationsFromMessages.filter(
      conv => conv && isWithinDateRange(conv.created_at)
    );
    
    // Combine results
    const results = new Map<number, SearchResult>();
    
    // Add title matches
    titleMatches.forEach(conv => {
      if (conv) {
        results.set(conv.id, {
          conversation: conv,
          matchType: 'title',
          messageMatches: []
        });
      }
    });
    
    // Add message matches
    filteredConversationsFromMessages.forEach((conv) => {
      if (!conv) return;
      
      const existingResult = results.get(conv.id);
      const matches = messageMatchesByConversation.get(conv.id) || [];
      
      if (existingResult) {
        existingResult.matchType = 'both';
        existingResult.messageMatches = matches.slice(0, 3);
      } else {
        results.set(conv.id, {
          conversation: conv,
          matchType: 'content',
          messageMatches: matches.slice(0, 3)
        });
      }
    });
    
    // Convert to array and sort by date
    return Array.from(results.values())
      .sort((a, b) => 
        new Date(b.conversation.created_at || 0).getTime() - 
        new Date(a.conversation.created_at || 0).getTime()
      );
  }
}

export const db = new ClaudeDatabase();