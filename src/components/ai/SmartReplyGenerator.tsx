import React, { useState } from 'react';
import { useGenerateSmartReplies, useAnalyzeEmail } from '@/services/ai/hooks';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RefreshCw, Copy, CheckCheck, ArrowRight, AlertCircle, Clock, MessageSquare, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface SmartReplyGeneratorProps {
  onReplySelect?: (reply: string) => void;
}

const SmartReplyGenerator: React.FC<SmartReplyGeneratorProps> = ({ onReplySelect }) => {
  const { toast } = useToast();
  const [emailContent, setEmailContent] = useState('');
  const [generatedReplies, setGeneratedReplies] = useState<string[]>([]);
  const [selectedReply, setSelectedReply] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [emailAnalysis, setEmailAnalysis] = useState<any>(null);
  
  const generateReplies = useGenerateSmartReplies();
  const analyzeEmail = useAnalyzeEmail();
  
  const handleGenerateReplies = async () => {
    if (!emailContent.trim()) {
      toast({
        title: "Email content required",
        description: "Please enter the email content to generate replies",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // First analyze the email to get context
      const analysis = await analyzeEmail.mutateAsync(emailContent);
      setEmailAnalysis(analysis);
      
      // Then generate contextual replies
      const replies = await generateReplies.mutateAsync(emailContent);
      setGeneratedReplies(replies);
    } catch (error) {
      console.error('Error generating replies:', error);
      toast({
        title: "Error",
        description: "Failed to generate smart replies. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleCopyReply = (reply: string, index: number) => {
    navigator.clipboard.writeText(reply);
    setCopiedIndex(index);
    
    toast({
      title: "Reply copied",
      description: "Smart reply copied to clipboard"
    });
    
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };
  
  const handleSelectReply = (reply: string) => {
    setSelectedReply(reply);
    if (onReplySelect) {
      onReplySelect(reply);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">🔁 Smart Reply Generator</CardTitle>
        <CardDescription>
          Generates contextually aware replies based on email content and intent
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-500 mb-2">Enter the email content you want to reply to:</p>
          <Textarea 
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
            placeholder="Paste the email content here..."
            className="h-32 resize-none"
          />
        </div>
        
        <Button 
          onClick={handleGenerateReplies} 
          disabled={generateReplies.isPending || analyzeEmail.isPending || !emailContent.trim()}
          className="w-full"
        >
          {(generateReplies.isPending || analyzeEmail.isPending) ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              {analyzeEmail.isPending ? "Analyzing email..." : "Generating replies..."}
            </>
          ) : (
            <>
              Generate Smart Replies
            </>
          )}
        </Button>
        
        {emailAnalysis && (
          <div className="pt-4 border-t">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <MessageSquare className="h-3 w-3" />
                {emailAnalysis.intent.charAt(0).toUpperCase() + emailAnalysis.intent.slice(1)}
              </Badge>
              
              <Badge 
                variant="outline" 
                className="flex items-center gap-1 text-xs"
                style={{ 
                  color: emailAnalysis.urgency === 'high' ? 'rgb(220, 38, 38)' : 
                         emailAnalysis.urgency === 'medium' ? 'rgb(234, 179, 8)' : 
                         'rgb(34, 197, 94)'
                }}
              >
                <Clock className="h-3 w-3" />
                {emailAnalysis.urgency.charAt(0).toUpperCase() + emailAnalysis.urgency.slice(1)} Urgency
              </Badge>
              
              {emailAnalysis.deadlines.length > 0 && (
                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  {emailAnalysis.deadlines.length} Deadline{emailAnalysis.deadlines.length > 1 ? 's' : ''}
                </Badge>
              )}
              
              {emailAnalysis.questions.length > 0 && (
                <Badge variant="outline" className="flex items-center gap-1 text-xs">
                  <AlertCircle className="h-3 w-3" />
                  {emailAnalysis.questions.length} Question{emailAnalysis.questions.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            {emailAnalysis.metadata.requiresHumanReview && (
              <div className="text-amber-600 dark:text-amber-400 flex items-center text-xs mt-1 mb-3">
                <AlertCircle className="h-3 w-3 mr-1" />
                <span>{emailAnalysis.metadata.reviewReason || "This email may require your personal attention"}</span>
              </div>
            )}
          </div>
        )}
        
        {generatedReplies.length > 0 && (
          <div className="space-y-3 mt-4">
            <p className="text-sm font-medium">Suggested replies:</p>
            {generatedReplies.map((reply, index) => (
              <div key={index} className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
                <p className="text-sm">{reply}</p>
                <div className="flex justify-end mt-2 space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCopyReply(reply, index)}
                  >
                    {copiedIndex === index ? (
                      <CheckCheck className="h-4 w-4 mr-1" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    {copiedIndex === index ? "Copied" : "Copy"}
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleSelectReply(reply)}
                  >
                    Use
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {selectedReply && (
        <CardFooter className="border-t bg-muted/50 flex flex-col items-stretch pt-4">
          <p className="text-sm font-medium mb-2">Selected reply:</p>
          <div className="border rounded-lg p-3 bg-background">
            <p className="text-sm">{selectedReply}</p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default SmartReplyGenerator; 