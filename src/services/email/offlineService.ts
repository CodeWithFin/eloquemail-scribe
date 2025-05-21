// Service for handling offline email functionality
import { v4 as uuidv4 } from 'uuid';

export interface OfflineEmail {
  id: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  createdAt: string; // ISO date string
  status: 'pending' | 'sent' | 'draft';
}

const STORAGE_KEY = 'emailbuddy_offline_emails';

// Helper function to load offline emails from localStorage
export const loadOfflineEmails = (): OfflineEmail[] => {
  try {
    const storedEmails = localStorage.getItem(STORAGE_KEY);
    return storedEmails ? JSON.parse(storedEmails) : [];
  } catch (error) {
    console.error('Error loading offline emails:', error);
    return [];
  }
};

// Helper function to save offline emails to localStorage
export const saveOfflineEmails = (emails: OfflineEmail[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emails));
  } catch (error) {
    console.error('Error saving offline emails:', error);
  }
};

// Create a new offline email (draft or pending)
export const createOfflineEmail = (
  data: Omit<OfflineEmail, 'id' | 'createdAt'>
): OfflineEmail => {
  const emails = loadOfflineEmails();
  
  const offlineEmail: OfflineEmail = {
    ...data,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  
  saveOfflineEmails([...emails, offlineEmail]);
  return offlineEmail;
};

// Get all offline emails
export const getOfflineEmails = (): OfflineEmail[] => {
  return loadOfflineEmails();
};

// Get offline emails by status
export const getOfflineEmailsByStatus = (status: OfflineEmail['status']): OfflineEmail[] => {
  const emails = loadOfflineEmails();
  return emails.filter(email => email.status === status);
};

// Get a specific offline email by ID
export const getOfflineEmailById = (id: string): OfflineEmail | undefined => {
  const emails = loadOfflineEmails();
  return emails.find(email => email.id === id);
};

// Update an offline email
export const updateOfflineEmail = (
  id: string,
  updates: Partial<Omit<OfflineEmail, 'id' | 'createdAt'>>
): OfflineEmail | undefined => {
  const emails = loadOfflineEmails();
  const emailIndex = emails.findIndex(email => email.id === id);
  
  if (emailIndex === -1) return undefined;
  
  const updatedEmail = { ...emails[emailIndex], ...updates };
  const updatedEmails = [...emails];
  updatedEmails[emailIndex] = updatedEmail;
  
  saveOfflineEmails(updatedEmails);
  return updatedEmail;
};

// Delete an offline email
export const deleteOfflineEmail = (id: string): boolean => {
  const emails = loadOfflineEmails();
  const emailIndex = emails.findIndex(email => email.id === id);
  
  if (emailIndex === -1) return false;
  
  const updatedEmails = [...emails];
  updatedEmails.splice(emailIndex, 1);
  saveOfflineEmails(updatedEmails);
  
  return true;
};

// Attempt to send pending offline emails when online
export const processPendingOfflineEmails = async (
  sendFunction: (email: OfflineEmail) => Promise<boolean>
): Promise<{ success: string[]; failed: string[] }> => {
  const emails = loadOfflineEmails();
  const pendingEmails = emails.filter(email => email.status === 'pending');
  
  const results = {
    success: [] as string[],
    failed: [] as string[]
  };
  
  // Process each pending email
  for (const email of pendingEmails) {
    try {
      const success = await sendFunction(email);
      if (success) {
        // Mark as sent or remove from offline storage
        updateOfflineEmail(email.id, { status: 'sent' });
        results.success.push(email.id);
      } else {
        results.failed.push(email.id);
      }
    } catch (error) {
      console.error('Error sending offline email:', error);
      results.failed.push(email.id);
    }
  }
  
  return results;
};

// Check if the user is online
export const isOnline = (): boolean => {
  return window.navigator.onLine;
};

// Set up network status change listeners
export const setupOfflineListeners = (
  onOffline: () => void,
  onOnline: () => void
): () => void => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};