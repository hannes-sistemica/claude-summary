import { ReactNode } from 'react';

// Database types
export interface Conversation {
  id: number;
  claude_id?: string;
  title: string;
  created_at: string | null;
  updated_at: string | null;
  formattedDate: string;
}

export interface Message {
  id: number;
  conversationId: number;
  role: 'human' | 'assistant' | 'unknown';
  text: string;
  created_at: string | null;
}

export interface SearchResult {
  conversation: Conversation;
  matchType: 'title' | 'content' | 'both';
  messageMatches: Message[];
  selected?: boolean;
  stats?: ConversationStats;
}

export interface ConversationStats {
  messageCount: number;
  wordCount: number;
  isLoading?: boolean;
}

export interface DateFilter {
  startDate: string | null;
  endDate: string | null;
}

// Settings types
export interface EndpointConfig {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'grok' | 'mistral' | 'custom';
  url: string;
  apiKey?: string;
  model?: string;
  isActive: boolean;
  customHeaders?: Record<string, string>;
  customBody?: Record<string, unknown>;
}

// Raw Claude export types
export interface ClaudeMessage {
  uuid: string;
  text: string;
  content: Array<{
    type: string;
    text: string;
    start_timestamp: string;
    stop_timestamp: string;
    citations: any[];
  }>;
  sender: 'human' | 'assistant';
  created_at: string;
  updated_at: string;
  attachments: any[];
  files: any[];
}

export interface ClaudeConversation {
  uuid: string;
  name: string;
  created_at: string;
  updated_at: string;
  account: {
    uuid: string;
  };
  chat_messages: ClaudeMessage[];
}

// Chat types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// Component props types
export interface FileUploadProps {
  onDataLoaded: () => void;
}

export interface ProgressBarProps {
  progress: number;
  message: string;
  detailedMessage: string;
}

export interface SearchBarProps {
  onSearch: (term: string) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
}

export interface ConversationListProps {
  searchResults: SearchResult[];
  searchTerm: string;
  onConversationSelect: (conversation: Conversation) => void;
  onSelectionChange: (id: number) => void;
  selectedCount: number;
  onExport: () => void;
  onSummarize: () => void;
  canSummarize: boolean;
  onCancelSelection: () => void;
  isLoading: boolean;
}

export interface ConversationDetailProps {
  conversation: Conversation | null;
  messages: Message[];
  searchTerm: string;
  onBack: () => void;
  isLoading: boolean;
}

export interface StatCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
}

export interface ChartContainerProps {
  title: string;
  children: ReactNode;
}

export interface SummarizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string, modelId: string) => void;
  defaultPrompt: string;
  stats?: {
    conversations: number;
    messages: number;
    words: number;
  };
  isLoading?: boolean;
}

export interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

export interface ChatMessageProps {
  message: ChatMessage;
}

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}