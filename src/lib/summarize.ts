import { Message, Conversation, EndpointConfig } from './types';
import { getModelById, formatRequestBody, parseResponse } from './settings';

export async function summarizeConversations(
  conversations: Conversation[],
  messages: Message[],
  endpoint: EndpointConfig,
  prompt: string
): Promise<string> {
  if (!endpoint.url) {
    throw new Error('API endpoint URL is not configured. Please configure the endpoint URL in settings.');
  }

  if (!endpoint.apiKey) {
    throw new Error('API key is not configured. Please add your API key in settings.');
  }

  if (!endpoint.model) {
    throw new Error('No model selected. Please select a model in the summarization settings.');
  }

  const model = getModelById(endpoint.model);
  if (!model) {
    throw new Error(`Unsupported model: ${endpoint.model}`);
  }

  const conversationTexts = conversations.map(conversation => {
    const conversationMessages = messages.filter(
      msg => msg.conversationId === conversation.id
    );
    
    return `### Conversation: ${conversation.title}
Date: ${conversation.formattedDate}

${conversationMessages.map(msg => 
  `${msg.role === 'human' ? 'User' : 'Assistant'}: ${msg.text}`
).join('\n\n')}

-------------------`;
  }).join('\n\n');

  const fullPrompt = `${prompt}\n\nHere are the conversations to summarize:\n\n${conversationTexts}`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${endpoint.apiKey}`,
    ...endpoint.customHeaders
  };

  const body = formatRequestBody(
    model,
    [{ role: 'user', content: fullPrompt }],
    endpoint.customBody
  );

  try {
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      mode: 'cors',
      credentials: 'omit',
      signal: AbortSignal.timeout(60000)
    });

    if (!response.ok) {
      let errorMessage = `API request failed (${response.status}): ${response.statusText}.`;
      try {
        const errorData = await response.json();
        errorMessage += ` ${errorData.error || errorData.message || JSON.stringify(errorData)}`;
      } catch {
        const errorText = await response.text();
        errorMessage += ` ${errorText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return parseResponse(data, model.provider);
    
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(
        'Unable to connect to the API endpoint. Please:\n' +
        '1. Check your internet connection\n' +
        '2. Verify the API endpoint URL in settings\n' +
        '3. Ensure the API server is running and accessible\n' +
        '4. Check if your firewall or security settings are blocking the connection'
      );
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out. The API server is taking too long to respond. Please try again or contact your administrator if the issue persists.');
    }
    throw error;
  }
}