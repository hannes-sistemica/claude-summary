import React, { useRef, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatSidebarProps } from '../lib/types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isLoading
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  if (!isOpen) return null;
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <h3 className="text-lg font-semibold text-gray-900">Chat</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t bg-white">
        <ChatInput onSendMessage={onSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
};

export default ChatSidebar;