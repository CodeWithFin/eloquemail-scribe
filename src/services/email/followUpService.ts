// Service for managing email follow-ups
import { v4 as uuidv4 } from 'uuid';

export interface FollowUp {
  id: string;
  emailId: string;
  subject: string;
  recipient: string;
  dueDate: string; // ISO date string
  notes?: string;
  status: 'pending' | 'completed' | 'snoozed';
  createdAt: string; // ISO date string
  priority: 'high' | 'medium' | 'low';
}

const STORAGE_KEY = 'emailbuddy_followups';

// Helper function to load follow-ups from localStorage
const loadFollowUps = (): FollowUp[] => {
  try {
    const storedFollowUps = localStorage.getItem(STORAGE_KEY);
    return storedFollowUps ? JSON.parse(storedFollowUps) : [];
  } catch (error) {
    console.error('Error loading follow-ups:', error);
    return [];
  }
};

// Helper function to save follow-ups to localStorage
const saveFollowUps = (followUps: FollowUp[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(followUps));
  } catch (error) {
    console.error('Error saving follow-ups:', error);
  }
};

// Create a new follow-up
export const createFollowUp = (
  data: Omit<FollowUp, 'id' | 'createdAt'>
): FollowUp => {
  const followUps = loadFollowUps();
  
  const followUp: FollowUp = {
    ...data,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  
  saveFollowUps([...followUps, followUp]);
  
  // Set up a check for due follow-ups
  setupFollowUpCheck();
  
  return followUp;
};

// Get all follow-ups
export const getFollowUps = (): FollowUp[] => {
  return loadFollowUps();
};

// Get a specific follow-up by ID
export const getFollowUpById = (id: string): FollowUp | undefined => {
  const followUps = loadFollowUps();
  return followUps.find(followUp => followUp.id === id);
};

// Update a follow-up status
export const updateFollowUpStatus = (
  id: string, 
  status: 'pending' | 'completed' | 'snoozed'
): FollowUp | undefined => {
  const followUps = loadFollowUps();
  const followUpIndex = followUps.findIndex(followUp => followUp.id === id);
  
  if (followUpIndex === -1) return undefined;
  
  const updatedFollowUp = { 
    ...followUps[followUpIndex], 
    status 
  };
  
  const updatedFollowUps = [...followUps];
  updatedFollowUps[followUpIndex] = updatedFollowUp;
  
  saveFollowUps(updatedFollowUps);
  
  return updatedFollowUp;
};

// Delete a follow-up by ID
export const deleteFollowUp = (id: string): boolean => {
  const followUps = loadFollowUps();
  const followUpIndex = followUps.findIndex(followUp => followUp.id === id);
  
  if (followUpIndex === -1) return false;
  
  const updatedFollowUps = [...followUps];
  updatedFollowUps.splice(followUpIndex, 1);
  saveFollowUps(updatedFollowUps);
  
  return true;
};

// Update a follow-up's due date
export const updateFollowUpDueDate = (
  id: string, 
  dueDate: string
): FollowUp | undefined => {
  const followUps = loadFollowUps();
  const followUpIndex = followUps.findIndex(followUp => followUp.id === id);
  
  if (followUpIndex === -1) return undefined;
  
  const updatedFollowUp = { 
    ...followUps[followUpIndex], 
    dueDate 
  };
  
  const updatedFollowUps = [...followUps];
  updatedFollowUps[followUpIndex] = updatedFollowUp;
  
  saveFollowUps(updatedFollowUps);
  
  return updatedFollowUp;
};

// Check if there are any follow-ups that are due
export const checkDueFollowUps = (): FollowUp[] => {
  const followUps = loadFollowUps();
  const now = new Date();
  
  return followUps.filter(followUp => {
    if (followUp.status === 'pending') {
      const dueDate = new Date(followUp.dueDate);
      return dueDate <= now;
    }
    return false;
  });
};

// Setup a periodic check for follow-ups
// In a real app, this would be handled by a server-side process
let checkInterval: ReturnType<typeof setInterval> | null = null;

export const setupFollowUpCheck = (): void => {
  if (checkInterval) return;
  
  // Check every hour for follow-ups that are due
  checkInterval = setInterval(() => {
    const dueFollowUps = checkDueFollowUps();
    if (dueFollowUps.length > 0) {
      console.log('Due follow-ups:', dueFollowUps);
      // In a real app, this would trigger notifications
    }
  }, 3600000); // 1 hour
};

export const clearFollowUpCheck = (): void => {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
};

// Initialize the follow-up check when the service is imported
setupFollowUpCheck();
