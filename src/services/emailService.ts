
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  useGmailMessages, 
  useStarGmailMessage, 
  useMarkGmailMessageAsRead,
  isGmailAuthenticated
} from './gmail';

export interface Email {
  id: string;
  subject: string;
  sender: string;
  preview: string;
  date: string;
  read: boolean;
  starred: boolean;
  category?: 'primary' | 'social' | 'promotions' | 'sent' | 'drafts' | 'archived' | 'trash';
}

// This function would be replaced with actual API calls in a production app
const fetchMockEmails = async (): Promise<Email[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // For demo purposes, fetching from a mock API
  const response = await fetch('https://api.mocki.io/v2/c4d7a195/emails');
  
  if (!response.ok) {
    throw new Error('Failed to fetch emails');
  }
  
  return response.json();
};

export const useEmails = () => {
  const token = localStorage.getItem('gmail_token');
  const gmailQuery = useGmailMessages(token);
  
  const mockEmailsQuery = useQuery({
    queryKey: ['mockEmails'],
    queryFn: fetchMockEmails,
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !isGmailAuthenticated(),
  });
  
  // If we have a Gmail token, use Gmail data, otherwise use mock data
  if (isGmailAuthenticated() && token) {
    return gmailQuery;
  }
  
  return mockEmailsQuery;
};

export const useStarEmail = () => {
  // If we have a Gmail token, use the Gmail star mutation
  if (isGmailAuthenticated()) {
    return useStarGmailMessage();
  }
  
  // Return a mock implementation for demonstration
  return useMutation({
    mutationFn: ({ id, starred }: { id: string; starred: boolean }) => {
      console.log(`Mock: Marking email ${id} as ${starred ? 'starred' : 'unstarred'}`);
      return Promise.resolve();
    }
  });
};

export const useMarkAsRead = () => {
  // If we have a Gmail token, use the Gmail mark as read mutation
  if (isGmailAuthenticated()) {
    return useMarkGmailMessageAsRead();
  }
  
  // Return a mock implementation for demonstration
  return useMutation({
    mutationFn: (id: string) => {
      console.log(`Mock: Marking email ${id} as read`);
      return Promise.resolve();
    }
  });
};
