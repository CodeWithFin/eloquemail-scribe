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
  
  // Request notification permission if needed
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  
  // Initial check
  const initialDueFollowUps = checkDueFollowUps();
  if (initialDueFollowUps.length > 0) {
    notifyDueFollowUps(initialDueFollowUps);
  }
  
  // Check every hour for follow-ups that are due
  checkInterval = setInterval(() => {
    const dueFollowUps = checkDueFollowUps();
    if (dueFollowUps.length > 0) {
      notifyDueFollowUps(dueFollowUps);
      
      // Dispatch a custom event that parts of the UI can listen for
      window.dispatchEvent(new CustomEvent('followupdue', { 
        detail: { followUps: dueFollowUps } 
      }));
    }
  }, 3600000); // 1 hour
};

// Helper function to notify about due follow-ups
const notifyDueFollowUps = (followUps: FollowUp[]): void => {
  // Send browser notifications if permission is granted
  if ('Notification' in window && Notification.permission === 'granted') {
    // Group notification if multiple follow-ups are due
    if (followUps.length > 1) {
      new Notification('Follow-ups Due', {
        body: `You have ${followUps.length} follow-ups that require your attention.`,
        icon: '/favicon.ico'
      });
    } else {
      // Individual notification for a single follow-up
      new Notification('Follow-up Due', {
        body: `Follow-up "${followUps[0].subject}" with ${followUps[0].recipient} is due.`,
        icon: '/favicon.ico'
      });
    }
  }
  
  // Log for debugging
  console.log('Due follow-ups:', followUps);
};

// Send automated follow-up emails for overdue follow-ups
export const sendAutomatedFollowUps = async (
  followUps: FollowUp[],
  sendFunction: (emailData: { to: string; subject: string; body: string; }) => Promise<boolean>
): Promise<{
  sent: string[];
  failed: string[];
}> => {
  const results = {
    sent: [] as string[],
    failed: [] as string[]
  };
  
  // Get only follow-ups that are more than 24 hours overdue
  const overdueFollowUps = followUps.filter(followUp => {
    const dueDate = new Date(followUp.dueDate);
    const now = new Date();
    const diffInHours = (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60);
    return diffInHours > 24;
  });
  
  // Generate and send follow-up emails
  for (const followUp of overdueFollowUps) {
    try {
      const emailData = generateFollowUpEmail(followUp);
      const success = await sendFunction(emailData);
      
      if (success) {
        // Update the follow-up status to reflect that a follow-up was sent
        updateFollowUpStatus(followUp.id, 'pending');
        results.sent.push(followUp.id);
      } else {
        results.failed.push(followUp.id);
      }
    } catch (error) {
      console.error(`Error sending automated follow-up for ${followUp.id}:`, error);
      results.failed.push(followUp.id);
    }
  }
  
  return results;
};

export const clearFollowUpCheck = (): void => {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
};

// Initialize the follow-up check when the service is imported
setupFollowUpCheck();

// Generate a follow-up email template for a due follow-up
export const generateFollowUpEmail = (followUp: FollowUp): {
  to: string;
  subject: string;
  body: string;
} => {
  const daysSinceCreation = Math.floor(
    (new Date().getTime() - new Date(followUp.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Subject line with appropriate prefix
  const subject = `Follow-up: ${followUp.subject}`;
  
  // Build email body based on priority and time elapsed
  let body = `Dear ${followUp.recipient},\n\n`;
  
  if (followUp.priority === 'high') {
    body += `I'm following up on our previous communication regarding "${followUp.subject}" as this matter requires urgent attention.\n\n`;
  } else if (daysSinceCreation > 7) {
    body += `I wanted to circle back on "${followUp.subject}" which we discussed ${daysSinceCreation} days ago.\n\n`;
  } else {
    body += `I'm following up regarding "${followUp.subject}" to ensure we keep this matter moving forward.\n\n`;
  }
  
  // Add notes if available
  if (followUp.notes) {
    body += `As a reminder, here are the key points:\n${followUp.notes}\n\n`;
  }
  
  // Add appropriate closing based on priority
  if (followUp.priority === 'high') {
    body += 'Could you please provide an update at your earliest convenience?\n\n';
  } else if (followUp.priority === 'medium') {
    body += 'When you have a moment, I\'d appreciate an update on this matter.\n\n';
  } else {
    body += 'Please let me know if you need any additional information from me.\n\n';
  }
  
  body += 'Thank you,\n[Your Name]';
  
  return {
    to: followUp.recipient,
    subject,
    body
  };
};
