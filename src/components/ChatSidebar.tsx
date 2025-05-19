import React, { useRef, useEffect } from 'react';
import { X, Loader2, GripVertical } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
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
    <PanelGroup direction="horizontal" className="fixed inset-y-0 right-0 bg-white shadow-xl flex transform transition-transform duration-300 ease-in-out z-50">
      <PanelResizeHandle className="w-2 hover:bg-gray-100 flex items-center justify-center cursor-col-resize">
        <GripVertical className="w-4 h-4 text-gray-400" />
      </PanelResizeHandle>
      
      <Panel defaultSize={30} minSize={20} maxSize={50} className="flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
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
            <div key={message.id} className={`flex items-start space-x-3 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`flex-shrink-0 rounded-full p-2 ${message.role === 'user' ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Bot className="w-4 h-4 text-gray-600" />
                )}
              </div>
              
              <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'
                }`}>
                  <div className="prose prose-sm max-w-none">
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
          ))}
          
          {isLoading && (
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <ChatInput onSendMessage={onSendMessage} disabled={isLoading} />
      </Panel>
    </PanelGroup>
  );
};

export default ChatSidebar;