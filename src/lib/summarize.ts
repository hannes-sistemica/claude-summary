import { Message, Conversation, EndpointConfig } from './types';
import { getModelById, formatRequestBody, parseResponse } from './settings';

export async function summarizeConversations(
  conversations: Conversation[],
  messages: Message[],
  endpoint: EndpointConfig,
  prompt: string,
  modelId: string
): Promise<string> {
  console.log('[summarize] Starting summarization');
  console.log('[summarize] Model ID:', modelId);
  console.log('[summarize] Endpoint:', endpoint);
  console.log('[summarize] Number of conversations:', conversations.length);
  console.log('[summarize] Number of messages:', messages.length);

  if (!endpoint.url) {
    console.error('[summarize] Missing endpoint URL');
    throw new Error('API endpoint URL is not configured. Please configure the endpoint URL in settings.');
  }

  if (!endpoint.apiKey) {
    console.error('[summarize] Missing API key');
    throw new Error('API key is not configured. Please add your API key in settings.');
  }

  const model = getModelById(modelId);
  if (!model) {
    console.error('[summarize] Invalid model ID:', modelId);
    throw new Error(`Unsupported model: ${modelId}`);
  }

  console.log('[summarize] Selected model:', model);

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
  console.log('[summarize] Full prompt length:', fullPrompt.length);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${endpoint.apiKey}`,
    ...endpoint.customHeaders
  };

  console.log('[summarize] Request headers:', headers);

  const body = formatRequestBody(
    model,
    [{ role: 'user', content: fullPrompt }],
    endpoint.customBody
  );

  console.log('[summarize] Request body:', body);
  console.log('[summarize] Making API request to:', endpoint.url);

  try {
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      mode: 'cors',
      credentials: 'omit',
      signal: AbortSignal.timeout(60000)
    });

    console.log('[summarize] Response status:', response.status);
    console.log('[summarize] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorMessage = `API request failed (${response.status}): ${response.statusText}.`;
      try {
        const errorData = await response.json();
        console.error('[summarize] Error response:', errorData);
        errorMessage += ` ${errorData.error || errorData.message || JSON.stringify(errorData)}`;
      } catch {
        const errorText = await response.text();
        console.error('[summarize] Error text:', errorText);
        errorMessage += ` ${errorText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('[summarize] API response:', data);

    const summary = parseResponse(data, model.provider);
    console.log('[summarize] Parsed summary length:', summary.length);
    return summary;
    
  } catch (error) {
    console.error('[summarize] Error during API request:', error);

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