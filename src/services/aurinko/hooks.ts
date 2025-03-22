
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  getAurinkoProfile, 
  getAurinkoMessages, 
  toggleAurinkoMessageStar,
  markAurinkoMessageAsRead,
  initiateAurinkoAuth,
} from './';

// Hook for Aurinko authentication flow
export const useAurinkoAuth = () => {
  return useMutation({
    mutationFn: initiateAurinkoAuth,
  });
};

// Hook for fetching Aurinko profile
export const useAurinkoProfile = (token: string | null) => {
  return useQuery({
    queryKey: ['aurinkoProfile', token],
    queryFn: () => getAurinkoProfile(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for fetching Aurinko messages
export const useAurinkoMessages = (token: string | null) => {
  return useQuery({
    queryKey: ['aurinkoMessages', token],
    queryFn: () => getAurinkoMessages(token),
    enabled: !!token,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Hook for starring/unstarring Aurinko messages
export const useStarAurinkoMessage = () => {
  return useMutation({
    mutationFn: ({ 
      id, 
      starred 
    }: { 
      id: string; 
      starred: boolean;
    }) => {
      const token = localStorage.getItem('aurinko_token');
      return toggleAurinkoMessageStar(token, id, starred);
    },
  });
};

// Hook for marking Aurinko messages as read
export const useMarkAurinkoMessageAsRead = () => {
  return useMutation({
    mutationFn: (id: string) => {
      const token = localStorage.getItem('aurinko_token');
      return markAurinkoMessageAsRead(token, id);
    },
  });
};
