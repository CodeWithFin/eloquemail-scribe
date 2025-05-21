import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import geminiService from './gemini';
import { type EmailAnalysis, type EmailGenerationOptions, type GeneratedReply, type Deadline } from './types';
import cacheService from './cacheService';
import loggingService from './loggingService';
import errorHandling from './errorHandling';

// Update the interface to match the GeneratedReply type
interface GeneratedEmailReply {
  text: string;
  metadata: {
    questionsAddressed: string[];
    actionItemsIncluded: string[];
    deadlinesReferenced: Deadline[];
    confidence: number;
    requiresHumanReview: boolean;
    reviewReason?: string;
  };
}

/**
 * Helper function to ensure deadline dates are properly converted to Date objects
 */
const ensureDeadlineDates = (deadlines: any[]): Deadline[] => {
  return deadlines.map(deadline => ({
    text: deadline.text,
    date: deadline.date instanceof Date ? deadline.date : 
          deadline.date ? new Date(deadline.date) : null
  }));
};

/**
 * Wrapper for geminiService.analyzeEmail that ensures date fields are properly formatted
 */
const safeAnalyzeEmail = async (content: string): Promise<EmailAnalysis> => {
  // Use the error handling service's safelyAnalyzeEmail function
  const wrappedAnalyzeEmail = async (emailContent: string): Promise<EmailAnalysis> => {
    const result = await geminiService.analyzeEmail(emailContent);
    return {
      ...result,
      deadlines: ensureDeadlineDates(result.deadlines),
      timestamp: result.timestamp instanceof Date ? result.timestamp : new Date(result.timestamp)
    };
  };
  
  return errorHandling.safelyAnalyzeEmail(wrappedAnalyzeEmail, content);
};

/**
 * Wrapper for geminiService.generateFullReply that ensures date fields are properly formatted
 */
const safeGenerateFullReply = async (content: string, options: any): Promise<GeneratedReply> => {
  // Use the error handling service's safelyGenerateFullReply function
  const wrappedGenerateFullReply = async (emailContent: string, opts: any): Promise<GeneratedReply> => {
    const result = await geminiService.generateFullReply(emailContent, opts);
    return {
      text: result.text,
      metadata: {
        ...result.metadata,
        deadlinesReferenced: ensureDeadlineDates(result.metadata.deadlinesReferenced)
      }
    };
  };
  
  return errorHandling.safelyGenerateFullReply(wrappedGenerateFullReply, content, options);
};

/**
 * Utility function to check if AI features are properly configured
 */
export const isAIConfigured = (): boolean => {
  // AI is always configured now since we're using built-in simulation
  // Just check if it's not explicitly disabled
  const aiEnabled = localStorage.getItem('ai_features_enabled') !== 'false';
  return aiEnabled;
};

/**
 * Hook for improving email text
 */
export const useImproveEmailText = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (text: string) => {
      if (!isAIConfigured()) {
        toast({
          title: "AI Features Disabled",
          description: "Please enable AI features in Settings",
          variant: "destructive",
        });
        return text;
      }
      return await geminiService.improveEmailText(text);
    },
    onError: (error) => {
      toast({
        title: "Error improving text",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  });
};

/**
 * Hook for generating email subject lines
 */
export const useGenerateSubjectLine = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (emailBody: string) => {
      if (!isAIConfigured()) {
        toast({
          title: "AI Features Disabled",
          description: "Please enable AI features in Settings",
          variant: "destructive",
        });
        return "Email Subject";
      }
      return await geminiService.generateSubjectLine(emailBody);
    },
    onError: (error) => {
      toast({
        title: "Error generating subject",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  });
};

/**
 * Hook for generating email content based on subject
 */
export const useGenerateEmailContent = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (subject: string) => {
      if (!isAIConfigured()) {
        toast({
          title: "AI Features Disabled",
          description: "Please enable AI features in Settings",
          variant: "destructive",
        });
        return "";
      }
      return await geminiService.generateEmailContent(subject);
    },
    onError: (error) => {
      toast({
        title: "Error generating email content",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  });
};

/**
 * Hook for summarizing email threads
 */
export const useSummarizeEmailThread = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (threadContent: string) => {
      if (!isAIConfigured()) {
        toast({
          title: "AI Features Disabled",
          description: "Please enable AI features in Settings",
          variant: "destructive",
        });
        return "Please enable AI features in Settings";
      }
      return await geminiService.summarizeEmailThread(threadContent);
    },
    onError: (error) => {
      toast({
        title: "Error summarizing email",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  });
};

/**
 * Hook for adjusting email tone
 */
export const useAdjustEmailTone = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: 
      async ({ text, tone }: { text: string; tone: 'formal' | 'friendly' | 'assertive' | 'concise' | 'persuasive' }) => {
        if (!isAIConfigured()) {
          toast({
            title: "AI Features Disabled",
            description: "Please enable AI features in Settings",
            variant: "destructive",
          });
          return text;
        }
        return await geminiService.adjustEmailTone(text, tone);
      },
    onError: (error) => {
      toast({
        title: "Error adjusting tone",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  });
};

