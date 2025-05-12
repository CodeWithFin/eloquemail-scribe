import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import openaiService from './openai';

/**
 * Hook for improving email text
 */
export const useImproveEmailText = () => {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: openaiService.improveEmailText,
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
    mutationFn: openaiService.generateSubjectLine,
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
    mutationFn: openaiService.summarizeEmailThread,
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
      ({ text, tone }: { text: string; tone: 'formal' | 'friendly' | 'assertive' | 'concise' | 'persuasive' }) => 
        openaiService.adjustEmailTone(text, tone),
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
    mutationFn: openaiService.generateReplyOptions,
    onError: (error) => {
      toast({
        title: "Error generating replies",
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
  useGenerateReplyOptions
}; 