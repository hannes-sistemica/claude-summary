import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import SearchBar from './SearchBar';
import ConversationList from './ConversationList';
import ConversationDetail from './ConversationDetail';
import StatsTab from './StatsTab';
import SummarizeModal from './SummarizeModal';
import ChatSidebar from './ChatSidebar';
import ErrorModal from './ErrorModal';
import { Conversation, SearchResult, DateFilter, ConversationStats, Message, ChatMessage } from '../lib/types';
import { db } from '../lib/database';
import { getActiveEndpoint } from '../lib/settings';
import { summarizeConversations } from '../lib/summarize';
import { loadChatMessages, saveChatMessages, generateMessageId } from '../lib/chat';

const MainContent: React.FC = () => {
  // ... (keep all the existing state and hooks)

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 px-4 py-4">
        <SearchBar 
          onSearch={handleSearch} 
          dateFilter={dateFilter}
          onDateFilterChange={handleDateFilterChange}
        />
        
        <div className="border-b border-gray-200 mt-6">
          <div className="flex space-x-8">
            <button
              className={`pb-4 text-sm font-medium transition-colors duration-200 border-b-2 px-1 ${
                activeTab === 'conversations'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('conversations')}
            >
              Conversations
            </button>
            <button
              className={`pb-4 text-sm font-medium transition-colors duration-200 border-b-2 px-1 ${
                activeTab === 'stats'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('stats')}
            >
              Statistics
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden px-4">
        <div className="h-full flex gap-6">
          <div className="flex-1 overflow-hidden bg-white rounded-lg shadow">
            <div className="h-full overflow-auto">
              {activeTab === 'conversations' && (
                selectedConversation ? (
                  <ConversationDetail
                    conversation={selectedConversation}
                    messages={conversationMessages}
                    searchTerm={searchTerm}
                    onBack={() => setSelectedConversation(null)}
                    isLoading={isLoadingMessages}
                  />
                ) : (
                  <ConversationList
                    searchResults={searchResults}
                    searchTerm={searchTerm}
                    onConversationSelect={handleConversationSelect}
                    onSelectionChange={handleSelectionChange}
                    selectedCount={selectedResults.size}
                    onExport={handleExport}
                    onSummarize={handleSummarize}
                    canSummarize={canSummarize}
                    onCancelSelection={handleCancelSelection}
                    isLoading={isSearching}
                  />
                )
              )}
              
              {activeTab === 'stats' && (
                <StatsTab />
              )}
            </div>
          </div>

          {isChatOpen && (
            <div className="w-[400px] flex-shrink-0 bg-white rounded-lg shadow overflow-hidden">
              <ChatSidebar
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                isLoading={isSummarizing}
              />
            </div>
          )}
        </div>
      </div>

      <SummarizeModal
        isOpen={isSummarizeModalOpen}
        onClose={() => setIsSummarizeModalOpen(false)}
        onSubmit={handleSummarizeSubmit}
        defaultPrompt={DEFAULT_PROMPT}
        stats={totalStats}
        isLoading={isSummarizing}
      />

      <ErrorModal
        isOpen={!!error}
        message={error || ''}
        onClose={() => setError(null)}
      />
    </div>
  );
};

export default MainContent;