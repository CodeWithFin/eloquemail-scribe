// Service for handling email scheduling features
import { v4 as uuidv4 } from 'uuid';

export interface ScheduledEmail {
  id: string;
  emailId: string; // Original draft ID if available
  subject: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  body: string;
  scheduledTime: string; // ISO date string
  status: 'pending' | 'sent' | 'failed';
  createdAt: string; // ISO date string
}

const STORAGE_KEY = 'emailbuddy_scheduled_emails';

// Helper function to load scheduled emails from localStorage
const loadScheduledEmails = (): ScheduledEmail[] => {
  try {
    const storedEmails = localStorage.getItem(STORAGE_KEY);
    return storedEmails ? JSON.parse(storedEmails) : [];
  } catch (error) {
    console.error('Error loading scheduled emails:', error);
    return [];
  }
};

// Helper function to save scheduled emails to localStorage
const saveScheduledEmails = (emails: ScheduledEmail[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emails));
  } catch (error) {
    console.error('Error saving scheduled emails:', error);
  }
};

// Create a new scheduled email
export const scheduleEmail = (
  emailData: Omit<ScheduledEmail, 'id' | 'status' | 'createdAt'>
): ScheduledEmail => {
  const existingEmails = loadScheduledEmails();
  
  const scheduledEmail: ScheduledEmail = {
    ...emailData,
    id: uuidv4(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  saveScheduledEmails([...existingEmails, scheduledEmail]);
  
  // In a real app, we would set up a background task to send the email at the scheduled time
  // Since this is a client-side demo, we'll implement a periodic check for due emails
  setupScheduledEmailCheck();
  
  return scheduledEmail;
};

// Get all scheduled emails
export const getScheduledEmails = (): ScheduledEmail[] => {
  return loadScheduledEmails();
};

// Get a specific scheduled email by ID
export const getScheduledEmailById = (id: string): ScheduledEmail | undefined => {
  const emails = loadScheduledEmails();
  return emails.find(email => email.id === id);
};

// Cancel a scheduled email by ID
export const cancelScheduledEmail = (id: string): boolean => {
  const emails = loadScheduledEmails();
  const emailIndex = emails.findIndex(email => email.id === id);
  
  if (emailIndex === -1) return false;
  
  const updatedEmails = [...emails];
  updatedEmails.splice(emailIndex, 1);
  saveScheduledEmails(updatedEmails);
  
  return true;
};

// Update a scheduled email
export const updateScheduledEmail = (
  id: string, 
  updates: Partial<Omit<ScheduledEmail, 'id' | 'createdAt'>>
): ScheduledEmail | undefined => {
  const emails = loadScheduledEmails();
  const emailIndex = emails.findIndex(email => email.id === id);
  
  if (emailIndex === -1) return undefined;
  
  const updatedEmail = { ...emails[emailIndex], ...updates };
  const updatedEmails = [...emails];
  updatedEmails[emailIndex] = updatedEmail;
  
  saveScheduledEmails(updatedEmails);
  return updatedEmail;
};

// Check if there are any emails that need to be sent
export const checkScheduledEmails = (): void => {
  const emails = loadScheduledEmails();
  const now = new Date();
  let updated = false;
  
  const updatedEmails = emails.map(email => {
    if (email.status === 'pending' && new Date(email.scheduledTime) <= now) {
      updated = true;
      // In a real app, we'd actually send the email here
      // For the demo, we'll just mark it as sent
      return { ...email, status: 'sent' as const };
    }
    return email;
  });
  
  if (updated) {
    saveScheduledEmails(updatedEmails);
  }
};

// Setup a periodic check for scheduled emails
// In a real app, this would be handled by a server-side process
let checkInterval: ReturnType<typeof setInterval> | null = null;

export const setupScheduledEmailCheck = (): void => {
  if (checkInterval) return;
  
  // Check every minute for emails that need to be sent
  checkInterval = setInterval(() => {
    checkScheduledEmails();
  }, 60000); // 60 seconds
};

export const clearScheduledEmailCheck = (): void => {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
};

// Initialize the scheduled email check when the service is imported
setupScheduledEmailCheck();
