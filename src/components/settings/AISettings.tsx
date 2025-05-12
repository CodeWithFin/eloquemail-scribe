import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AISettingsProps {
  onSave?: () => void;
}

const AISettings: React.FC<AISettingsProps> = ({ onSave }) => {
  const { toast } = useToast();
  const [isAIEnabled, setIsAIEnabled] = useState<boolean>(true); // Default to enabled
  const [autoGenerate, setAutoGenerate] = useState<boolean>(false); // Default to disabled
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Load saved settings on component mount
  useEffect(() => {
    const aiEnabled = localStorage.getItem('ai_features_enabled') !== 'false'; // Default to true if not set
    const autoGen = localStorage.getItem('auto_generate_content') === 'true'; // Default to false if not set
    setIsAIEnabled(aiEnabled);
    setAutoGenerate(autoGen);
  }, []);
  
  const handleSaveSettings = () => {
    setIsSaving(true);
    
    try {
      // Save AI enabled status
      localStorage.setItem('ai_features_enabled', isAIEnabled.toString());
      localStorage.setItem('auto_generate_content', autoGenerate.toString());
      
      // Clean up any old API keys
      localStorage.removeItem('gemini_api_key');
      localStorage.removeItem('openai_api_key');
      
      toast({
        title: "Settings Saved",
        description: "Your AI settings have been saved successfully.",
        duration: 5000,
      });
      
      if (onSave) {
        onSave();
      }
    } catch (error) {
      toast({
        title: "Error Saving Settings",
        description: "There was a problem saving your settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="mr-2 h-5 w-5 text-purple-500" />
          AI Features Settings
        </CardTitle>
        <CardDescription>
          Configure AI-powered features for your email experience
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="ai-toggle" className="font-medium">Enable AI Features</Label>
            <Switch 
              id="ai-toggle" 
              checked={isAIEnabled} 
              onCheckedChange={setIsAIEnabled} 
            />
          </div>
          <p className="text-sm text-gray-500">
            Turn on AI-powered features like smart replies, email summarization, and composition assistance
          </p>
        </div>
        
        {isAIEnabled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-generate-toggle" className="font-medium">Auto-generate Email Content</Label>
              <Switch 
                id="auto-generate-toggle" 
                checked={autoGenerate} 
                onCheckedChange={setAutoGenerate} 
              />
            </div>
            <p className="text-sm text-gray-500">
              Automatically generate email content based on the subject line when composing a new email
            </p>
          </div>
        )}
        
        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-md flex items-start">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-sm text-blue-700">
            EloquEmail includes built-in AI assistance to help you create better emails.
            Our AI can summarize threads, suggest replies, analyze sentiment, and more.
          </p>
        </div>
        
        {isAIEnabled && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Available AI Features:</h3>
            <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
              <li>Email summarization - get quick summaries of long email threads</li>
              <li>Smart reply suggestions - generate context-aware reply options</li>
              <li>Email composition - create well-formatted emails quickly</li>
              <li>Content improvement - enhance grammar and clarity</li>
              <li>Email analysis - identify key points and action items</li>
              <li>Tone adjustment - formal, friendly, assertive, and more</li>
              <li>Auto-generation - create email content based on subject line</li>
            </ul>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="ml-auto"
        >
          Save Settings
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AISettings; 