import { GmailProfile, GmailMessage, EmailDraft } from './types';
import { Email } from '../emailService';

/**
 * Fetch user profile from Gmail API
 */
export const fetchGmailProfile = async (token: string): Promise<GmailProfile> => {
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch Gmail profile');
  }
  
  return response.json();
};

/**
 * Fetch messages from Gmail API with optional search query
 */
export const fetchGmailMessages = async (token: string, searchQuery?: string): Promise<GmailMessage[]> => {
  // Build query string
  let queryParams = 'maxResults=100';
  if (searchQuery) {
    queryParams += `&q=${encodeURIComponent(searchQuery)}`;
  }
  
  // First get message IDs
  const listResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!listResponse.ok) {
    throw new Error('Failed to fetch Gmail messages list');
  }
  
  const data = await listResponse.json();
  const messageIds = data.messages || [];
  
  if (messageIds.length === 0) {
    return [];
  }
  
  // Instead of fetching each message individually, use batch request (10 at a time)
  const messages: GmailMessage[] = [];
  const batchSize = 10;
  const batchCount = Math.min(Math.ceil(messageIds.length / batchSize), 5); // Limit to 5 batches (50 messages)
  
  const fetchBatch = async (startIdx: number, endIdx: number) => {
    const batchPromises = messageIds
      .slice(startIdx, endIdx)
      .map(({ id }) => 
        fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then(res => res.ok ? res.json() : null)
      );
    
    const batchResults = await Promise.all(batchPromises);
    return batchResults.filter(Boolean);
  };
  
  // Process batches in parallel
  const batchPromises = [];
  for (let i = 0; i < batchCount; i++) {
    const startIdx = i * batchSize;
    const endIdx = startIdx + batchSize;
    batchPromises.push(fetchBatch(startIdx, endIdx));
  }
  
  const batchResults = await Promise.all(batchPromises);
  batchResults.forEach(batch => {
    messages.push(...batch);
  });
  
  return messages;
};

/**
 * Star/unstar a Gmail message
 */
export const starGmailMessage = async (id: string, starred: boolean, token: string): Promise<void> => {
  const addLabels = starred ? ['STARRED'] : [];
  const removeLabels = starred ? [] : ['STARRED'];
  
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      addLabelIds: addLabels,
      removeLabelIds: removeLabels
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to update Gmail message labels');
  }
};

/**
 * Mark a Gmail message as read
 */
export const markGmailMessageAsRead = async (id: string, token: string): Promise<void> => {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/modify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      removeLabelIds: ['UNREAD']
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to mark Gmail message as read');
  }
};

/**
 * Convert a Gmail message to our application's email format
 */
export const convertGmailToEmail = (message: GmailMessage): Email => {
  if (!message || !message.payload) {
    // Handle missing or malformed message
    return {
      id: message?.id || 'unknown',
      subject: '(Error loading email)',
      sender: 'Unknown',
      preview: 'This email could not be loaded properly.',
      date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      read: true,
      starred: false,
      category: 'primary'
    };
  }

  // Use destructuring for headers to make code more readable
  const headers = message.payload.headers || [];
  const headerMap = new Map(headers.map(h => [h.name.toLowerCase(), h.value]));
  
  const fromHeader = headerMap.get('from') || '';
  const subjectHeader = headerMap.get('subject') || '';
  const dateHeader = headerMap.get('date') || '';
  
  // Extract sender name from "Name <email@example.com>" format
  const sender = fromHeader.includes('<') 
    ? fromHeader.split('<')[0].trim() 
    : fromHeader.trim();
  
  // Parse date and ensure it's valid
  let formattedDate;
  try {
    const date = new Date(dateHeader);
    formattedDate = !isNaN(date.getTime())
      ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : 'Unknown date';
  } catch (e) {
    formattedDate = 'Unknown date';
  }
  
  // Determine email category
  let emailCategory: 'primary' | 'social' | 'promotions' | 'sent' | 'drafts' | 'archived' | 'trash' = 'primary';
  const labelIds = message.labelIds || [];
  
  if (labelIds.includes('CATEGORY_SOCIAL')) {
    emailCategory = 'social';
  } else if (labelIds.includes('CATEGORY_PROMOTIONS')) {
    emailCategory = 'promotions';
  } else if (labelIds.includes('SENT')) {
    emailCategory = 'sent';
  } else if (labelIds.includes('DRAFT')) {
    emailCategory = 'drafts';
  }
  
  return {
    id: message.id,
    subject: subjectHeader || '(No subject)',
    sender: sender || 'Unknown sender',
    preview: message.snippet || '',
    date: formattedDate,
    read: !labelIds.includes('UNREAD'),
    starred: labelIds.includes('STARRED'),
    category: emailCategory
  };
};

