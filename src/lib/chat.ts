import { ChatMessage } from './types';
import { db } from './database';

export function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function createNewChat(title: string, conversationId?: number) {
  return await db.createChat(title, conversationId);
}

export async function addChatMessage(chatId: number, role: 'user' | 'assistant', content: string) {
  const message: ChatMessage = {
    id: generateMessageId(),
    chatId,
    role,
    content,
    timestamp: Date.now()
  };
  
  await db.addChatMessage(message);
  return message;
}

export async function getChatMessages(chatId: number) {
  return await db.getChatMessages(chatId);
}

// Export getChatMessages as loadChatMessages and saveChatMessages for backward compatibility
export const loadChatMessages = getChatMessages;
export const saveChatMessages = getChatMessages;