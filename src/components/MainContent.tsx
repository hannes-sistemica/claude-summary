import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { X } from 'lucide-react';
import SearchBar from './SearchBar';
import ConversationList from './ConversationList';
import ConversationDetail from './ConversationDetail';
import StatsTab from './StatsTab';
import SummarizeModal from './SummarizeModal';
import ErrorModal from './ErrorModal';
import { Conversation, SearchResult, DateFilter, ConversationStats, Message } from '../lib/types';
import { db } from '../lib/database';
import { getActiveEndpoint } from '../lib/settings';
import { summarizeConversations } from '../lib/summarize';

const DEFAULT_PROMPT = `Please provide a concise summary of the following conversations, highlighting:
1. Main topics discussed
2. Key decisions or conclusions
3. Important action items or next steps

Keep the summary clear and focused on the most relevant information.`;

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'conversations' | 'stats'>('conversations');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    startDate: null,
    endDate: null
  });
  const [isSearching, setIsSearching] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [selectedResults, setSelectedResults] = useState<Set<number>>(new Set());
  const [isSummarizeModalOpen, setIsSummarizeModalOpen] = useState(false);
  const [conversationStats, setConversationStats] = useState<Map<number, ConversationStats>>(new Map());
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  
  const searchResults = useLiveQuery<SearchResult[]>(
    async () => {
      if (searchTerm || dateFilter.startDate || dateFilter.endDate) {
        const results = await db.searchConversations(searchTerm, dateFilter);
        return results.map(result => ({
          ...result,
          selected: selectedResults.has(result.conversation.id),
          stats: conversationStats.get(result.conversation.id)
        }));
      } else {
        const conversations = await db.conversations
          .orderBy('created_at')
          .reverse()
          .toArray();
          
        return conversations.map(conv => ({
          conversation: conv,
          matchType: 'title',
          messageMatches: [],
          selected: selectedResults.has(conv.id),
          stats: conversationStats.get(conv.id)
        }));
      }
    },
    [searchTerm, dateFilter, selectedResults, conversationStats]
  ) || [];
  
  useEffect(() => {
    if (selectedConversation) {
      setIsLoadingMessages(true);
      
      db.getConversationMessages(selectedConversation.id)
        .then(messages => {
          setConversationMessages(messages);
          setIsLoadingMessages(false);
        })
        .catch(error => {
          console.error('Error loading messages:', error);
          setConversationMessages([]);
          setIsLoadingMessages(false);
        });
    } else {
      setConversationMessages([]);
    }
  }, [selectedConversation]);

  useEffect(() => {
    const calculateStats = async () => {
      const newStats = new Map(conversationStats);
      
      for (const id of selectedResults) {
        if (!newStats.has(id)) {
          newStats.set(id, { messageCount: 0, wordCount: 0, isLoading: true });
          setConversationStats(new Map(newStats));
          
          const messages = await db.getConversationMessages(id);
          const messageCount = messages.length;
          const wordCount = messages.reduce((count, msg) => 
            count + msg.text.trim().split(/\s+/).length, 0
          );
          
          newStats.set(id, { messageCount, wordCount });
          setConversationStats(new Map(newStats));
        }
      }
      
      // Clean up stats for unselected conversations
      for (const id of newStats.keys()) {
        if (!selectedResults.has(id)) {
          newStats.delete(id);
        }
      }
      
      setConversationStats(new Map(newStats));
    };
    
    calculateStats();
  }, [selectedResults]);
  
  const handleSearch = (term: string) => {
    setIsSearching(true);
    setSearchTerm(term);
    setSelectedConversation(null);
    setSelectedResults(new Set());
    
    setTimeout(() => {
      setIsSearching(false);
    }, 300);
  };
  
  const handleDateFilterChange = (filter: DateFilter) => {
    setDateFilter(filter);
    setSelectedConversation(null);
    setSelectedResults(new Set());
  };
  
  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };
  
  const handleSelectionChange = (id: number) => {
    const newSelected = new Set(selectedResults);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedResults(newSelected);
  };
  
  const handleExport = async () => {
    const selectedConversations = searchResults.filter(
      result => selectedResults.has(result.conversation.id)
    );
    
    const exportData = await Promise.all(
      selectedConversations.map(async (result) => {
        const messages = await db.getConversationMessages(result.conversation.id);
        return {
          ...result.conversation,
          messages
        };
      })
    );
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claude-conversations-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleCancelSelection = () => {
    setSelectedResults(new Set());
  };

  const handleSummarize = () => {
    setIsSummarizeModalOpen(true);
  };

  const handleSummarizeSubmit = async (prompt: string, modelId: string) => {
    setIsSummarizing(true);
    setSummary(null);
    setError(null);
    
    try {
      const endpoint = getActiveEndpoint();
      if (!endpoint) {
        throw new Error('No active endpoint configured. Please configure an API endpoint in settings.');
      }

      if (!endpoint.url || !endpoint.apiKey) {
        throw new Error('Incomplete endpoint configuration. Please check your API settings and ensure both the URL and API key are provided.');
      }

      const selectedConversations = searchResults
        .filter(result => result.selected)
        .map(result => result.conversation);

      if (selectedConversations.length === 0) {
        throw new Error('No conversations selected for summarization.');
      }

      const allMessages = await Promise.all(
        selectedConversations.map(conv => 
          db.getConversationMessages(conv.id)
        )
      );

      const messages = allMessages.flat();
      if (messages.length === 0) {
        throw new Error('Selected conversations contain no messages to summarize.');
      }

      const result = await summarizeConversations(
        selectedConversations,
        messages,
        endpoint,
        prompt,
        modelId
      );

      setSummary(result);
    } catch (error) {
      console.error('Summarization failed:', error);
      setError(error.message || 'An unexpected error occurred during summarization.');
    } finally {
      setIsSummarizing(false);
      setIsSummarizeModalOpen(false);
    }
  };
  
  const activeEndpoint = getActiveEndpoint();
  const canSummarize = activeEndpoint !== null && activeEndpoint.apiKey !== undefined;

  // Calculate total stats for selected conversations
  const totalStats = searchResults
    .filter(result => result.selected && result.stats)
    .reduce(
      (acc, result) => ({
        conversations: acc.conversations + 1,
        messages: acc.messages + (result.stats?.messageCount || 0),
        words: acc.words + (result.stats?.wordCount || 0)
      }),
      { conversations: 0, messages: 0, words: 0 }
    );
  
  return (
    <div className="flex-1 container mx-auto px-4 py-4">
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

      {summary && (
        <div className="fixed bottom-4 right-4 max-w-lg bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold">Summary</h3>
            <button
              onClick={() => setSummary(null)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={20} />
            </button>
          </div>
          <div className="prose prose-sm max-h-96 overflow-y-auto">
            {summary}
          </div>
        </div>
      )}
    </div>
  );
};

export default MainContent;