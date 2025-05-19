import { ChatMessage } from './types';

const CHAT_STORAGE_KEY = 'claude_analyzer_chat';

export function loadChatMessages(): ChatMessage[] {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading chat messages:', error);
    return [];
  }
}

export function saveChatMessages(messages: ChatMessage[]): void {
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
}

export function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}