/**
 * Hook for generating reply options
 */
export const useGenerateReplyOptions = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (emailContent: string) => {
      if (!isAIConfigured()) {
        toast({
          title: "AI Features Disabled",
          description: "Please enable AI features in Settings",
          variant: "destructive",
        });
        return {
          replies: ["Please enable AI features in Settings"],
          id: null
        };
      }
      
      // Check cache first
      const cachedReplies = cacheService.getCachedSmartReplies(emailContent);
      if (cachedReplies) {
        return {
          replies: cachedReplies,
          id: null // No ID for cached replies as they weren't logged
        };
      }
      
      try {
        // First analyze the email to get context
        let analysis: EmailAnalysis;
        const cachedAnalysis = cacheService.getCachedEmailAnalysis(emailContent);
        
        if (cachedAnalysis) {
          analysis = cachedAnalysis;
        } else {
          analysis = await safeAnalyzeEmail(emailContent);
          cacheService.cacheEmailAnalysis(emailContent, analysis);
        }
        
        // Generate smart replies with error handling
        const replies = await errorHandling.safelyGenerateSmartReplies(
          geminiService.generateSmartReplies,
          emailContent
        );
        
        // Cache the replies
        cacheService.cacheSmartReplies(emailContent, replies, analysis);
        
        // Log this auto-reply generation for quality review
        const replyObj: GeneratedReply = {
          text: replies.join('\n\n'),
          metadata: {
            questionsAddressed: analysis.questions,
            actionItemsIncluded: analysis.actionItems,
            deadlinesReferenced: analysis.deadlines,
            confidence: analysis.metadata.confidence,
            requiresHumanReview: analysis.metadata.requiresHumanReview,
            reviewReason: analysis.metadata.reviewReason
          }
        };
        
        // Log the smart reply generation and get the ID
        const replyId = loggingService.logAutoReply(
          emailContent,
          analysis,
          replyObj,
          analysis.subject,
          analysis.sender.email
        );
        
        return {
          replies,
          id: replyId
        };
      } catch (error) {
        console.error('Error generating smart replies:', error);
        throw error;
      }
    },
    onError: (error) => {
      toast({
        title: "Error generating replies",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  });
};

// Using GeneratedReply type from imports

/**
 * Hook for generating a full email reply
 */
export const useGenerateFullReply = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      emailContent, 
      options 
    }: { 
      emailContent: string; 
      options?: EmailGenerationOptions 
    }): Promise<GeneratedEmailReply & { id?: string }> => {
      if (!isAIConfigured()) {
        toast({
          title: "AI Features Disabled",
          description: "Please enable AI features in Settings",
          variant: "destructive",
        });
        return {
          text: "Please enable AI features in Settings",
          metadata: {
            questionsAddressed: [],
            actionItemsIncluded: [],
            deadlinesReferenced: [],
            confidence: 0,
            requiresHumanReview: true,
            reviewReason: 'AI features are disabled'
          },
          id: undefined
        };
      }
      
      // Check cache first with options considered
      const cachedReply = cacheService.getCachedFullReply(emailContent, options);
      if (cachedReply) {
        // Convert the cached reply to match the expected return type
        return {
          ...cachedReply,
          metadata: {
            ...cachedReply.metadata,
            deadlinesReferenced: ensureDeadlineDates(cachedReply.metadata.deadlinesReferenced)
          }
        };
      }

      try {
        // For accurate replies, first analyze the email if not already cached
        let analysis: EmailAnalysis;
        const cachedAnalysis = cacheService.getCachedEmailAnalysis(emailContent);
        
        if (cachedAnalysis) {
          analysis = cachedAnalysis;
        } else {
          analysis = await safeAnalyzeEmail(emailContent);
          cacheService.cacheEmailAnalysis(emailContent, analysis);
        }
        
        // Generate the full reply with error handling
        const reply = await safeGenerateFullReply(emailContent, options || {});
        
        // Cache the reply with options
        cacheService.cacheFullReply(emailContent, reply, options);
        
        // Log this reply generation for quality review
        const replyId = loggingService.logAutoReply(
          emailContent,
          analysis,
          reply as GeneratedReply,
          analysis.subject,
          analysis.sender.email
        );
        
        // Add the ID to the response
        return {
          text: reply.text,
          metadata: {
            ...reply.metadata,
            deadlinesReferenced: ensureDeadlineDates(reply.metadata.deadlinesReferenced)
          },
          id: replyId
        };
      } catch (error) {
        console.error('Error generating full reply:', error);
        throw error;
      }
    },
    onError: (error) => {
      toast({
        title: "Error generating reply",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  });
};

/**
 * Hook for analyzing email content
 */
