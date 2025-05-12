import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, X, PenLine, Sparkles } from "lucide-react";
import { isAIConfigured } from "@/services/ai/hooks";
import { toast } from "@/hooks/use-toast";
import geminiService from '@/services/ai/gemini';

interface EditorProps {
  initialValue?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  enableAutocomplete?: boolean;
}

const Editor: React.FC<EditorProps> = ({
  initialValue = '',
  onChange,
  placeholder = 'Start typing...',
  minHeight = '200px',
  enableAutocomplete = true
}) => {
  const [value, setValue] = useState(initialValue);
  const [suggestion, setSuggestion] = useState<string>('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Determine if we should enable AI features
  const aiConfigured = isAIConfigured();
  const shouldEnableAutocomplete = enableAutocomplete && aiConfigured;

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange(newValue);
    
    // Clear any existing typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Only attempt to generate suggestions if the feature is enabled and not already generating
    if (shouldEnableAutocomplete && !isGenerating && newValue.trim().length > 15) {
      // Reset any existing suggestions
      setShowSuggestion(false);
      setSuggestion('');
      
      // Set a timeout to avoid generating on every keystroke
      typingTimeoutRef.current = setTimeout(() => {
        generateSuggestion(newValue);
      }, 1500); // 1.5 second delay after typing stops
    }
  };
  
  const generateSuggestion = async (text: string) => {
    try {
      setIsGenerating(true);
      
      // Make sure textarea is focused when generating
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      
      // Use the geminiService to get completion suggestion
      try {
        const completion = await geminiService.generateTextCompletion(text);
        
        if (completion && completion.length > 5) {
          setSuggestion(completion);
          setShowSuggestion(true);
        }
      } catch (error) {
        console.error('Error generating suggestion:', error);
        toast({
          title: "Error Generating Suggestion",
          description: error instanceof Error ? error.message : "Something went wrong with the AI service",
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };
  
  const acceptSuggestion = () => {
    const newValue = value + suggestion;
    setValue(newValue);
    onChange(newValue);
    setSuggestion('');
    setShowSuggestion(false);
    
    // Focus back on textarea after accepting suggestion
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  const rejectSuggestion = () => {
    setSuggestion('');
    setShowSuggestion(false);
    
    // Focus back on textarea after rejecting suggestion
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  const requestCompletion = () => {
    if (!value.trim()) {
      toast({
        title: "Nothing to complete",
        description: "Please write some text first before requesting a completion",
      });
      return;
    }
    
    if (shouldEnableAutocomplete) {
      generateSuggestion(value);
    } else {
      toast({
        title: "AI Features Not Configured",
        description: "Please configure your OpenAI API key in Settings first",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        style={{ minHeight }}
        className="resize-y pr-12"
      />
      
      {shouldEnableAutocomplete && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8 text-gray-500 hover:text-eloquent-500"
          onClick={requestCompletion}
          title="Request AI completion"
          type="button"
        >
          <Sparkles size={18} />
        </Button>
      )}
      
      {showSuggestion && (
        <div className="mt-1 p-3 border border-gray-200 rounded-md bg-gray-50 relative">
          <div className="text-gray-600">
            <span className="text-gray-400">{value}</span>
            <span className="font-medium">{suggestion}</span>
          </div>
          <div className="flex space-x-2 mt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={acceptSuggestion}
              className="h-7 px-2 text-xs"
            >
              <Check size={14} className="mr-1" />
              Accept
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={rejectSuggestion}
              className="h-7 px-2 text-xs"
            >
              <X size={14} className="mr-1" />
              Reject
            </Button>
          </div>
        </div>
      )}
      
      {isGenerating && (
        <div className="mt-1 p-2 text-sm text-gray-500 flex items-center">
          <div className="animate-pulse flex items-center">
            <Sparkles size={14} className="mr-2" />
            <span>Generating suggestion...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor; 