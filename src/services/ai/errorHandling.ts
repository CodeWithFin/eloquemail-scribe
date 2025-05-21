import { type EmailAnalysis, type GeneratedReply } from './types';

// Interface for tracking error occurrences
interface ErrorTracking {
  lastError: {
    timestamp: number;
    message: string;
    context: string;
  } | null;
  errorCounts: {
    [key: string]: {
      count: number;
      firstSeen: number;
      lastSeen: number;
    };
  };
}

// Error handling configuration
const ERROR_CONFIG = {
  MAX_RETRIES: 2,
  FALLBACK_THRESHOLD: 3, // Number of errors before using fallback mode
  ERROR_RESET_TIME: 24 * 60 * 60 * 1000, // 24 hours
  STORAGE_KEY: 'email_buddy_error_tracking'
};

// Initialize or load error tracking data from localStorage
const initErrorTracking = (): ErrorTracking => {
  try {
    const storedData = localStorage.getItem(ERROR_CONFIG.STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : {
      lastError: null,
      errorCounts: {}
    };
  } catch (error) {
    console.error('Error loading error tracking data:', error);
    return {
      lastError: null,
      errorCounts: {}
    };
  }
};

// Save error tracking data to localStorage
const saveErrorTracking = (data: ErrorTracking): void => {
  try {
    localStorage.setItem(ERROR_CONFIG.STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving error tracking data:', error);
  }
};

// Current error tracking state
let errorTracking = initErrorTracking();

// Record a new error occurrence
export const trackError = (operation: string, error: Error, context: string = ''): void => {
  const errorKey = `${operation}:${error.message}`;
  const now = Date.now();
  
  // Update last error
  errorTracking.lastError = {
    timestamp: now,
    message: error.message,
    context
  };
  
  // Update error counts
  if (errorTracking.errorCounts[errorKey]) {
    errorTracking.errorCounts[errorKey].count += 1;
    errorTracking.errorCounts[errorKey].lastSeen = now;
  } else {
    errorTracking.errorCounts[errorKey] = {
      count: 1,
      firstSeen: now,
      lastSeen: now
    };
  }
  
  // Clean up old errors
  const oldestAllowed = now - ERROR_CONFIG.ERROR_RESET_TIME;
  for (const key in errorTracking.errorCounts) {
    if (errorTracking.errorCounts[key].lastSeen < oldestAllowed) {
      delete errorTracking.errorCounts[key];
    }
  }
  
  // Save updated tracking data
  saveErrorTracking(errorTracking);
  
  // Log to console for debugging
  console.error(`${operation} error:`, error.message, 'Context:', context || 'none');
};

// Check if we're in fallback mode due to repeated errors
export const shouldUseFallback = (operation: string): boolean => {
  // Check error counts for this operation
  const operationErrors = Object.keys(errorTracking.errorCounts)
    .filter(key => key.startsWith(`${operation}:`))
    .reduce((sum, key) => sum + errorTracking.errorCounts[key].count, 0);
    
  return operationErrors >= ERROR_CONFIG.FALLBACK_THRESHOLD;
};

// Safe version of email analysis with error handling and fallbacks
export const safelyAnalyzeEmail = async (
  analyzeFunction: (content: string) => Promise<EmailAnalysis>,
  emailContent: string
): Promise<EmailAnalysis> => {
  // Check if we should use fallback mode
  if (shouldUseFallback('analyzeEmail')) {
    console.warn('Using fallback mode for email analysis due to repeated errors');
    return generateFallbackEmailAnalysis(emailContent);
  }
  
  try {
    // Attempt to analyze with retries
    for (let attempt = 0; attempt <= ERROR_CONFIG.MAX_RETRIES; attempt++) {
      try {
        return await analyzeFunction(emailContent);
      } catch (error) {
        if (attempt === ERROR_CONFIG.MAX_RETRIES) {
          throw error; // Rethrow on final attempt
        }
        // Wait a bit before retrying (exponential backoff)
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
    
    // This should never be reached due to the throw above
    throw new Error('Unexpected end of retry loop');
  } catch (error) {
    if (error instanceof Error) {
      trackError('analyzeEmail', error, emailContent.substring(0, 100) + '...');
    } else {
      trackError('analyzeEmail', new Error('Unknown error'), emailContent.substring(0, 100) + '...');
    }
    
    // Return fallback analysis on failure
    return generateFallbackEmailAnalysis(emailContent);
  }
};

// Safe version of generating smart replies with error handling
export const safelyGenerateSmartReplies = async (
  generateFunction: (content: string) => Promise<string[]>,
  emailContent: string
): Promise<string[]> => {
  // Check if we should use fallback mode
  if (shouldUseFallback('generateSmartReplies')) {
    console.warn('Using fallback mode for smart replies due to repeated errors');
    return generateFallbackSmartReplies();
  }
  
  try {
    // Attempt to generate with retries
    for (let attempt = 0; attempt <= ERROR_CONFIG.MAX_RETRIES; attempt++) {
      try {
        return await generateFunction(emailContent);
      } catch (error) {
        if (attempt === ERROR_CONFIG.MAX_RETRIES) {
          throw error; // Rethrow on final attempt
        }
        // Wait a bit before retrying
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
    
    // This should never be reached due to the throw above
    throw new Error('Unexpected end of retry loop');
  } catch (error) {
    if (error instanceof Error) {
      trackError('generateSmartReplies', error, emailContent.substring(0, 100) + '...');
    } else {
      trackError('generateSmartReplies', new Error('Unknown error'), emailContent.substring(0, 100) + '...');
    }
    
    // Return fallback replies on failure
    return generateFallbackSmartReplies();
  }
};

// Safe version of generating full reply with error handling
export const safelyGenerateFullReply = async (
  generateFunction: (content: string, options: any) => Promise<GeneratedReply>,
  emailContent: string,
  options: any
): Promise<GeneratedReply> => {
  // Check if we should use fallback mode
  if (shouldUseFallback('generateFullReply')) {
    console.warn('Using fallback mode for full reply due to repeated errors');
    return generateFallbackFullReply();
  }
  
  try {
    // Attempt to generate with retries
    for (let attempt = 0; attempt <= ERROR_CONFIG.MAX_RETRIES; attempt++) {
      try {
        return await generateFunction(emailContent, options);
      } catch (error) {
        if (attempt === ERROR_CONFIG.MAX_RETRIES) {
          throw error; // Rethrow on final attempt
        }
        // Wait a bit before retrying
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
      }
    }
    
    // This should never be reached due to the throw above
    throw new Error('Unexpected end of retry loop');
  } catch (error) {
    if (error instanceof Error) {
      trackError('generateFullReply', error, emailContent.substring(0, 100) + '...');
    } else {
      trackError('generateFullReply', new Error('Unknown error'), emailContent.substring(0, 100) + '...');
    }
    
    // Return fallback reply on failure
    return generateFallbackFullReply();
  }
};

// Generate a fallback email analysis for error cases
const generateFallbackEmailAnalysis = (emailContent: string): EmailAnalysis => {
  // Extract basic information using regex for a minimal analysis
  const emailRegex = /([^@\s]+@[^@\s]+\.[^@\s]+)/;
  const emailMatch = emailContent.match(emailRegex);
  const senderEmail = emailMatch ? emailMatch[0] : 'unknown@email.com';
  
  const subjectMatch = emailContent.match(/subject:\s*([^\n]+)/i);
  const subject = subjectMatch ? subjectMatch[1].trim() : 'No subject extracted';
  
  const questions = emailContent.match(/[^.!?\n]+\?/g) || [];
  
  const hasUrgentWords = /urgent|asap|immediately|emergency/i.test(emailContent);
  
  return {
    sender: {
      email: senderEmail
    },
    subject,
    intent: 'information',
    questions: questions.map(q => q.trim()),
    actionItems: [],
    deadlines: [],
    urgency: hasUrgentWords ? 'high' : 'medium',
    sentiment: {
      tone: 'neutral',
      confidence: 0.5
    },
    hasAttachments: emailContent.includes('attached') || emailContent.includes('attachment'),
    timestamp: new Date(),
    metadata: {
      confidence: 0.5,
      requiresHumanReview: true,
      reviewReason: 'Generated by fallback system due to error in analysis',
    }
  };
};

// Generate fallback smart replies for error cases
const generateFallbackSmartReplies = (): string[] => {
  return [
    "Thank you for your email. I'll review this and get back to you as soon as possible.",
    "I appreciate you reaching out. I'll look into this matter and respond shortly.",
    "Thanks for your message. I'll review the details and respond to you soon."
  ];
};

// Generate a fallback full reply for error cases
const generateFallbackFullReply = (): GeneratedReply => {
  return {
    text: "Thank you for your email. I'll review the information you've provided and get back to you with a more detailed response as soon as possible.\n\nBest regards,\n[Your Name]",
    metadata: {
      questionsAddressed: [],
      actionItemsIncluded: [],
      deadlinesReferenced: [],
      confidence: 0.5,
      requiresHumanReview: true,
      reviewReason: 'Generated by fallback system due to error'
    }
  };
};

// Reset error tracking (e.g., after fixing issues)
export const resetErrorTracking = (): void => {
  errorTracking = {
    lastError: null,
    errorCounts: {}
  };
  saveErrorTracking(errorTracking);
};

// Get error statistics for monitoring
export const getErrorStats = () => {
  const totalErrors = Object.values(errorTracking.errorCounts)
    .reduce((sum, entry) => sum + entry.count, 0);
    
  const mostCommonError = Object.entries(errorTracking.errorCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .shift();
    
  return {
    totalErrors,
    lastError: errorTracking.lastError,
    mostCommonError: mostCommonError ? {
      error: mostCommonError[0].split(':')[1],
      operation: mostCommonError[0].split(':')[0],
      count: mostCommonError[1].count,
      lastSeen: new Date(mostCommonError[1].lastSeen).toISOString()
    } : null,
    inFallbackMode: {
      analysis: shouldUseFallback('analyzeEmail'),
      smartReplies: shouldUseFallback('generateSmartReplies'),
      fullReply: shouldUseFallback('generateFullReply')
    }
  };
};

export default {
  trackError,
  shouldUseFallback,
  safelyAnalyzeEmail,
  safelyGenerateSmartReplies,
  safelyGenerateFullReply,
  resetErrorTracking,
  getErrorStats
};
