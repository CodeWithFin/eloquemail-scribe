import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import openaiService from './openai';

/**
 * Utility function to check if AI features are properly configured
 */
export const isAIConfigured = (): boolean => {
  const apiKey = localStorage.getItem('openai_api_key');
  const aiEnabled = localStorage.getItem('ai_features_enabled') === 'true';
  return !!apiKey && aiEnabled;
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
          title: "AI Features Not Configured",
          description: "Please configure your OpenAI API key in Settings first",
          variant: "destructive",
        });
        return text;
      }
      return await openaiService.improveEmailText(text);
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
          title: "AI Features Not Configured",
          description: "Please configure your OpenAI API key in Settings first",
          variant: "destructive",
        });
        return "Email Subject";
      }
      return await openaiService.generateSubjectLine(emailBody);
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
 * Hook for summarizing email threads
 */
export const useSummarizeEmailThread = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (threadContent: string) => {
      if (!isAIConfigured()) {
        toast({
          title: "AI Features Not Configured",
          description: "Please configure your OpenAI API key in Settings first",
          variant: "destructive",
        });
        return "Please configure AI features in Settings";
      }
      return await openaiService.summarizeEmailThread(threadContent);
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
            title: "AI Features Not Configured",
            description: "Please configure your OpenAI API key in Settings first",
            variant: "destructive",
          });
          return text;
        }
        return await openaiService.adjustEmailTone(text, tone);
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
          title: "AI Features Not Configured",
          description: "Please configure your OpenAI API key in Settings first",
          variant: "destructive",
        });
        return ["Please configure AI features in Settings"];
      }
      return await openaiService.generateReplyOptions(emailContent);
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
          title: "AI Features Not Configured",
          description: "Please configure your OpenAI API key in Settings first",
          variant: "destructive",
        });
        return "Please configure AI features in Settings";
      }
      return await openaiService.generateFullReply(emailContent, options || {});
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
          title: "AI Features Not Configured",
          description: "Please configure your OpenAI API key in Settings first",
          variant: "destructive",
        });
        return {
          sentiment: 'neutral' as const,
          keyPoints: ["Please configure AI features in Settings"],
          actionItems: [],
          urgency: 'low' as const
        };
      }
      return await openaiService.analyzeEmail(emailContent);
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
  useSummarizeEmailThread,
  useAdjustEmailTone,
  useGenerateReplyOptions,
  useGenerateFullReply,
  useAnalyzeEmail,
  isAIConfigured
}; 