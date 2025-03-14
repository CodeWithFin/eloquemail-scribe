
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";

// Types for Gmail API responses
export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload?: {
    headers: {
      name: string;
      value: string;
    }[];
    parts?: any[];
    mimeType: string;
    body: {
      data?: string;
      size: number;
    };
  };
  sizeEstimate: number;
  historyId: string;
  internalDate: string;
}

// Constants for Google OAuth
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels'
].join(' ');

// Using the provided client ID
const CLIENT_ID = '465336393919-pfoeklk9pgp0nhei2hi7j5c5jodv0vsl.apps.googleusercontent.com';
const REDIRECT_URI = window.location.origin + '/dashboard';

/**
 * Real Google OAuth implementation
 */
const initiateGmailAuth = async (): Promise<void> => {
  if (!CLIENT_ID) {
    throw new Error('Google Cloud OAuth Client ID is not configured');
  }

  // Create OAuth 2.0 URL - Fixed configuration
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.append('client_id', CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'token');
  authUrl.searchParams.append('scope', GMAIL_SCOPES);
  authUrl.searchParams.append('prompt', 'consent');
  // Removing 'access_type' parameter as it's not compatible with response_type=token

  // Redirect to Google's OAuth page
  window.location.href = authUrl.toString();
};

// Handle the OAuth callback by extracting the token from URL
export const handleGmailAuthCallback = (): string | null => {
  const hash = window.location.hash;
  
  if (!hash) return null;
  
  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get('access_token');
  
  if (accessToken) {
    // Store the token in localStorage
    localStorage.setItem('gmail_token', accessToken);
    
    // Remove the hash from URL to avoid token leakage
    window.history.replaceState(null, '', window.location.pathname);
  }
  
  return accessToken;
};

// Real API calls to Gmail using the obtained token
const fetchGmailProfile = async (token: string): Promise<GmailProfile> => {
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

// Fetch emails from Gmail API (real implementation)
const fetchGmailMessages = async (token: string): Promise<GmailMessage[]> => {
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

// Real implementation for starring a message
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

// Real implementation for marking as read
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

// React Query hooks for Gmail API interactions
export const useGmailAuth = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: initiateGmailAuth,
    onError: (error) => {
      toast({
        title: "Connection failed",
        description: `Failed to connect to Gmail: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  });
};

export const useGmailProfile = (token: string | null) => {
  return useQuery({
    queryKey: ['gmailProfile', token],
    queryFn: () => token ? fetchGmailProfile(token) : Promise.reject('No token'),
    enabled: !!token,
  });
};

export const useGmailMessages = (token: string | null) => {
  return useQuery({
    queryKey: ['gmailMessages', token],
    queryFn: () => token ? fetchGmailMessages(token) : Promise.reject('No token'),
    enabled: !!token,
    refetchInterval: 60000, // Refetch every minute
  });
};

export const useStarGmailMessage = () => {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('gmail_token');
  
  return useMutation({
    mutationFn: ({ id, starred }: { id: string; starred: boolean }) => 
      token ? starGmailMessage(id, starred, token) : Promise.reject('No token'),
    onMutate: async ({ id, starred }) => {
      // Optimistic update
      queryClient.setQueryData(['gmailMessages'], (oldData: any) => 
        oldData ? oldData.map((message: GmailMessage) => 
          message.id === id ? { 
            ...message, 
            labelIds: starred 
              ? [...message.labelIds, 'STARRED'] 
              : message.labelIds.filter(label => label !== 'STARRED') 
          } : message
        ) : []
      );
    },
    onError: (error) => {
      // Revert on error via refetch
      queryClient.invalidateQueries({ queryKey: ['gmailMessages'] });
    }
  });
};

export const useMarkGmailMessageAsRead = () => {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('gmail_token');
  
  return useMutation({
    mutationFn: (id: string) => token ? markGmailMessageAsRead(id, token) : Promise.reject('No token'),
    onMutate: async (id) => {
      // Optimistic update
      queryClient.setQueryData(['gmailMessages'], (oldData: any) => 
        oldData ? oldData.map((message: GmailMessage) => 
          message.id === id ? { 
            ...message, 
            labelIds: message.labelIds.filter(label => label !== 'UNREAD') 
          } : message
        ) : []
      );
    },
    onError: () => {
      // Revert on error via refetch
      queryClient.invalidateQueries({ queryKey: ['gmailMessages'] });
    }
  });
};

// Helper function to convert Gmail message to Email format
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
