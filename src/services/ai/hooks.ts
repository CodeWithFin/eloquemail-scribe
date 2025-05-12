import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import geminiService from './gemini';

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
        return ["Please enable AI features in Settings"];
      }
      return await geminiService.generateReplyOptions(emailContent);
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
      options?: { 
        tone?: 'formal' | 'friendly' | 'assertive' | 'concise' | 'persuasive';
        length?: 'short' | 'medium' | 'long';
        context?: string;
        includeIntro?: boolean;
        includeOutro?: boolean;
      } 
    }) => {
      if (!isAIConfigured()) {
        toast({
          title: "AI Features Disabled",
          description: "Please enable AI features in Settings",
          variant: "destructive",
        });
        return "Please enable AI features in Settings";
      }
      return await geminiService.generateFullReply(emailContent, options || {});
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
          sentiment: 'neutral' as const,
          keyPoints: ["Please enable AI features in Settings"],
          actionItems: [],
          urgency: 'low' as const
        };
      }
      return await geminiService.analyzeEmail(emailContent);
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

export default {
  useImproveEmailText,
  useGenerateSubjectLine,
  useGenerateEmailContent,
  useSummarizeEmailThread,
  useAdjustEmailTone,
  useGenerateReplyOptions,
  useGenerateFullReply,
  useAnalyzeEmail,
  isAIConfigured
}; 