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

// This would be replaced with actual Gmail API calls in a production app
const mockGmailAuth = async (): Promise<string> => {
  // Simulate auth flow - in a real app this would redirect to Google OAuth
  console.log('Initiating Gmail authentication flow');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return a mock token - in production this would be a real OAuth token
  return 'mock_gmail_token_123456789';
};

// This function would be replaced with actual Gmail API calls
const fetchGmailProfile = async (token: string): Promise<GmailProfile> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // For demo purposes, fetching mock profile data
  console.log(`Fetching Gmail profile with token: ${token}`);
  
  return {
    emailAddress: 'user@example.com',
    messagesTotal: 125,
    threadsTotal: 80,
    historyId: '12345'
  };
};

// Fetch emails from Gmail API (mocked for now)
const fetchGmailMessages = async (token: string): Promise<GmailMessage[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  console.log(`Fetching Gmail messages with token: ${token}`);
  
  // Create realistic-looking mock data
  const messages: GmailMessage[] = [];
  const senders = ['John Smith', 'Sarah Johnson', 'Tech Newsletter', 'LinkedIn', 'GitHub', 'AWS Notifications'];
  const subjects = [
    'Meeting tomorrow at 2pm',
    'Project update: Phase 2 completed',
    'Your weekly digest',
    'New connection request',
    'Pull request review requested',
    'Your AWS bill is available'
  ];
  
  for (let i = 0; i < 15; i++) {
    const senderIndex = Math.floor(Math.random() * senders.length);
    const subjectIndex = Math.floor(Math.random() * subjects.length);
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 7));
    
    messages.push({
      id: `msg_${i}`,
      threadId: `thread_${i}`,
      labelIds: ['INBOX', Math.random() > 0.3 ? 'UNREAD' : ''],
      snippet: `This is a preview of the email content. Click to read more...`,
      payload: {
        headers: [
          { name: 'From', value: `${senders[senderIndex]} <${senders[senderIndex].toLowerCase().replace(' ', '.')}@example.com>` },
          { name: 'Subject', value: subjects[subjectIndex] },
          { name: 'Date', value: date.toISOString() }
        ],
        mimeType: 'text/plain',
        body: {
          data: '',
          size: 1024
        }
      },
      sizeEstimate: 1024,
      historyId: '12345',
      internalDate: date.getTime().toString()
    });
  }
  
  return messages;
};

export const starGmailMessage = async (id: string, starred: boolean): Promise<void> => {
  // In a real app, this would call the Gmail API to add/remove the STARRED label
  console.log(`Marking Gmail message ${id} as ${starred ? 'starred' : 'unstarred'}`);
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
};

export const markGmailMessageAsRead = async (id: string): Promise<void> => {
  // In a real app, this would call the Gmail API to remove the UNREAD label
  console.log(`Marking Gmail message ${id} as read`);
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));
};

// React Query hooks for Gmail API interactions
export const useGmailAuth = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: mockGmailAuth,
    onSuccess: () => {
      toast({
        title: "Gmail connected",
        description: "Your Gmail account has been successfully connected.",
      });
    },
    onError: () => {
      toast({
        title: "Connection failed",
        description: "Failed to connect to Gmail. Please try again.",
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
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useStarGmailMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, starred }: { id: string; starred: boolean }) => starGmailMessage(id, starred),
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
    onError: (error, variables) => {
      // Revert on error via refetch
      queryClient.invalidateQueries({ queryKey: ['gmailMessages'] });
    }
  });
};

export const useMarkGmailMessageAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => markGmailMessageAsRead(id),
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
