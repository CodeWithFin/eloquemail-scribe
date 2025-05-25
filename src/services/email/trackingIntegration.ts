// Service to integrate tracking features with email composition and sending
import { 
  createEmailTracking, 
  generateTrackingPixel, 
  addTrackingToLinks,
  simulateReadReceipt,
  simulateLinkClick
} from './trackingService';

export interface TrackingOptions {
  trackOpens: boolean;
  trackClicks: boolean;
}

/**
 * Apply tracking to an email before sending
 * @param {Object} emailData - The email data to be sent
 * @param {Object} trackingOptions - Tracking options
 * @returns {Object} The email data with tracking applied
 */
export const applyTrackingToEmail = (
  emailData: { 
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    emailId: string;
  }, 
  trackingOptions: TrackingOptions
) => {
  // Skip if tracking isn't enabled
  if (!trackingOptions.trackOpens && !trackingOptions.trackClicks) {
    return emailData;
  }

  // Create tracking record
  const tracking = createEmailTracking({
    emailId: emailData.emailId,
    to: emailData.to[0], // Use the first recipient for tracking display
    subject: emailData.subject,
    sentAt: new Date().toISOString(),
  });

  // Create modified body with tracking elements
  let modifiedBody = emailData.body;

  // Add tracking pixel if open tracking is enabled
  if (trackingOptions.trackOpens) {
    const trackingPixel = generateTrackingPixel(tracking.id);
    modifiedBody += `<img src="${trackingPixel}" width="1" height="1" alt="" style="display:none" />`;
    
    // For demo purposes, simulate a read receipt
    simulateReadReceipt(tracking.id);
  }

  // Add tracking to links if link tracking is enabled
  if (trackingOptions.trackClicks) {
    modifiedBody = addTrackingToLinks(modifiedBody, tracking.id);
    
    // For demo purposes, simulate a link click on the first link
    const linkMatch = modifiedBody.match(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>/i);
    if (linkMatch && linkMatch[1]) {
      simulateLinkClick(tracking.id, linkMatch[1]);
    }
  }

  return {
    ...emailData,
    body: modifiedBody,
    trackingId: tracking.id
  };
};

/**
 * Determine if an email has been read
 */
export const getEmailReadStatus = (emailId: string): boolean => {
  // This would typically check against the server
  // For now, return a random boolean for demo purposes
  return Math.random() > 0.5;
};

/**
 * Get tracking stats for dashboard
 */
export const getTrackingStats = () => {
  // In a real app, this would aggregate stats from the server
  return {
    totalSent: Math.floor(Math.random() * 100) + 50,
    totalOpened: Math.floor(Math.random() * 50) + 20,
    openRate: Math.floor(Math.random() * 30) + 40, // 40-70% open rate
    clickRate: Math.floor(Math.random() * 20) + 10, // 10-30% click rate
  };
};
