import React, { useState, useRef } from 'react';
import { Upload, FileUp } from 'lucide-react';
import ProgressBar from './ProgressBar';
import ErrorModal from './ErrorModal';
import { db } from '../lib/database';
import { formatBytes, extractTitle, formatDate } from '../lib/utils';
import { FileUploadProps, ClaudeConversation } from '../lib/types';

const UploadSection: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [detailedStatus, setDetailedStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };
  
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };
  
  const showError = (message: string) => {
    setErrorMessage(message);
    setIsErrorModalOpen(true);
  };

  const isValidMessage = (message: { text?: string }) => {
    return message.text && message.text.trim().length > 0;
  };
  
  const handleFile = async (file: File) => {
    if (file.type !== 'application/json') {
      showError('Please upload a JSON file.');
      return;
    }
    
    setIsUploading(true);
    setProgress(0);
    setStatusMessage('Processing file...');
    
    try {
      const text = await file.text();
      const data = JSON.parse(text) as ClaudeConversation[];
      
      if (!Array.isArray(data)) {
        throw new Error(
          'Invalid Claude export format: Expected an array of conversations. ' +
          'Please ensure you are uploading a valid Claude conversation export file.'
        );
      }
      
      await db.resetDatabase();
      
      // Filter out conversations with no messages or only empty messages
      const validConversations = data.filter(conversation => {
        return conversation.chat_messages?.some(isValidMessage);
      });
      
      const totalConversations = validConversations.length;
      setStatusMessage(`Processing ${totalConversations} conversations...`);
      
      for (let i = 0; i < totalConversations; i++) {
        const conversation = validConversations[i];
        const progress = Math.round((i / totalConversations) * 100);
        
        setProgress(progress);
        setDetailedStatus(`Processing conversation ${i + 1} of ${totalConversations}`);
        
        // Get the first non-empty message for the title
        const firstValidMessage = conversation.chat_messages.find(isValidMessage);
        const title = conversation.name || 
          (firstValidMessage?.text 
            ? extractTitle(firstValidMessage.text)
            : 'Untitled Conversation');
        
        const conversationId = await db.addConversation({
          claude_id: conversation.uuid,
          title,
          created_at: conversation.created_at || null,
          updated_at: conversation.updated_at || null,
          formattedDate: formatDate(conversation.created_at || null)
        });
        
        // Filter out empty messages
        const validMessages = conversation.chat_messages.filter(isValidMessage);
        
        if (validMessages.length) {
          const messages = validMessages.map(msg => ({
            conversationId,
            role: msg.sender,
            text: msg.text.trim(),
            created_at: msg.created_at || null
          }));
          
          await db.addMessages(messages);
        }
      }
      
      setProgress(100);
      setStatusMessage('Import complete!');
      setTimeout(() => {
        setIsUploading(false);
        onDataLoaded();
      }, 500);
      
    } catch (error) {
      console.error('Error processing file:', error);
      setIsUploading(false);
      showError(error instanceof Error ? error.message : 'Error processing file. Please try again.');
    }
  };
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };
  
  return (
    <div className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Claude Conversation Analyzer</h2>
        <p className="text-gray-600">Upload your Claude JSON export to begin analyzing your conversations</p>
      </div>
      
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200
          ${isDragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-300'}
          ${isUploading ? 'bg-gray-50 pointer-events-none' : 'bg-white'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <div className="py-6">
            <ProgressBar 
              progress={progress} 
              message={statusMessage}
              detailedMessage={detailedStatus}
            />
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-center">
              <div className="p-4 bg-indigo-100 rounded-full text-indigo-500">
                <Upload size={32} />
              </div>
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">
              Drag & Drop Your Claude Export
            </h3>
            <p className="text-gray-600 mb-4">
              Or click to browse your files
            </p>
            <button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors flex items-center mx-auto"
              onClick={handleClick}
            >
              <FileUp size={18} className="mr-2" />
              Choose JSON File
            </button>
            <input 
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".json"
              onChange={handleFileInput}
            />
          </>
        )}
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Your data remains on your device and is never uploaded to any server.</p>
      </div>

      <ErrorModal
        isOpen={isErrorModalOpen}
        message={errorMessage}
        onClose={() => setIsErrorModalOpen(false)}
      />
    </div>
  );
};

export default UploadSection;