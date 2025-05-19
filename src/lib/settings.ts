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

const SETTINGS_KEY = 'claude_analyzer_settings';

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

const DEFAULT_ENDPOINTS: EndpointConfig[] = [
  {
    id: 'anthropic',
    name: 'Anthropic',
    type: 'anthropic',
    url: '',
    model: MODELS[0].id,
    isActive: false
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
  return MODELS.find(model => model.id === id);
}

export function formatRequestBody(
  model: ModelConfig,
  messages: { role: string; content: string }[],
  customBody?: Record<string, unknown>
): Record<string, unknown> {
  const baseBody = {
    model: model.model,
    messages,
    max_tokens: model.maxTokens,
    ...customBody
  };

  if (model.provider !== 'anthropic') {
    return {
      ...baseBody,
      temperature: 0.7
    };
  }

  return baseBody;
}

export function parseResponse(data: any, provider: string): string {
  if (provider === 'anthropic') {
    if (!data.content?.[0]?.text) {
      throw new Error('Invalid Anthropic API response format');
    }
    return data.content[0].text;
  }

  if (!data.choices?.[0]?.message?.content) {
    throw new Error(`Invalid ${provider} API response format`);
  }
  return data.choices[0].message.content;
}

export function loadSettings(): EndpointConfig[] {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_ENDPOINTS;
  } catch {
    return DEFAULT_ENDPOINTS;
  }
}

export function saveSettings(settings: EndpointConfig[]): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getActiveEndpoint(): EndpointConfig | null {
  const settings = loadSettings();
  return settings.find(endpoint => endpoint.isActive) || null;
}