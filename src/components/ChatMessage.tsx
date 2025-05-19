import React from 'react';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessageProps } from '../lib/types';

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      <div className={`flex-shrink-0 rounded-full p-2 ${isUser ? 'bg-indigo-100' : 'bg-gray-100'}`}>
        {isUser ? (
          <User className="w-4 h-4 text-indigo-600" />
        ) : (
          <Bot className="w-4 h-4 text-gray-600" />
        )}
      </div>
      
      <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block max-w-[80%] rounded-lg px-4 py-2 ${
          isUser ? 'bg-indigo-600' : 'bg-gray-100'
        }`}>
          <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
        <div className="mt-1">
          <span className="text-xs text-gray-500">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;