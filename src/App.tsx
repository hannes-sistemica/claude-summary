import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import MainContent from './components/MainContent';
import { db } from './lib/database';

function App() {
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
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
    <div className="min-h-screen h-screen flex flex-col bg-gray-50">
      <Header showUpload={isDataLoaded} />
      
      <div className="flex-1 overflow-hidden">
        {isDataLoaded ? (
          <MainContent />
        ) : (
          <div className="h-full overflow-auto">
            <UploadSection onDataLoaded={() => setIsDataLoaded(true)} />
          </div>
        )}
      </div>
      
      <footer className="flex-shrink-0 py-4 px-6 text-center text-gray-500 text-sm">
        <p>Claude Conversation Analyzer &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;