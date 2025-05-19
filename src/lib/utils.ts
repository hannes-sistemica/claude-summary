/**
 * Format bytes to a human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Escape special characters in a string for use in a regular expression
 */
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Highlight search term in text
 */
export function highlightSearchTerm(text: string, searchTerm: string): string {
  if (!searchTerm) return text;
  
  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
  return text.replace(regex, '<span class="bg-yellow-200 px-0.5 rounded">$1</span>');
}

/**
 * Format a date string to a localized date-time string
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return 'Unknown date';
  
  try {
    return new Date(dateString).toLocaleString();
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Extract a title from the first message in a conversation
 */
export function extractTitle(message?: { text?: string }): string {
  if (!message?.text) return 'Untitled Conversation';
  return truncateText(message.text, 50);
}

/**
 * Group conversations by month and count
 */
export function groupConversationsByMonth(conversations: Array<{ created_at: string | null }>): { [key: string]: number } {
  const result: { [key: string]: number } = {};
  
  conversations.forEach((conversation) => {
    if (!conversation.created_at) return;
    
    try {
      const date = new Date(conversation.created_at);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      
      if (!result[monthYear]) {
        result[monthYear] = 0;
      }
      
      result[monthYear]++;
    } catch (error) {
      // Skip invalid dates
    }
  });
  
  return result;
}

/**
 * Sort object keys chronologically (for month-year format)
 */
export function sortMonthYearKeys(keys: string[]): string[] {
  return keys.sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA.getTime() - dateB.getTime();
  });
}