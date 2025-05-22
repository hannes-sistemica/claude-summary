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
      chats: '++id, title, created_at, updated_at, conversationId',
      chatMessages: 'id, chatId, role, timestamp, [chatId+timestamp]'
    });
  }
  
  async resetDatabase() {
    await this.conversations.clear();
    await this.messages.clear();
  }
  
  async createChat(title: string, conversationId?: number) {
    const now = new Date().toISOString();
    const chatId = await this.chats.add({
      title,
      created_at: now,
      updated_at: now,
      conversationId
    });
    
    console.log('Created new chat with ID:', chatId);
    return chatId;
  }
  
  async addChatMessage(message: ChatMessage) {
    try {
      console.log('Adding chat message:', message);
      await this.chatMessages.add(message);
      await this.chats.update(message.chatId, {
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error adding chat message:', error);
      throw error;
    }
  }
  
  async getChatMessages(chatId: number) {
    try {
      console.log('Fetching messages for chat ID:', chatId);
      if (typeof chatId !== 'number') {
        throw new Error('Invalid chat ID: must be a number');
      }
      
      const messages = await this.chatMessages
        .where('chatId')
        .equals(chatId)
        .sortBy('timestamp');
      
      console.log('Retrieved messages:', messages);
      return messages;
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      throw error;
    }
  }
  
  async deleteChats() {
    try {
      console.log('Deleting all chats and chat messages');
      await this.transaction('rw', this.chats, this.chatMessages, async () => {
        await this.chats.clear();
        await this.chatMessages.clear();
      });
      console.log('Successfully deleted all chats and messages');
    } catch (error) {
      console.error('Error deleting chats:', error);
      throw error;
    }
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