export const useAnalyzeEmail = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (emailContent: string) => {
      if (!isAIConfigured()) {
        toast({
          title: "AI Features Disabled",
          description: "Please enable AI features in Settings",
          variant: "destructive",
        });
        return {
          sender: { email: 'unknown@email.com' },
          subject: 'Please enable AI features in Settings',
          intent: 'information' as const,
          questions: [],
          actionItems: [],
          deadlines: [],
          urgency: 'low' as const,
          sentiment: { tone: 'neutral' as const, confidence: 0 },
          hasAttachments: false,
          timestamp: new Date(),
          metadata: {
            confidence: 0,
            requiresHumanReview: true,
            reviewReason: 'AI features are disabled'
          }
        };
      }
      
      // Check cache first
      const cachedAnalysis = cacheService.getCachedEmailAnalysis(emailContent);
      if (cachedAnalysis) {
        return cachedAnalysis;
      }
      
      // If not in cache, analyze the email with error handling
      try {
        const analysis = await safeAnalyzeEmail(emailContent);
        
        // Cache the result for future use
        cacheService.cacheEmailAnalysis(emailContent, analysis);
        
        return analysis;
      } catch (error) {
        console.error('Error analyzing email:', error);
        throw error;
      }
    },
    onError: (error) => {
      toast({
        title: "Error analyzing email",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  });
};

/**
 * Hook for generating smart reply suggestions
 */
export const useGenerateSmartReplies = () => {
  const { toast } = useToast();
  const analyzeEmail = useAnalyzeEmail();
  
  return useMutation({
    mutationFn: async (emailContent: string) => {
      if (!isAIConfigured()) {
        toast({
          title: "AI Features Disabled",
          description: "Please enable AI features in Settings",
          variant: "destructive",
        });
        return ["Please enable AI features in Settings"];
      }
      
      // Check cache first
      const cachedReplies = cacheService.getCachedSmartReplies(emailContent);
      if (cachedReplies) {
        return cachedReplies;
      }
      
      try {
        // For more accurate context-aware replies, first analyze the email
        let analysis: EmailAnalysis;
        
        // Use cached analysis if available, otherwise generate new one
        const cachedAnalysis = cacheService.getCachedEmailAnalysis(emailContent);
        if (cachedAnalysis) {
          analysis = cachedAnalysis;
        } else {
          analysis = await safeAnalyzeEmail(emailContent);
          cacheService.cacheEmailAnalysis(emailContent, analysis);
        }
        
        // Generate smart replies with the analysis context and error handling
        const replies = await errorHandling.safelyGenerateSmartReplies(
          geminiService.generateSmartReplies,
          emailContent
        );
        
        // Cache the replies
        cacheService.cacheSmartReplies(emailContent, replies, analysis);
        
        // Log this auto-reply generation for quality review
        const replyObj: GeneratedReply = {
          text: replies.join('\n\n'),
          metadata: {
            questionsAddressed: analysis.questions,
            actionItemsIncluded: analysis.actionItems,
            deadlinesReferenced: analysis.deadlines,
            confidence: analysis.metadata.confidence,
            requiresHumanReview: analysis.metadata.requiresHumanReview,
            reviewReason: analysis.metadata.reviewReason
          }
        };
        
        // Log the smart reply generation
        loggingService.logAutoReply(
          emailContent,
          analysis,
          replyObj,
          analysis.subject,
          analysis.sender.email
        );
        
        return replies;
      } catch (error) {
        console.error('Error generating smart replies:', error);
        throw error;
      }
    },
    onError: (error) => {
      toast({
        title: "Error generating smart replies",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  });
};

/**
 * Hook for summarizing an email briefly
 */
export const useSummarizeEmailBriefly = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (emailContent: string) => {
      if (!isAIConfigured()) {
        toast({
          title: "AI Features Disabled",
          description: "Please enable AI features in Settings",
          variant: "destructive",
        });
        return "Please enable AI features in Settings";
      }
      return await geminiService.summarizeEmailBriefly(emailContent);
    },
    onError: (error) => {
      toast({
        title: "Error summarizing email",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  });
};

/**
 * Hook for prioritizing an email
 */
export const usePrioritizeEmail = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (emailContent: string) => {
      if (!isAIConfigured()) {
        toast({
          title: "AI Features Disabled",
          description: "Please enable AI features in Settings",
          variant: "destructive",
        });
        return {
          priority: 'Medium' as const,
          justification: "Please enable AI features in Settings"
        };
      }
      return await geminiService.prioritizeEmail(emailContent);
    },
    onError: (error) => {
      toast({
        title: "Error prioritizing email",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  });
};

export default {
  useImproveEmailText,
  useGenerateSubjectLine,
  useGenerateEmailContent,
  useSummarizeEmailThread,
  useAdjustEmailTone,
  useGenerateReplyOptions,
  useGenerateFullReply,
  useAnalyzeEmail,
  useGenerateSmartReplies,
  useSummarizeEmailBriefly,
  usePrioritizeEmail,
  isAIConfigured
};