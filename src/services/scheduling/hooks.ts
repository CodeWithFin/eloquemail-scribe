import { useQuery, useMutation, UseQueryResult, useQueryClient } from '@tanstack/react-query';
import { ScheduledEmail, ScheduleEmailInput } from './types';

// For demo purposes, store scheduled emails in localStorage
const STORAGE_KEY = 'scheduled_emails';

const getScheduledEmails = (): ScheduledEmail[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveScheduledEmails = (emails: ScheduledEmail[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(emails));
};

// Service function to schedule an email
const scheduleEmail = async (input: ScheduleEmailInput): Promise<ScheduledEmail> => {
  const id = Math.random().toString(36).substring(2);
  const timestamp = new Date().toISOString();
  
  const newScheduledEmail: ScheduledEmail = {
    id,
    email: input.email,
    scheduledTime: input.scheduledTime,
    status: 'scheduled',
    createdAt: timestamp,
    updatedAt: timestamp
  };
  
  const emails = getScheduledEmails();
  emails.push(newScheduledEmail);
  saveScheduledEmails(emails);
  
  return newScheduledEmail;
};

// Service function to update a scheduled email
const updateScheduledEmail = async (id: string, input: Partial<ScheduleEmailInput>): Promise<ScheduledEmail> => {
  const emails = getScheduledEmails();
  const index = emails.findIndex(email => email.id === id);
  
  if (index === -1) {
    throw new Error('Scheduled email not found');
  }
  
  const updatedEmail = {
    ...emails[index],
    ...(input.email && { email: input.email }),
    ...(input.scheduledTime && { scheduledTime: input.scheduledTime }),
    updatedAt: new Date().toISOString()
  };
  
  emails[index] = updatedEmail;
  saveScheduledEmails(emails);
  
  return updatedEmail;
};

// Service function to delete a scheduled email
const deleteScheduledEmail = async (id: string): Promise<void> => {
  const emails = getScheduledEmails();
  const filteredEmails = emails.filter(email => email.id !== id);
  saveScheduledEmails(filteredEmails);
};

// Hook to fetch scheduled emails
export const useScheduledEmails = (): UseQueryResult<ScheduledEmail[], Error> => {
  return useQuery({
    queryKey: ['scheduledEmails'],
    queryFn: getScheduledEmails,
    refetchInterval: 60000, // Refetch every minute to check for emails that need to be sent
  });
};

// Hook to schedule an email
export const useScheduleEmail = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: scheduleEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledEmails'] });
    }
  });
};

// Hook to update a scheduled email
export const useUpdateScheduledEmail = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ScheduleEmailInput> }) =>
      updateScheduledEmail(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledEmails'] });
    }
  });
};

// Hook to delete a scheduled email
export const useDeleteScheduledEmail = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteScheduledEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledEmails'] });
    }
  });
};
