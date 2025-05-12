import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles, Lock, Key, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AISettingsProps {
  onSave?: () => void;
}

const AISettings: React.FC<AISettingsProps> = ({ onSave }) => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState<string>('');
  const [isAIEnabled, setIsAIEnabled] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isKeyValid, setIsKeyValid] = useState<boolean | null>(null);
  
  // Load saved settings on component mount
  useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key');
    const aiEnabled = localStorage.getItem('ai_features_enabled') === 'true';
    
    if (savedKey) {
      // Show masked key for security
      setApiKey(savedKey);
      setIsKeyValid(true);
    }
    
    setIsAIEnabled(aiEnabled);
  }, []);
  
  const handleSaveSettings = () => {
    if (!apiKey && isAIEnabled) {
      toast({
        title: "API Key Required",
        description: "Please enter an OpenAI API key to enable AI features",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Save settings to localStorage (in a real app, you might want to save these securely)
      localStorage.setItem('openai_api_key', apiKey);
      localStorage.setItem('ai_features_enabled', isAIEnabled.toString());
      
      // Update environment variable (this is a client-side approximation)
      (window as any).process = (window as any).process || {};
      (window as any).process.env = (window as any).process.env || {};
      (window as any).process.env.OPENAI_API_KEY = apiKey;
      
      toast({
        title: "Settings Saved",
        description: "Your AI settings have been saved successfully",
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
  
  const handleTestAPIKey = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter an OpenAI API key to test",
        variant: "destructive"
      });
      return;
    }
    
    setIsTesting(true);
    setIsKeyValid(null);
    
    try {
      // Create a minimal test request to OpenAI API
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setIsKeyValid(true);
        toast({
          title: "API Key Valid",
          description: "Your OpenAI API key is valid and working correctly",
        });
      } else {
        setIsKeyValid(false);
        toast({
          title: "Invalid API Key",
          description: "The API key could not be verified. Please check and try again",
          variant: "destructive"
        });
      }
    } catch (error) {
      setIsKeyValid(false);
      toast({
        title: "Connection Error",
        description: "Could not connect to OpenAI API. Please check your internet connection and try again",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
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
        
        <div className="space-y-2">
          <Label htmlFor="api-key" className="font-medium flex items-center">
            <Key className="mr-2 h-4 w-4" />
            OpenAI API Key
          </Label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
              <Input 
                id="api-key" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)}
                className="pl-10"
                type="password"
                placeholder="Enter your OpenAI API key"
                disabled={!isAIEnabled}
              />
            </div>
            <Button 
              variant="outline" 
              onClick={handleTestAPIKey}
              disabled={!apiKey || !isAIEnabled || isTesting}
            >
              {isTesting ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : isKeyValid === true ? (
                <Check className="mr-2 h-4 w-4 text-green-500" />
              ) : isKeyValid === false ? (
                <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
              ) : null}
              Test
            </Button>
          </div>
          
          <p className="text-sm text-gray-500">
            Your API key is stored locally on your device and is never sent to our servers
          </p>
          
          {isKeyValid === false && (
            <p className="text-sm text-red-500 mt-1">
              The API key is invalid. Please check it and try again.
            </p>
          )}
          
          <p className="text-sm text-gray-500 mt-4">
            Don't have an API key? <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Get one from OpenAI</a>
          </p>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="ml-auto"
        >
          {isSaving ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Save Settings
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AISettings; 