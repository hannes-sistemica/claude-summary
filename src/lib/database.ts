import Dexie, { Table } from 'dexie';
import { Conversation, Message, SearchResult, DateFilter, Chat, ChatMessage } from './types';

class ClaudeDatabase extends Dexie {
  conversations!: Table<Conversation, number>;
  messages!: Table<Message, number>;
  chats!: Table<Chat, number>;
  chatMessages!: Table<ChatMessage, string>;
  
  constructor() {
    super('claudeConversationsDB');
    
    this.version(2).stores({
      conversations: '++id, claude_id, created_at, updated_at, title',
      messages: '++id, conversationId, role, created_at, [conversationId+created_at]',
      chats: '++id, conversationId, created_at, updated_at',
      chatMessages: 'id, chatId, role, timestamp'
    });
  }
  
  async resetDatabase() {
    await this.conversations.clear();
    await this.messages.clear();
    await this.chats.clear();
    await this.chatMessages.clear();
  }

  async resetChatDatabase() {
    // Delete the entire database and recreate it
    await this.delete();
    const newDb = new ClaudeDatabase();
    await newDb.open();
    return newDb;
  }
  
  async addConversation(conversation: Omit<Conversation, 'id'>) {
    return await this.conversations.add(conversation);
  }
  
  async addMessages(messages: Omit<Message, 'id'>[]) {
    return await this.messages.bulkAdd(messages);
  }
  
  async createChat(title: string, conversationId?: number) {
    const now = new Date().toISOString();
    return await this.chats.add({
      title,
      created_at: now,
      updated_at: now,
      conversationId
    });
  }
  
  async addChatMessage(message: ChatMessage) {
    await this.chatMessages.add(message);
    await this.chats.update(message.chatId, {
      updated_at: new Date().toISOString()
    });
  }
  
  async getChatMessages(chatId: number) {
    return await this.chatMessages
      .where('chatId')
      .equals(chatId)
      .sortBy('timestamp');
  }
  
  async searchConversations(term: string, dateFilter: DateFilter): Promise<SearchResult[]> {
    const searchTerm = term.toLowerCase();
    
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
    
    const [titleMatches, messageMatches] = await Promise.all([
      this.conversations
        .filter(conversation => 
          conversation.title.toLowerCase().includes(searchTerm) &&
          isWithinDateRange(conversation.created_at)
        )
        .toArray(),
      
      this.messages
        .filter(message => 
          message.text.toLowerCase().includes(searchTerm)
        )
        .toArray()
    ]);
    
    const messageMatchesByConversation = new Map<number, Message[]>();
    messageMatches.forEach(message => {
      const matches = messageMatchesByConversation.get(message.conversationId) || [];
      matches.push(message);
      messageMatchesByConversation.set(message.conversationId, matches);
    });
    
    const conversationsFromMessages = await Promise.all(
      Array.from(messageMatchesByConversation.keys()).map(id => 
        this.conversations.get(id)
      )
    );
    
    const filteredConversationsFromMessages = conversationsFromMessages.filter(
      conv => conv && isWithinDateRange(conv.created_at)
    );
    
    const results = new Map<number, SearchResult>();
    
    titleMatches.forEach(conv => {
      if (conv) {
        results.set(conv.id, {
          conversation: conv,
          matchType: 'title',
          messageMatches: []
        });
      }
    });
    
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
    
    return Array.from(results.values())
      .sort((a, b) => 
        new Date(b.conversation.created_at || 0).getTime() - 
        new Date(a.conversation.created_at || 0).getTime()
      );
  }
}

export const db = new ClaudeDatabase();