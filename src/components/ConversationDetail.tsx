import React from 'react';
import { ArrowLeft, User, Bot, Loader2 } from 'lucide-react';
import { ConversationDetailProps } from '../lib/types';
import { highlightSearchTerm } from '../lib/utils';

const ConversationDetail: React.FC<ConversationDetailProps> = ({
  conversation,
  messages,
  searchTerm,
  onBack,
  isLoading
}) => {
  if (!conversation) return null;
  
  return (
    <div className="p-6">
      <button
        onClick={onBack}
        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to conversation list
      </button>
      
      <h2 className="text-xl font-semibold text-gray-900 mb-1">{conversation.title}</h2>
      <p className="text-sm text-gray-500 mb-6">{conversation.formattedDate}</p>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No messages found in this conversation.
        </div>
      ) : (
        <div className="space-y-6 max-h-[calc(100vh-320px)] overflow-y-auto pr-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-4 rounded-lg ${
                message.role === 'human'
                  ? 'bg-gray-100'
                  : 'bg-indigo-50'
              }`}
            >
              <div className="flex items-center mb-2">
                <div className={`p-1.5 rounded-full mr-2 ${
                  message.role === 'human' ? 'bg-gray-200' : 'bg-indigo-100'
                }`}>
                  {message.role === 'human' ? (
                    <User className="w-4 h-4 text-gray-600" />
                  ) : (
                    <Bot className="w-4 h-4 text-indigo-600" />
                  )}
                </div>
                <div className="font-medium text-sm">
                  {message.role === 'human' ? 'You' : 'Claude'}
                </div>
              </div>
              
              <div 
                className="text-gray-800 whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ 
                  __html: highlightSearchTerm(message.text, searchTerm) 
                }}
              ></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConversationDetail;