import React, { useState } from 'react';
import { FileText, UploadCloud, Settings as SettingsIcon, MessageSquare, Trash2 } from 'lucide-react';
import { db } from '../lib/database';
import SettingsMenu from './SettingsMenu';

interface HeaderProps {
  onReset?: () => void;
  showUpload?: boolean;
  isChatOpen?: boolean;
  onChatToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onReset, 
  showUpload = false, 
  isChatOpen = false,
  onChatToggle
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleReset = async () => {
    try {
      await db.resetDatabase();
      window.location.reload();
    } catch (error) {
      console.error('Error resetting database:', error);
    }
  };

  const handleClearChats = async () => {
    try {
      const newDb = await db.resetChatDatabase();
      window.location.reload();
    } catch (error) {
      console.error('Error clearing chat database:', error);
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center text-indigo-600">
            <FileText size={28} className="mr-2" />
            <h1 className="text-xl md:text-2xl font-bold">Claude Conversation Analyzer</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleClearChats}
              className="flex items-center px-3 py-2 text-red-600 hover:text-red-800 transition-colors"
              title="Clear all chats"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={onChatToggle}
              className={`flex items-center px-3 py-2 transition-colors ${
                isChatOpen 
                  ? 'text-indigo-600 hover:text-indigo-800' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              title={isChatOpen ? 'Close chat' : 'Open chat'}
            >
              <MessageSquare size={20} />
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              title="Settings"
            >
              <SettingsIcon size={20} />
            </button>
            
            {showUpload && (
              <button
                onClick={handleReset}
                className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
              >
                <UploadCloud size={18} className="mr-2" />
                Upload New File
              </button>
            )}
          </div>
        </div>
      </header>
      
      <SettingsMenu 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};

export default Header;