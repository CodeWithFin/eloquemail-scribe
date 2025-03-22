
import { AurinkoProfile, AurinkoMessageList, AurinkoMessage } from './types';
import { Email } from '../emailService';

// Base URL for Aurinko API
const AURINKO_API_BASE_URL = 'https://app.aurinko.io/api/v1';

// Helper function to make authenticated requests to Aurinko API
const fetchAurinkoApi = async (
  endpoint: string, 
  token: string | null, 
  options: RequestInit = {}
): Promise<any> => {
  if (!token) {
    throw new Error('Authentication token is required');
  }
  
  const url = `${AURINKO_API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Aurinko API Error (${response.status}): ${errorText}`);
  }
  
  return response.json();
};

// Get user profile information
export const getAurinkoProfile = async (token: string | null): Promise<AurinkoProfile> => {
  try {
    const data = await fetchAurinkoApi('/gmail/users/me/profile', token);
    return {
      emailAddress: data.emailAddress,
      messagesTotal: data.messagesTotal,
      threadsTotal: data.threadsTotal,
      historyId: data.historyId,
    };
  } catch (error) {
    console.error('Error fetching Aurinko profile:', error);
    throw error;
  }
};

// Get list of messages
export const getAurinkoMessages = async (token: string | null): Promise<AurinkoMessage[]> => {
  try {
    const data = await fetchAurinkoApi('/gmail/users/me/messages?maxResults=20', token);
    
    // Fetch full details for each message
    const messages = await Promise.all(
      data.messages.map(async (message: { id: string }) => {
        const messageDetails = await fetchAurinkoApi(
          `/gmail/users/me/messages/${message.id}`, 
          token
        );
        return messageDetails;
      })
    );
    
    return messages;
  } catch (error) {
    console.error('Error fetching Aurinko messages:', error);
    throw error;
  }
};

// Convert Aurinko message to common Email format
export const convertAurinkoToEmail = (message: AurinkoMessage): Email => {
  // Find relevant headers
  const headers = message.payload.headers;
  const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject');
  const fromHeader = headers.find(h => h.name.toLowerCase() === 'from');
  const dateHeader = headers.find(h => h.name.toLowerCase() === 'date');
  
  // Get category from labels
  let category: 'primary' | 'social' | 'promotions' | undefined;
  if (message.labelIds.includes('CATEGORY_PERSONAL') || message.labelIds.includes('INBOX')) {
    category = 'primary';
  } else if (message.labelIds.includes('CATEGORY_SOCIAL')) {
    category = 'social';
  } else if (message.labelIds.includes('CATEGORY_PROMOTIONS')) {
    category = 'promotions';
  }
  
  return {
    id: message.id,
    subject: subjectHeader?.value || '(No subject)',
    sender: fromHeader?.value || 'Unknown sender',
    preview: message.snippet || '',
    date: dateHeader?.value || new Date().toISOString(),
    read: !message.labelIds.includes('UNREAD'),
    starred: message.labelIds.includes('STARRED'),
    category,
  };
};

// Star or unstar a message
export const toggleAurinkoMessageStar = async (
  token: string | null,
  id: string,
  starred: boolean
): Promise<void> => {
  const action = starred ? 'add' : 'remove';
  await fetchAurinkoApi(
    `/gmail/users/me/messages/${id}/modify`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        addLabelIds: action === 'add' ? ['STARRED'] : [],
        removeLabelIds: action === 'remove' ? ['STARRED'] : [],
      }),
    }
  );
};

// Mark a message as read
export const markAurinkoMessageAsRead = async (
  token: string | null,
  id: string
): Promise<void> => {
  await fetchAurinkoApi(
    `/gmail/users/me/messages/${id}/modify`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        removeLabelIds: ['UNREAD'],
      }),
    }
  );
};
