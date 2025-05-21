import { type EmailAnalysis, type GeneratedReply } from './types';

// Interface for auto-reply log entries
interface AutoReplyLogEntry {
  id: string;
  timestamp: number;
  emailContent: string;
  emailSubject?: string;
  emailSender?: string;
  analysis: EmailAnalysis;
  generatedReply: GeneratedReply;
  wasUsed: boolean; // Whether the user used this reply
  wasEdited: boolean; // Whether the user edited the reply before sending
  timeTaken: number; // Time in ms between generation and use
  userFeedback?: {
    rating?: number; // 1-5 star rating
    comments?: string;
    improvementSuggestions?: string;
  };
}

// Configuration for logging
const LOG_CONFIG = {
  MAX_ENTRIES: 100, // Maximum number of entries to keep in local storage
  RETENTION_DAYS: 30, // Number of days to keep logs before auto-deletion
  STORAGE_KEY: 'email_buddy_auto_reply_logs'
};

// Load logs from local storage
const loadLogs = (): AutoReplyLogEntry[] => {
  try {
    const storedLogs = localStorage.getItem(LOG_CONFIG.STORAGE_KEY);
    return storedLogs ? JSON.parse(storedLogs) : [];
  } catch (error) {
    console.error('Error loading auto-reply logs:', error);
    return [];
  }
};

// Save logs to local storage
const saveLogs = (logs: AutoReplyLogEntry[]): void => {
  try {
    localStorage.setItem(LOG_CONFIG.STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Error saving auto-reply logs:', error);
  }
};

// Add a new log entry
export const logAutoReply = (
  emailContent: string,
  analysis: EmailAnalysis,
  generatedReply: GeneratedReply,
  emailSubject?: string,
  emailSender?: string
): string => {
  const logs = loadLogs();
  
  // Generate a unique ID
  const id = `ar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Create new log entry
  const newEntry: AutoReplyLogEntry = {
    id,
    timestamp: Date.now(),
    emailContent,
    emailSubject,
    emailSender,
    analysis,
    generatedReply,
    wasUsed: false,
    wasEdited: false,
    timeTaken: 0
  };
  
  // Add to logs
  logs.unshift(newEntry);
  
  // Trim logs if needed
  if (logs.length > LOG_CONFIG.MAX_ENTRIES) {
    logs.length = LOG_CONFIG.MAX_ENTRIES;
  }
  
  // Remove old logs
  const oldestAllowed = Date.now() - (LOG_CONFIG.RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const filteredLogs = logs.filter(log => log.timestamp >= oldestAllowed);
  
  // Save updated logs
  saveLogs(filteredLogs);
  
  return id;
};

// Update a log entry when the reply is used
export const markReplyAsUsed = (id: string, wasEdited: boolean): void => {
  const logs = loadLogs();
  const logIndex = logs.findIndex(log => log.id === id);
  
  if (logIndex !== -1) {
    logs[logIndex].wasUsed = true;
    logs[logIndex].wasEdited = wasEdited;
    logs[logIndex].timeTaken = Date.now() - logs[logIndex].timestamp;
    saveLogs(logs);
  }
};

// Add user feedback to a log entry
export const addFeedbackToLog = (
  id: string, 
  rating?: number, 
  comments?: string, 
  improvementSuggestions?: string
): void => {
  const logs = loadLogs();
  const logIndex = logs.findIndex(log => log.id === id);
  
  if (logIndex !== -1) {
    logs[logIndex].userFeedback = {
      rating,
      comments,
      improvementSuggestions
    };
    saveLogs(logs);
  }
};

// Get all logs
export const getAllLogs = (): AutoReplyLogEntry[] => {
  return loadLogs();
};

// Get logs with low confidence or that required human review
export const getLogsRequiringAttention = (): AutoReplyLogEntry[] => {
  const logs = loadLogs();
  return logs.filter(log => 
    log.analysis.metadata.requiresHumanReview || 
    log.generatedReply.metadata.confidence < 0.7
  );
};

// Get stats for quality review
export const getQualityStats = (): {
  totalReplies: number;
  usedReplies: number;
  editedReplies: number;
  averageConfidence: number;
  humanReviewRequired: number;
  averageRating: number;
} => {
  const logs = loadLogs();
  
  const usedReplies = logs.filter(log => log.wasUsed).length;
  const editedReplies = logs.filter(log => log.wasEdited).length;
  const confidenceSum = logs.reduce((sum, log) => sum + log.generatedReply.metadata.confidence, 0);
  const humanReviewRequired = logs.filter(log => log.analysis.metadata.requiresHumanReview).length;
  
  const logsWithRatings = logs.filter(log => log.userFeedback?.rating !== undefined);
  const ratingSum = logsWithRatings.reduce((sum, log) => sum + (log.userFeedback?.rating || 0), 0);
  
  return {
    totalReplies: logs.length,
    usedReplies,
    editedReplies,
    averageConfidence: logs.length ? confidenceSum / logs.length : 0,
    humanReviewRequired,
    averageRating: logsWithRatings.length ? ratingSum / logsWithRatings.length : 0
  };
};

// Delete a specific log
export const deleteLog = (id: string): void => {
  const logs = loadLogs();
  const filteredLogs = logs.filter(log => log.id !== id);
  saveLogs(filteredLogs);
};

// Clear all logs
export const clearAllLogs = (): void => {
  saveLogs([]);
};

export default {
  logAutoReply,
  markReplyAsUsed,
  addFeedbackToLog,
  getAllLogs,
  getLogsRequiringAttention,
  getQualityStats,
  deleteLog,
  clearAllLogs
};
