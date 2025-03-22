
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  convertAurinkoToEmail, 
  useAurinkoMessages, 
  useStarAurinkoMessage, 
  useMarkAurinkoMessageAsRead,
  isAurinkoAuthenticated
} from './aurinko';

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

// We'll use this flag to determine if we're using mock data or real email
const isUsingAurinko = isAurinkoAuthenticated();

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
  const token = localStorage.getItem('aurinko_token');
  const aurinkoQuery = useAurinkoMessages(token);
  
  const mockEmailsQuery = useQuery({
    queryKey: ['emails'],
    queryFn: fetchEmails,
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !isUsingAurinko,
  });
  
  // If we have an Aurinko token, use Aurinko data, otherwise use mock data
  if (isUsingAurinko && token) {
    return {
      ...aurinkoQuery,
      data: aurinkoQuery.data?.map(convertAurinkoToEmail) as Email[] || []
    };
  }
  
  return mockEmailsQuery;
};

export const starEmail = async (id: string, starred: boolean): Promise<void> => {
  if (isUsingAurinko) {
    const mutation = useStarAurinkoMessage();
    await mutation.mutateAsync({ id, starred });
    return;
  }
  
  // In a real app, this would call an API endpoint
  console.log(`Marking email ${id} as ${starred ? 'starred' : 'unstarred'}`);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
};

export const markAsRead = async (id: string): Promise<void> => {
  if (isUsingAurinko) {
    const mutation = useMarkAurinkoMessageAsRead();
    await mutation.mutateAsync(id);
    return;
  }
  
  // In a real app, this would call an API endpoint
  console.log(`Marking email ${id} as read`);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));
};

// Hook to handle starring emails
export const useStarEmail = () => {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('aurinko_token');
  
  // If we have an Aurinko token, use the Aurinko star mutation
  if (isUsingAurinko && token) {
    return useStarAurinkoMessage();
  }
  
  return useMutation({
    mutationFn: ({ id, starred }: { id: string; starred: boolean }) => starEmail(id, starred),
    onMutate: async ({ id, starred }) => {
      // Optimistic update
      queryClient.setQueryData(['emails'], (oldData: any) => 
        oldData ? oldData.map((email: Email) => 
          email.id === id ? { ...email, starred } : email
        ) : []
      );
    },
    onError: () => {
      // Revert on error via refetch
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    }
  });
};

// Hook to handle marking emails as read
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('aurinko_token');
  
  // If we have an Aurinko token, use the Aurinko mark as read mutation
  if (isUsingAurinko && token) {
    return useMarkAurinkoMessageAsRead();
  }
  
  return useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onMutate: async (id) => {
      // Optimistic update
      queryClient.setQueryData(['emails'], (oldData: any) => 
        oldData ? oldData.map((email: Email) => 
          email.id === id ? { ...email, read: true } : email
        ) : []
      );
    },
    onError: () => {
      // Revert on error via refetch
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    }
  });
};