/**
 * Send an email using Gmail API
 */
export const sendGmailMessage = async (draft: EmailDraft, token: string): Promise<void> => {
  // Create email in RFC 2822 format
  const to = `To: ${draft.to}\r\n`;
  const subject = `Subject: ${draft.subject}\r\n`;
  const contentType = 'Content-Type: text/html; charset=utf-8\r\n';
  const mime = 'MIME-Version: 1.0\r\n';
  const body = `\r\n${draft.body}`;
  
  const emailContent = to + subject + contentType + mime + body;
  
  // Base64 encode the email
  const encodedEmail = btoa(unescape(encodeURIComponent(emailContent)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      raw: encodedEmail
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to send email: ${error?.error?.message || 'Unknown error'}`);
  }
};

/**
 * Get the full message body content from Gmail API
 */
export const fetchGmailMessageContent = async (messageId: string, token: string): Promise<string> => {
  try {
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData?.error?.message || 'Unknown error';
      
      if (response.status === 404) {
        throw new Error('MESSAGE_NOT_FOUND');
      } else if (response.status === 403) {
        throw new Error('PERMISSION_DENIED');
      } else if (response.status === 401) {
        throw new Error('INVALID_TOKEN');
      }
      throw new Error(`Failed to fetch Gmail message content: ${errorMessage}`);
    }
    
    const message = await response.json();
    
    // Extract the message body - this handles both simple and multipart messages
    let messageBody = '';
    
    if (message.payload) {
      if (message.payload.body && message.payload.body.data) {
        // Simple message with body directly in the payload
        messageBody = decodeBase64UrlSafe(message.payload.body.data);
      } else if (message.payload.parts) {
        // Multipart message
        for (const part of message.payload.parts) {
          if (part.mimeType === 'text/html' && part.body && part.body.data) {
            messageBody = decodeBase64UrlSafe(part.body.data);
            break;
          } else if (part.mimeType === 'text/plain' && part.body && part.body.data) {
            messageBody = decodeBase64UrlSafe(part.body.data);
            // Continue searching for HTML part
          }
        }
      }
    }

    if (!messageBody) {
      throw new Error('EMPTY_MESSAGE');
    }
    
    return messageBody;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch Gmail message content');
  }
};

/**
 * Helper function to decode base64 URL-safe encoding used by Gmail API
 */
const decodeBase64UrlSafe = (data: string): string => {
  // Convert URL-safe base64 to regular base64
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  
  // Decode base64
  try {
    return decodeURIComponent(escape(atob(base64)));
  } catch (error) {
    console.error('Error decoding base64', error);
    return 'Could not decode message content';
  }
};

/**
 * Create a draft email
 */
export const createGmailDraft = async (draft: EmailDraft, token: string): Promise<string> => {
  // Create email in RFC 2822 format
  const to = `To: ${draft.to}\r\n`;
  const subject = `Subject: ${draft.subject}\r\n`;
  const contentType = 'Content-Type: text/html; charset=utf-8\r\n';
  const mime = 'MIME-Version: 1.0\r\n';
  const body = `\r\n${draft.body}`;
  
  const emailContent = to + subject + contentType + mime + body;
  
  // Base64 encode the email
  const encodedEmail = btoa(unescape(encodeURIComponent(emailContent)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: {
        raw: encodedEmail
      }
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create draft: ${error?.error?.message || 'Unknown error'}`);
  }
  
  const data = await response.json();
  return data.id;
};
