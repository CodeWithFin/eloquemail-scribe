import React, { useState } from 'react';
import { usePrioritizeEmail } from '@/services/ai/hooks';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, AlertCircle, ChevronDoubleUp, Clock, Flag, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const EmailPrioritizer: React.FC = () => {
  const { toast } = useToast();
  const [emailContent, setEmailContent] = useState('');
  const [priorityResult, setPriorityResult] = useState<{ 
    priority: 'High' | 'Medium' | 'Low';
    justification: string;
  } | null>(null);
  
  const prioritizeEmail = usePrioritizeEmail();
  
  const handlePrioritize = async () => {
    if (!emailContent.trim()) {
      toast({
        title: "Email content required",
        description: "Please enter the email content to analyze",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const result = await prioritizeEmail.mutateAsync(emailContent);
      setPriorityResult(result);
    } catch (error) {
      console.error('Error prioritizing email:', error);
    }
  };
  
  const getPriorityBadge = () => {
    if (!priorityResult) return null;
    
    const { priority } = priorityResult;
    
    switch (priority) {
      case 'High':
        return (
          <Badge className="bg-red-500">
            <ChevronDoubleUp className="h-3 w-3 mr-1" />
            High Priority
          </Badge>
        );
      case 'Medium':
        return (
          <Badge className="bg-yellow-500">
            <Flag className="h-3 w-3 mr-1" />
            Medium Priority
          </Badge>
        );
      case 'Low':
        return (
          <Badge className="bg-green-500">
            <Clock className="h-3 w-3 mr-1" />
            Low Priority
          </Badge>
        );
      default:
        return null;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">📊 Email Prioritizer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-500 mb-2">Enter the email content to analyze priority:</p>
          <Textarea 
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
            placeholder="Paste the email content here..."
            className="h-32 resize-none"
          />
        </div>
        
        <Button 
          onClick={handlePrioritize} 
          disabled={prioritizeEmail.isPending || !emailContent.trim()}
          className="w-full"
        >
          {prioritizeEmail.isPending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <AlertCircle className="mr-2 h-4 w-4" />
              Analyze Priority
            </>
          )}
        </Button>
        
        {priorityResult && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-medium">Analysis Result:</h3>
              {getPriorityBadge()}
            </div>
            
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5 shrink-0" />
                <p className="text-sm">{priorityResult.justification}</p>
              </div>
            </div>
            
            <div className="pt-2 text-xs text-gray-500">
              <p>Use this priority rating to help manage your email workflow and response times.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailPrioritizer; 