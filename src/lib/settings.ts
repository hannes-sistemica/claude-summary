import { EndpointConfig } from './types';

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'anthropic' | 'openai' | 'mistral' | 'grok';
  model: string;
  maxTokens: number;
  contextWindow: number;
  description: string;
}

const API_KEYS_STORAGE_KEY = 'claude_analyzer_api_keys';

export const MODELS: ModelConfig[] = [
  {
    id: 'claude-3-7-sonnet',
    name: 'Claude 3.7 Sonnet',
    provider: 'anthropic',
    model: 'claude-3-7-sonnet',
    maxTokens: 4096,
    contextWindow: 200000,
    description: 'Balanced performance and efficiency'
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    model: 'claude-3-5-haiku',
    maxTokens: 4096,
    contextWindow: 200000,
    description: 'Fastest Claude model, optimized for quick responses'
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
    maxTokens: 4096,
    contextWindow: 128000,
    description: 'Most capable OpenAI model'
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'mistral',
    model: 'mistral-large-latest',
    maxTokens: 4096,
    contextWindow: 32000,
    description: 'Mistral\'s most capable model'
  }
];

export const DEFAULT_ENDPOINTS: EndpointConfig[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    type: 'anthropic',
    url: 'https://llm.sistemica.cloud',
    model: MODELS[0].id,
    isActive: true
  },
  {
    id: 'openai',
    name: 'OpenAI',
    type: 'openai',
    url: 'https://api.openai.com/v1/chat/completions',
    model: MODELS.find(m => m.provider === 'openai')?.id,
    isActive: false
  },
  {
    id: 'mistral',
    name: 'Mistral',
    type: 'mistral',
    url: 'https://api.mistral.ai/v1/chat/completions',
    model: MODELS.find(m => m.provider === 'mistral')?.id,
    isActive: false
  },
  {
    id: 'grok',
    name: 'Grok',
    type: 'grok',
    url: 'https://api.grok.x/v1/chat/completions',
    model: 'grok-1',
    isActive: false
  }
];

export function getModelById(id: string): ModelConfig | undefined {
  console.log('[settings] Getting model by ID:', id);
  const model = MODELS.find(model => model.id === id);
  console.log('[settings] Found model:', model);
  return model;
}

export function formatRequestBody(
  model: ModelConfig,
  messages: { role: string; content: string }[],
  customBody?: Record<string, unknown>
): Record<string, unknown> {
  console.log('[settings] Formatting request body');
  console.log('[settings] Model:', model);
  console.log('[settings] Messages:', messages);
  console.log('[settings] Custom body:', customBody);

  const baseBody = {
    model: model.model,
    messages,
    max_tokens: model.maxTokens,
    ...customBody
  };

  if (model.provider !== 'anthropic') {
    const body = {
      ...baseBody,
      temperature: 0.7
    };
    console.log('[settings] Final request body:', body);
    return body;
  }

  console.log('[settings] Final request body:', baseBody);
  return baseBody;
}

export function parseResponse(data: any, provider: string): string {
  console.log('[settings] Parsing response for provider:', provider);
  console.log('[settings] Response data:', data);

  if (provider === 'anthropic') {
    if (!data.content?.[0]?.text) {
      console.error('[settings] Invalid Anthropic API response format');
      throw new Error('Invalid Anthropic API response format');
    }
    return data.content[0].text;
  }

  if (!data.choices?.[0]?.message?.content) {
    console.error(`[settings] Invalid ${provider} API response format`);
    throw new Error(`Invalid ${provider} API response format`);
  }
  return data.choices[0].message.content;
}

interface StoredApiKeys {
  [endpointId: string]: string;
}

function loadApiKeys(): StoredApiKeys {
  try {
    const stored = localStorage.getItem(API_KEYS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('[settings] Error loading API keys:', error);
    return {};
  }
}

function saveApiKeys(keys: StoredApiKeys): void {
  localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
}

export function loadSettings(): EndpointConfig[] {
  console.log('[settings] Loading settings');
  const apiKeys = loadApiKeys();
  
  const endpoints = DEFAULT_ENDPOINTS.map(endpoint => ({
    ...endpoint,
    apiKey: apiKeys[endpoint.id]
  }));
  
  console.log('[settings] Loaded settings:', endpoints);
  return endpoints;
}

export function saveSettings(settings: EndpointConfig[]): void {
  console.log('[settings] Saving settings:', settings);
  const apiKeys: StoredApiKeys = {};
  
  settings.forEach(endpoint => {
    if (endpoint.apiKey) {
      apiKeys[endpoint.id] = endpoint.apiKey;
    }
  });
  
  saveApiKeys(apiKeys);
}

export function getActiveEndpoint(): EndpointConfig | null {
  console.log('[settings] Getting active endpoint');
  const settings = loadSettings();
  const active = settings.find(endpoint => endpoint.isActive) || null;
  console.log('[settings] Active endpoint:', active);
  return active;
}

export function resetSettings(): void {
  localStorage.removeItem(API_KEYS_STORAGE_KEY);
}