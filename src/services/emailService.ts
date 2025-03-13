
import { useQuery } from '@tanstack/react-query';

export interface Email {
  id: string;
  subject: string;
  sender: string;
  preview: string;
  date: string;
  read: boolean;
  starred: boolean;
  category?: 'primary' | 'social' | 'promotions';
}

// This function would be replaced with actual API calls in a production app
const fetchEmails = async (): Promise<Email[]> => {
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
  return useQuery({
    queryKey: ['emails'],
    queryFn: fetchEmails,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const starEmail = async (id: string, starred: boolean): Promise<void> => {
  // In a real app, this would call an API endpoint
  console.log(`Marking email ${id} as ${starred ? 'starred' : 'unstarred'}`);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
};

export const markAsRead = async (id: string): Promise<void> => {
  // In a real app, this would call an API endpoint
  console.log(`Marking email ${id} as read`);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));
};
