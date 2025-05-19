import React from 'react';
import { MessageCircle, Loader2, Search, Download, X, FileText } from 'lucide-react';
import { ConversationListProps } from '../lib/types';
import { highlightSearchTerm, truncateText } from '../lib/utils';

const ConversationList: React.FC<ConversationListProps> = ({
  searchResults,
  searchTerm,
  onConversationSelect,
  onSelectionChange,
  selectedCount,
  onExport,
  onSummarize,
  canSummarize,
  onCancelSelection,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }
  
  if (searchResults.length === 0) {
    return (
      <div className="py-16 text-center text-gray-500">
        <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-800 mb-1">No conversations found</h3>
        {searchTerm ? (
          <p>Try a different search term</p>
        ) : (
          <p>Your conversations will appear here</p>
        )}
      </div>
    );
  }
  
  return (
    <>
      {selectedCount > 0 && (
        <div className="sticky top-0 z-10 bg-indigo-50 px-6 py-3 flex items-center justify-between border-b border-indigo-100">
          <div className="text-sm text-indigo-700 flex items-center space-x-4">
            <span>
              {selectedCount} {selectedCount === 1 ? 'conversation' : 'conversations'} selected
            </span>
            {searchResults.some(result => result.selected && result.stats) && (
              <>
                <span className="text-gray-500">•</span>
                <span>
                  {searchResults.reduce((total, result) => 
                    total + (result.selected && result.stats ? result.stats.messageCount : 0), 0)
                  } messages
                </span>
                <span className="text-gray-500">•</span>
                <span>
                  {searchResults.reduce((total, result) => 
                    total + (result.selected && result.stats ? result.stats.wordCount : 0), 0)
                  } words
                </span>
              </>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onCancelSelection}
              className="px-3 py-1.5 text-sm bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </button>
            {canSummarize && (
              <button
                onClick={onSummarize}
                className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
              >
                <FileText className="w-4 h-4 mr-1" />
                Summarize
              </button>
            )}
            <button
              onClick={onExport}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </button>
          </div>
        </div>
      )}
      
      <div className="divide-y divide-gray-100 max-h-[calc(100vh-280px)] overflow-y-auto">
        {searchResults.map(({ conversation, matchType, messageMatches, selected, stats }) => (
          <div
            key={conversation.id}
            className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150 flex items-start"
          >
            <div className="mr-4 pt-1">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onSelectionChange(conversation.id)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            <button
              className="flex-1 text-left focus:outline-none"
              onClick={() => onConversationSelect(conversation)}
            >
              <div className="flex items-start justify-between mb-1">
                <h3 
                  className="text-base font-medium text-gray-900"
                  dangerouslySetInnerHTML={{ 
                    __html: highlightSearchTerm(conversation.title, searchTerm) 
                  }}
                ></h3>
                <span className="text-sm text-gray-500 ml-2 whitespace-nowrap">
                  {conversation.formattedDate}
                </span>
              </div>
              
              {selected && stats?.isLoading && (
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calculating statistics...
                </div>
              )}
              
              {selected && stats && !stats.isLoading && (
                <div className="mt-2 flex items-center space-x-3 text-sm text-gray-500">
                  <span>{stats.messageCount} messages</span>
                  <span>•</span>
                  <span>{stats.wordCount} words</span>
                </div>
              )}
              
              {messageMatches.length > 0 && (
                <div className="mt-2 space-y-2">
                  {messageMatches.map((message, index) => (
                    <div 
                      key={index}
                      className="flex items-start space-x-2 text-sm text-gray-600 bg-gray-50 rounded p-2"
                    >
                      <Search className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div
                        dangerouslySetInnerHTML={{
                          __html: highlightSearchTerm(
                            truncateText(message.text, 100),
                            searchTerm
                          )
                        }}
                      ></div>
                    </div>
                  ))}
                </div>
              )}
            </button>
          </div>
        ))}
      </div>
    </>
  );
};

export default ConversationList;