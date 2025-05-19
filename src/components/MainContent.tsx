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

const DEFAULT_PROMPT = "Please summarize these conversations";

const MainContent: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [activeTab, setActiveTab] = useState<'conversations' | 'stats'>('conversations');
  const [isSummarizeModalOpen, setIsSummarizeModalOpen] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [totalStats, setTotalStats] = useState<ConversationStats | null>(null);

  const handleSearch = async (term: string) => {
    setIsSearching(true);
    setSearchTerm(term);
    try {
      const results = await db.conversations
        .where('content')
        .startsWithIgnoreCase(term)
        .limit(100)
        .toArray();
      setSearchResults(results);
    } catch (err) {
      setError('Failed to search conversations');
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDateFilterChange = (filter: DateFilter) => {
    setDateFilter(filter);
  };

  const handleConversationSelect = async (conversation: Conversation) => {
    setIsLoadingMessages(true);
    setSelectedConversation(conversation);
    try {
      const messages = await db.messages
        .where('conversationId')
        .equals(conversation.id)
        .toArray();
      setConversationMessages(messages);
    } catch (err) {
      setError('Failed to load conversation messages');
      console.error('Load messages error:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSelectionChange = (ids: Set<string>) => {
    setSelectedResults(ids);
  };

  const handleCancelSelection = () => {
    setSelectedResults(new Set());
  };

  const handleExport = async () => {
    // Export functionality would go here
  };

  const handleSummarize = () => {
    setIsSummarizeModalOpen(true);
  };

  const handleSummarizeSubmit = async (prompt: string) => {
    setIsSummarizing(true);
    try {
      const conversations = await db.conversations
        .where('id')
        .anyOf([...selectedResults])
        .toArray();
      
      const summary = await summarizeConversations(conversations, prompt);
      const newMessage: ChatMessage = {
        id: generateMessageId(),
        content: summary,
        role: 'assistant',
        timestamp: new Date().toISOString()
      };
      
      const updatedMessages = [...chatMessages, newMessage];
      setChatMessages(updatedMessages);
      await saveChatMessages(updatedMessages);
      setIsChatOpen(true);
    } catch (err) {
      setError('Failed to summarize conversations');
      console.error('Summarize error:', err);
    } finally {
      setIsSummarizing(false);
      setIsSummarizeModalOpen(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    const newMessage: ChatMessage = {
      id: generateMessageId(),
      content,
      role: 'user',
      timestamp: new Date().toISOString()
    };
    
    const updatedMessages = [...chatMessages, newMessage];
    setChatMessages(updatedMessages);
    await saveChatMessages(updatedMessages);
  };

  const canSummarize = selectedResults.size > 0;

  useEffect(() => {
    const loadMessages = async () => {
      const messages = await loadChatMessages();
      setChatMessages(messages);
    };
    loadMessages();
  }, []);

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="mb-6">
        <SearchBar 
          onSearch={handleSearch} 
          dateFilter={dateFilter}
          onDateFilterChange={handleDateFilterChange}
        />
      </div>
      
      <div className="border-b border-gray-200 mb-6">
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
      
      <div className="flex">
        <div className={`flex-1 transition-all duration-300 ${isChatOpen ? 'mr-[400px]' : ''}`}>
          {activeTab === 'conversations' && (
            <div className="bg-white rounded-lg shadow">
              {selectedConversation ? (
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
              )}
            </div>
          )}
          
          {activeTab === 'stats' && (
            <StatsTab />
          )}
        </div>

        {isChatOpen && (
          <div className="fixed right-4 top-[7.5rem] bottom-4 w-[400px] bg-white rounded-lg shadow-lg border border-gray-200">
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