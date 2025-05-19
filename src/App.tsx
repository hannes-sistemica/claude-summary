import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import MainContent from './components/MainContent';
import ChatSidebar from './components/ChatSidebar';
import { db } from './lib/database';
import { ChatMessage } from './lib/types';
import { loadChatMessages, saveChatMessages, generateMessageId } from './lib/chat';

function App() {
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(loadChatMessages());
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const count = await db.conversations.count();
        setIsDataLoaded(count > 0);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to check database:', error);
        setIsInitialized(true);
      }
    };
    
    checkDatabase();
  }, []);

  useEffect(() => {
    saveChatMessages(chatMessages);
  }, [chatMessages]);

  const handleSendMessage = async (message: string) => {
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Simulate AI response for now
      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: `I received your message: "${message}". However, this is just a placeholder response as the chat functionality is not yet implemented.`,
        timestamp: Date.now()
      };
      
      setTimeout(() => {
        setChatMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to process message:', error);
      
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: `Error: ${error.message || 'Failed to process your message.'}`,
        timestamp: Date.now()
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };
  
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 mb-4 rounded-full bg-indigo-200"></div>
          <div className="h-4 w-48 bg-indigo-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showUpload={isDataLoaded} />
      
      <div className="flex-1 flex">
        <div className="flex-1 container mx-auto px-4 py-4">
          {isDataLoaded ? (
            <MainContent onChatOpen={() => setIsChatOpen(true)} />
          ) : (
            <UploadSection onDataLoaded={() => setIsDataLoaded(true)} />
          )}
        </div>
        
        {isChatOpen && (
          <div className="w-[400px] bg-white border-l border-gray-200">
            <ChatSidebar
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
      
      <footer className="py-4 px-6 text-center text-gray-500 text-sm">
        <p>Claude Conversation Analyzer &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;