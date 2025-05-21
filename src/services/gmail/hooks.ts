import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { 
  fetchGmailProfile, 
  fetchGmailMessages, 
  starGmailMessage, 
  markGmailMessageAsRead, 
  convertGmailToEmail,
  sendGmailMessage,
  fetchGmailMessageContent,
  createGmailDraft
} from './api';
import { initiateGmailAuth, getGmailToken } from './auth';
import { GmailMessage, EmailDraft } from './types';

/**
 * Hook for initiating Gmail authentication
 */
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

/**
 * Hook for fetching Gmail profile
 */
export const useGmailProfile = (token: string | null) => {
  return useQuery({
    queryKey: ['gmailProfile', token],
    queryFn: () => token ? fetchGmailProfile(token) : Promise.reject('No token'),
    enabled: !!token,
    retry: 1,
  });
};

/**
 * Hook for fetching Gmail messages
 */
export const useGmailMessages = (token: string | null) => {
  const queryClient = useQueryClient();
  const searchQuery = queryClient.getQueryData(['emailSearch']) as string | undefined;
  
  return useQuery({
    queryKey: ['gmailMessages', token, searchQuery],
    queryFn: () => token ? fetchGmailMessages(token, searchQuery) : Promise.reject('No token'),
    enabled: !!token,
    refetchInterval: 300000, // Refetch every 5 minutes instead of every minute
    staleTime: 120000, // Consider data fresh for 2 minutes
    cacheTime: 3600000, // Cache for 1 hour
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    select: (data) => data.map(convertGmailToEmail),
  });
};

/**
 * Hook for starring/unstarring Gmail messages
 */
export const useStarGmailMessage = () => {
  const queryClient = useQueryClient();
  const token = getGmailToken();
  
  return useMutation({
    mutationFn: ({ id, starred }: { id: string; starred: boolean }) => 
      token ? starGmailMessage(id, starred, token) : Promise.reject('No token'),
    onMutate: async ({ id, starred }) => {
      // Optimistic update
      queryClient.setQueryData(['gmailMessages'], (oldData: GmailMessage[] | undefined) => 
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

/**
 * Hook for marking Gmail messages as read
 */
export const useMarkGmailMessageAsRead = () => {
  const queryClient = useQueryClient();
  const token = getGmailToken();
  
  return useMutation({
    mutationFn: (id: string) => token ? markGmailMessageAsRead(id, token) : Promise.reject('No token'),
    onMutate: async (id) => {
      // Optimistic update
      queryClient.setQueryData(['gmailMessages'], (oldData: GmailMessage[] | undefined) => 
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

/**
 * Hook for fetching a single Gmail message content
 */
export const useGmailMessageContent = (messageId: string | null) => {
  const token = getGmailToken();
  
  return useQuery({
    queryKey: ['gmailMessageContent', messageId],
    queryFn: () => messageId && token 
      ? fetchGmailMessageContent(messageId, token) 
      : Promise.reject('No message ID or token'),
    enabled: !!messageId && !!token,
    retry: (failureCount, error) => {
      // Retry up to 3 times unless it's a known permanent error
      if (error instanceof Error) {
        const permanentErrors = [
          'MESSAGE_NOT_FOUND',
          'PERMISSION_DENIED',
          'EMPTY_MESSAGE'
        ];
        if (permanentErrors.includes(error.message)) {
          return false;
        }
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff up to 30s
  });
};

/**
 * Hook for sending an email
 */
export const useSendGmailMessage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const token = getGmailToken();
  
  return useMutation({
    mutationFn: (draft: EmailDraft) => 
      token ? sendGmailMessage(draft, token) : Promise.reject('No token'),
    onSuccess: () => {
      // Invalidate query to refetch messages
      queryClient.invalidateQueries({ queryKey: ['gmailMessages'] });
      
      toast({
        title: "Email sent",
        description: "Your email was sent successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to send email",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    }
  });
};

/**
 * Hook for creating a draft email
 */
export const useCreateGmailDraft = () => {
  const { toast } = useToast();
  const token = getGmailToken();
  
  return useMutation({
    mutationFn: (draft: EmailDraft) => 
      token ? createGmailDraft(draft, token) : Promise.reject('No token'),
    onSuccess: () => {
      toast({
        title: "Draft saved",
        description: "Your draft was saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save draft",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    }
  });
};
