// Enhanced rich text editor for email composition
import React, { useState, useEffect, useRef } from 'react';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Link2, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Underline,
  Image,
  Smile,
  Type,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isAIConfigured } from "@/services/ai/hooks";
import { toast } from "@/hooks/use-toast";
import geminiService from '@/services/ai/gemini';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EnhancedEditorProps {
  initialValue?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  enableAutocomplete?: boolean;
}

const EnhancedEditor: React.FC<EnhancedEditorProps> = ({
  initialValue = '',
  onChange,
  placeholder = 'Start typing...',
  minHeight = '200px',
  enableAutocomplete = true
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [suggestion, setSuggestion] = useState<string>('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Determine if we should enable AI features
  const aiConfigured = isAIConfigured();
  const shouldEnableAutocomplete = enableAutocomplete && aiConfigured;

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialValue;
    }
  }, [initialValue]);
  
  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
      
      // Clear any existing typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Only attempt to generate suggestions if the feature is enabled and not already generating
      if (shouldEnableAutocomplete && !isGenerating && content.length > 20) {
        // Reset any existing suggestions
        setShowSuggestion(false);
        setSuggestion('');
        
        // Set a timeout to avoid generating on every keystroke
        typingTimeoutRef.current = setTimeout(() => {
          generateSuggestion(content);
        }, 1500); // 1.5 second delay after typing stops
      }
    }
  };
  
  const generateSuggestion = async (text: string) => {
    try {
      setIsGenerating(true);
      
      // Make sure editor is focused when generating
      if (editorRef.current) {
        editorRef.current.focus();
      }
      
      // Extract text-only content to send to AI
      const textContent = text.replace(/<[^>]*>/g, ' ').trim();
      
      // Use the geminiService to get completion suggestion
      try {
        const completion = await geminiService.generateTextCompletion(textContent);
        
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
    if (editorRef.current) {
      editorRef.current.innerHTML += suggestion;
      onChange(editorRef.current.innerHTML);
      setSuggestion('');
      setShowSuggestion(false);
      
      // Focus back on editor after accepting suggestion
      editorRef.current.focus();
    }
  };
  
  const rejectSuggestion = () => {
    setSuggestion('');
    setShowSuggestion(false);
    
    // Focus back on editor after rejecting suggestion
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };
  
  const requestCompletion = () => {
    if (!editorRef.current || !editorRef.current.textContent?.trim()) {
      toast({
        title: "Nothing to complete",
        description: "Please write some text first before requesting a completion",
      });
      return;
    }
    
    if (shouldEnableAutocomplete) {
      generateSuggestion(editorRef.current.innerHTML);
    } else {
      toast({
        title: "AI Features Not Configured",
        description: "Please configure your AI API key in Settings first",
        variant: "destructive",
      });
    }
  };
  
  // Formatting functions
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
  };
  
  const handleLinkInsert = () => {
    if (linkUrl) {
      formatText('createLink', linkUrl);
      setLinkUrl('');
      setIsLinkPopoverOpen(false);
    }
  };
  
  const insertEmoji = (emoji: string) => {
    if (editorRef.current) {
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      
      if (range) {
        range.deleteContents();
        range.insertNode(document.createTextNode(emoji));
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        onChange(editorRef.current.innerHTML);
      }
    }
  };
  
  const commonEmojis = ['😊', '👍', '🙏', '👋', '🎉', '👏', '🔥', '⭐', '❤️', '🤔'];
  
  return (
    <div className="space-y-2">
      {/* Formatting toolbar */}
      <div className="flex items-center flex-wrap gap-1 p-1 border rounded-md bg-gray-50 dark:bg-gray-900">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="button"
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => formatText('bold')}
              >
                <Bold size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bold</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="button"
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => formatText('italic')}
              >
                <Italic size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Italic</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="button"
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => formatText('underline')}
              >
                <Underline size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Underline</TooltipContent>
          </Tooltip>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="button"
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => formatText('insertUnorderedList')}
              >
                <List size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bullet List</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="button"
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => formatText('insertOrderedList')}
              >
                <ListOrdered size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Numbered List</TooltipContent>
          </Tooltip>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="button"
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => formatText('justifyLeft')}
              >
                <AlignLeft size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Left</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="button"
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => formatText('justifyCenter')}
              >
                <AlignCenter size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Center</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                type="button"
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => formatText('justifyRight')}
              >
                <AlignRight size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Align Right</TooltipContent>
          </Tooltip>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          
          <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                    >
                      <Link2 size={16} />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Insert Link</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-80 p-3">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Insert Link</h4>
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleLinkInsert}
                    disabled={!linkUrl}
                  >
                    Insert
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Popover>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                    >
                      <Smile size={16} />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Emoji</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-64 p-2">
              <div className="grid grid-cols-5 gap-2">
                {commonEmojis.map((emoji) => (
                  <Button
                    key={emoji}
                    type="button"
                    variant="ghost"
                    className="h-9 w-9"
                    onClick={() => insertEmoji(emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          <div className="flex-1" />
          
          {shouldEnableAutocomplete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={requestCompletion}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Sparkles size={16} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>AI Completion</TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>
      
      {/* Editable content area */}
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-3 border rounded-md min-h-[200px] max-h-[500px] overflow-y-auto focus:outline-none focus:ring-1 focus:ring-gray-400"
        style={{ minHeight }}
        placeholder={placeholder}
        data-placeholder={placeholder}
      />
      
      {/* AI suggestion */}
      {showSuggestion && (
        <div className="mt-1 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 relative">
          <div className="text-gray-600 dark:text-gray-300">
            <span className="font-medium">{suggestion}</span>
          </div>
          <div className="flex space-x-2 mt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={acceptSuggestion}
              className="h-7 px-2 text-xs"
            >
              <Sparkles size={14} className="mr-1" />
              Use Suggestion
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={rejectSuggestion}
              className="h-7 px-2 text-xs"
            >
              <Italic size={14} className="mr-1" />
              Ignore
            </Button>
          </div>
        </div>
      )}
      
      <style jsx>{`
        [contentEditable=true]:empty:before {
          content: attr(placeholder);
          color: #9ca3af;
          cursor: text;
        }
      `}</style>
    </div>
  );
};

export default EnhancedEditor;
