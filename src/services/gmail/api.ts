
import { GmailProfile, GmailMessage } from './types';

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
 * Fetch messages from Gmail API
 */
export const fetchGmailMessages = async (token: string): Promise<GmailMessage[]> => {
  // First get message IDs (max 50)
  const listResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!listResponse.ok) {
    throw new Error('Failed to fetch Gmail messages list');
  }
  
  const data = await listResponse.json();
  const messageIds = data.messages || [];
  
  // Then fetch details for each message
  const messages: GmailMessage[] = [];
  
  for (const { id } of messageIds.slice(0, 20)) { // Limit to 20 to avoid rate limits
    const messageResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (messageResponse.ok) {
      const messageData = await messageResponse.json();
      messages.push(messageData);
    }
  }
  
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
export const convertGmailToEmail = (message: GmailMessage) => {
  const fromHeader = message.payload?.headers.find(h => h.name === 'From')?.value || '';
  const subjectHeader = message.payload?.headers.find(h => h.name === 'Subject')?.value || '';
  const dateHeader = message.payload?.headers.find(h => h.name === 'Date')?.value || '';
  
  const sender = fromHeader.split('<')[0].trim();
  const date = new Date(dateHeader);
  const formattedDate = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  
  let emailCategory: 'primary' | 'social' | 'promotions' = 'primary';
  
  if (message.labelIds.includes('CATEGORY_SOCIAL')) {
    emailCategory = 'social';
  } else if (message.labelIds.includes('CATEGORY_PROMOTIONS')) {
    emailCategory = 'promotions';
  }
  
  return {
    id: message.id,
    subject: subjectHeader,
    sender: sender,
    preview: message.snippet,
    date: formattedDate,
    read: !message.labelIds.includes('UNREAD'),
    starred: message.labelIds.includes('STARRED'),
    category: emailCategory
  };
};
