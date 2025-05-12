import React, { useState } from 'react';
import Button from '../ui-custom/Button';
import Glass from '../ui-custom/Glass';
import { Wand2, CheckCircle2, Sparkles, Pencil, FileText, Send, ThumbsUp, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface AIToolbarProps {
  emailContent: string;
  onUpdate: (newContent: string) => void;
}

const AIToolbar: React.FC<AIToolbarProps> = ({ emailContent, onUpdate }) => {
  const { toast } = useToast();
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState('');

  // Placeholder AI suggestion examples
  const suggestions = [
    "I hope this email finds you well. I wanted to reach out regarding the project timeline we discussed last week. I've prepared a detailed breakdown of the next steps and would appreciate your feedback on the implementation plan. Could we schedule a short call this week to discuss these points further?\n\nBest regards,\n[Your Name]",
    "Thank you for your inquiry about our services. We're excited about the possibility of working together! I've attached our company brochure with more information about our offerings. Please let me know if you have any questions or if you'd like to schedule a consultation to discuss your specific needs.\n\nBest regards,\n[Your Name]",
    "I appreciate your prompt response to my previous email. The information you provided was exactly what I needed. I've reviewed the documents and everything looks good from my end. Let's proceed with the next phase as planned.\n\nThanks again,\n[Your Name]"
  ];

  const handleAIAction = (action: string) => {
    if (!emailContent && action !== 'generate') {
      toast({
        title: "No content to improve",
        description: "Please write some content first before using this AI feature.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoadingAction(true);
    
    // Simulate AI processing
    setTimeout(() => {
      let result = emailContent;
      
      switch (action) {
        case 'generate':
          // Get a random suggestion
          const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
          setSuggestion(randomSuggestion);
          setShowSuggestion(true);
          break;
          
        case 'improve':
          // Simulate improving the email
          result = emailContent
            .replace(/(?:^|\s)i(?=\s|$)/g, ' I') // Capitalize standalone 'i'
            .replace(/(?:^|\.|\?|\!)\s*([a-z])/g, (match) => match.toUpperCase()) // Capitalize first letter of sentences
            .replace(/\b(hello|hi|hey)\b/gi, 'Dear recipient') // Make greeting more formal
            .trim();
          
          onUpdate(result);
          toast({
            title: "Email improved",
            description: "Your email has been refined for better clarity and professionalism."
          });
          break;
          
        case 'formal':
          // Make more formal
          result = emailContent
            .replace(/(?:\b|^)(wanna|gonna|gotta)(?:\b|$)/gi, (match) => {
              const replacements = { wanna: 'want to', gonna: 'going to', gotta: 'got to' };
              return replacements[match.toLowerCase() as keyof typeof replacements] || match;
            })
            .replace(/(?:\b|^)(thanks)(?:\b|$)/gi, 'Thank you')
            .replace(/(?:\b|^)(hi|hey)(?:\b|$)/gi, 'Dear');
          
          onUpdate(result);
          toast({
            title: "Tone adjusted",
            description: "Your email's tone has been adjusted to be more formal."
          });
          break;
          
        case 'casual':
          // Make more casual
          result = emailContent
            .replace(/(?:\b|^)(Dear [^\s,]+)(?:\b|$)/gi, 'Hi')
            .replace(/(?:\b|^)(Thank you)(?:\b|$)/gi, 'Thanks')
            .replace(/(?:\b|^)(I am)(?:\b|$)/gi, "I'm");
          
          onUpdate(result);
          toast({
            title: "Tone adjusted",
            description: "Your email's tone has been adjusted to be more casual and friendly."
          });
          break;
          
        case 'shorten':
          // Shorten the email (simulate by taking 70% of the text)
          const words = emailContent.split(' ');
          const shortenedWords = words.slice(0, Math.ceil(words.length * 0.7));
          result = shortenedWords.join(' ');
          
          onUpdate(result);
          toast({
            title: "Email shortened",
            description: "Your email has been condensed while preserving key points."
          });
          break;
      }
      
      setIsLoadingAction(false);
    }, 1000);
  };

  const acceptSuggestion = () => {
    onUpdate(suggestion);
    setShowSuggestion(false);
    toast({
      title: "Suggestion applied",
      description: "The AI-generated text has been added to your email."
    });
  };

  const dismissSuggestion = () => {
    setShowSuggestion(false);
  };

  return (
    <div className="space-y-4">
      {showSuggestion && (
        <div className="animate-fade-in">
          <Glass 
            className="p-4 border border-eloquent-100"
            opacity="light"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Sparkles size={16} className="text-eloquent-500 mr-2" />
                <span className="text-sm font-medium">AI Suggestion</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={dismissSuggestion}
              >
                <X size={16} />
              </Button>
            </div>
            <div className="text-gray-700 dark:text-gray-300 text-sm mb-3 whitespace-pre-line">
              {suggestion}
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={dismissSuggestion}
              >
                Dismiss
              </Button>
              <Button
                size="sm"
                iconLeft={<CheckCircle2 size={16} />}
                onClick={acceptSuggestion}
              >
                Use This
              </Button>
            </div>
          </Glass>
        </div>
      )}
      
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center mr-2">
          <Wand2 size={18} className="text-eloquent-500 mr-1" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Tools:</span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="py-1 px-3 text-sm rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          onClick={() => handleAIAction('generate')}
          loading={isLoadingAction}
          iconLeft={<Sparkles size={14} />}
        >
          Generate
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="py-1 px-3 text-sm rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          onClick={() => handleAIAction('improve')}
          loading={isLoadingAction}
          iconLeft={<ThumbsUp size={14} />}
        >
          Improve
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="py-1 px-3 text-sm rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          onClick={() => handleAIAction('formal')}
          loading={isLoadingAction}
          iconLeft={<FileText size={14} />}
        >
          Make Formal
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="py-1 px-3 text-sm rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          onClick={() => handleAIAction('casual')}
          loading={isLoadingAction}
          iconLeft={<Pencil size={14} />}
        >
          Make Casual
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="py-1 px-3 text-sm rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          onClick={() => handleAIAction('shorten')}
          loading={isLoadingAction}
          iconLeft={<Send size={14} />}
        >
          Shorten
        </Button>
      </div>
    </div>
  );
};

export default AIToolbar;
