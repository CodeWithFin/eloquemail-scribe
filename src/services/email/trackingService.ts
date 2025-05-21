// Service for handling email tracking features including read receipts
import { v4 as uuidv4 } from 'uuid';

export interface EmailTracking {
  id: string;
  emailId: string;
  subject: string;
  recipient: string;
  sentAt: string; // ISO date string
  readAt?: string; // ISO date string, undefined if not read yet
  clickedLinks?: { 
    url: string;
    clickedAt: string;
  }[];
  status: 'sent' | 'delivered' | 'read' | 'failed';
}

const STORAGE_KEY = 'emailbuddy_tracking';

// Helper function to load tracked emails from localStorage
const loadTrackedEmails = (): EmailTracking[] => {
  try {
    const storedTracking = localStorage.getItem(STORAGE_KEY);
    return storedTracking ? JSON.parse(storedTracking) : [];
  } catch (error) {
    console.error('Error loading tracked emails:', error);
    return [];
  }
};

// Helper function to save tracked emails to localStorage
const saveTrackedEmails = (tracking: EmailTracking[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tracking));
  } catch (error) {
    console.error('Error saving tracked emails:', error);
  }
};

// Create tracking record for a sent email
export const createEmailTracking = (
  data: Omit<EmailTracking, 'id' | 'clickedLinks' | 'status' | 'readAt'>
): EmailTracking => {
  const tracked = loadTrackedEmails();
  
  const newTracking: EmailTracking = {
    ...data,
    id: uuidv4(),
    status: 'sent',
    clickedLinks: [],
  };
  
  saveTrackedEmails([...tracked, newTracking]);
  return newTracking;
};

// Get all tracked emails
export const getTrackedEmails = (): EmailTracking[] => {
  return loadTrackedEmails();
};

// Get tracking info for a specific email
export const getEmailTracking = (emailId: string): EmailTracking | undefined => {
  const tracked = loadTrackedEmails();
  return tracked.find(item => item.emailId === emailId);
};

// Mark email as read
export const markEmailAsRead = (id: string): EmailTracking | undefined => {
  const tracked = loadTrackedEmails();
  const trackingIndex = tracked.findIndex(item => item.id === id);
  
  if (trackingIndex === -1) return undefined;
  
  const updatedTracking = { 
    ...tracked[trackingIndex], 
    status: 'read' as const,
    readAt: new Date().toISOString()
  };
  
  const updatedTrackings = [...tracked];
  updatedTrackings[trackingIndex] = updatedTracking;
  
  saveTrackedEmails(updatedTrackings);
  return updatedTracking;
};

// Track link click in an email
export const trackLinkClick = (id: string, url: string): EmailTracking | undefined => {
  const tracked = loadTrackedEmails();
  const trackingIndex = tracked.findIndex(item => item.id === id);
  
  if (trackingIndex === -1) return undefined;
  
  const existingTracking = tracked[trackingIndex];
  const clickedLinks = [...(existingTracking.clickedLinks || [])];
  
  // Add link click if it doesn't exist already
  if (!clickedLinks.some(link => link.url === url)) {
    clickedLinks.push({
      url,
      clickedAt: new Date().toISOString()
    });
  }
  
  const updatedTracking = {
    ...existingTracking,
    clickedLinks
  };
  
  const updatedTrackings = [...tracked];
  updatedTrackings[trackingIndex] = updatedTracking;
  
  saveTrackedEmails(updatedTrackings);
  return updatedTracking;
};

// Generate a tracking pixel for read receipts
export const generateTrackingPixel = (trackingId: string): string => {
  // In a real implementation, this would create a URL to a server endpoint
  // that registers when the image is loaded. For our demo, we'll simulate this locally.
  return `data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7#${trackingId}`;
};

// Generate tracking URLs for links in email content
export const addTrackingToLinks = (content: string, trackingId: string): string => {
  // Replace all <a href="..."> links with tracked versions
  // In a real app, this would rewrite links to go through a tracking server
  // For our demo, we'll just add a tracking parameter
  
  return content.replace(
    /<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>/gi,
    (match, url, rest) => {
      // Add tracking parameter to URL
      const separator = url.includes('?') ? '&' : '?';
      const trackedUrl = `${url}${separator}tracking=${trackingId}`;
      return `<a href="${trackedUrl}"${rest}>`;
    }
  );
};

// Simulate tracking pixel load (in a real app, this would be handled by the server)
export const simulateReadReceipt = (trackingId: string): void => {
  setTimeout(() => {
    markEmailAsRead(trackingId);
  }, Math.random() * 10000 + 5000); // Random time between 5-15 seconds
};

// Simulate link click (in a real app, this would be handled by the server)
export const simulateLinkClick = (trackingId: string, url: string): void => {
  setTimeout(() => {
    trackLinkClick(trackingId, url);
  }, Math.random() * 20000 + 10000); // Random time between 10-30 seconds
};
