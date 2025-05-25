import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Slider } from "@/components/ui/slider";
import errorHandling from '@/services/ai/errorHandling';
import loggingService from '@/services/ai/loggingService';
import cacheService from '@/services/ai/cacheService';

interface AISettingsProps {
  onSave?: () => void;
}

interface ErrorStats {
  totalRequests: number;
  failedRequests: number;
  lastErrorTime?: string | null;
  lastErrorMessage?: string;
}

const AISettings: React.FC<AISettingsProps> = ({ onSave }) => {
  const { toast } = useToast();
  const [isAIEnabled, setIsAIEnabled] = useState<boolean>(true); // Default to enabled
  const [autoGenerate, setAutoGenerate] = useState<boolean>(false); // Default to disabled
  const [cacheEnabled, setCacheEnabled] = useState<boolean>(true); // Default to enabled
  const [loggingEnabled, setLoggingEnabled] = useState<boolean>(true); // Default to enabled
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(50); // Default to 50%
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Load saved settings on component mount
  useEffect(() => {
    const aiEnabled = localStorage.getItem('ai_features_enabled') !== 'false'; // Default to true if not set
    const autoGen = localStorage.getItem('auto_generate_content') === 'true'; // Default to false if not set
    const cacheEnabled = localStorage.getItem('ai_cache_enabled') !== 'false'; // Default to true if not set
    const loggingEnabled = localStorage.getItem('ai_logging_enabled') !== 'false'; // Default to true if not set
    const threshold = parseInt(localStorage.getItem('ai_confidence_threshold') || '50', 10);
    
    setIsAIEnabled(aiEnabled);
    setAutoGenerate(autoGen);
    setCacheEnabled(cacheEnabled);
    setLoggingEnabled(loggingEnabled);
    setConfidenceThreshold(threshold);
    
    // Get error stats
    const stats = errorHandling.getErrorStats();
    setErrorStats(stats);
  }, []);
  
  const handleSaveSettings = () => {
    setIsSaving(true);
    
    try {
      // Save all settings
      localStorage.setItem('ai_features_enabled', isAIEnabled.toString());
      localStorage.setItem('auto_generate_content', autoGenerate.toString());
      localStorage.setItem('ai_cache_enabled', cacheEnabled.toString());
      localStorage.setItem('ai_logging_enabled', loggingEnabled.toString());
      localStorage.setItem('ai_confidence_threshold', confidenceThreshold.toString());
      
      // Apply settings to services
      if (cacheEnabled !== (localStorage.getItem('ai_cache_enabled') !== 'false')) {
        cacheService.setEnabled(cacheEnabled);
      }
      
      if (loggingEnabled !== (localStorage.getItem('ai_logging_enabled') !== 'false')) {
        loggingService.setEnabled(loggingEnabled);
      }
      
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

  const handleClearErrorStats = () => {
    try {
      errorHandling.clearErrorStats();
      setErrorStats(errorHandling.getErrorStats());
      
      toast({
        title: "Error Stats Cleared",
        description: "AI error statistics have been reset successfully.",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error Clearing Stats",
        description: "There was a problem clearing the error statistics.",
        variant: "destructive"
      });
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
            Email Buddy includes built-in AI assistance to help you create better emails.
            Our AI can summarize threads, suggest replies, analyze sentiment, and more.
          </p>
        </div>
        
        {isAIEnabled && (
          <>
            <div className="space-y-4 mt-4">
              <h3 className="text-sm font-medium">Advanced Settings</h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cache-toggle" className="font-medium">Enable Response Caching</Label>
                  <Switch 
                    id="cache-toggle" 
                    checked={cacheEnabled} 
                    onCheckedChange={setCacheEnabled} 
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Cache AI responses for faster performance and reduced processing time
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="logging-toggle" className="font-medium">Enable AI Feedback Collection</Label>
                  <Switch 
                    id="logging-toggle" 
                    checked={loggingEnabled} 
                    onCheckedChange={setLoggingEnabled} 
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Help us improve by allowing anonymous collection of AI usage data
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confidence-slider" className="font-medium">AI Confidence Threshold: {confidenceThreshold}%</Label>
                <Slider
                  id="confidence-slider"
                  min={0}
                  max={100}
                  step={5}
                  value={[confidenceThreshold]}
                  onValueChange={(value) => setConfidenceThreshold(value[0])}
                  className="py-4"
                />
                <p className="text-sm text-gray-500">
                  Set the minimum confidence level required for AI-generated content
                </p>
              </div>

              {errorStats && (
                <div className="space-y-2 border rounded-md p-4 bg-gray-50 dark:bg-gray-900/30">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">AI Error Statistics</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleClearErrorStats}
                    >
                      Clear Stats
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                    <div>Total requests: {errorStats.totalRequests || 0}</div>
                    <div>Failed requests: {errorStats.failedRequests || 0}</div>
                    <div>Success rate: {errorStats.totalRequests ? 
                      (((errorStats.totalRequests - errorStats.failedRequests) / errorStats.totalRequests) * 100).toFixed(1) + '%' 
                      : 'N/A'}</div>
                    <div>Last error: {errorStats.lastErrorTime ? new Date(errorStats.lastErrorTime).toLocaleString() : 'None'}</div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Available AI Features:</h3>
              <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
                <li>Email summarization - create clear, professional summaries of emails</li>
                <li>Smart reply suggestions - generate context-aware reply options</li>
                <li>Email composition - create well-formatted emails quickly</li>
                <li>Content improvement - enhance grammar and clarity</li>
                <li>Email analysis - identify key points and action items</li>
                <li>Tone adjustment - formal, friendly, assertive, and more</li>
                <li>Auto-generation - create email content based on subject line</li>
              </ul>
            </div>
          </>
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