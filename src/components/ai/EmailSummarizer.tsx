import React, { useState } from 'react';
import { useSummarizeEmailBriefly } from '@/services/ai/hooks';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RefreshCw, Copy, CheckCheck, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EmailSummarizer: React.FC = () => {
  const { toast } = useToast();
  const [emailContent, setEmailContent] = useState('');
  const [summary, setSummary] = useState('');
  const [copied, setCopied] = useState(false);
  
  const summarizeEmail = useSummarizeEmailBriefly();
  
  const handleSummarize = async () => {
    if (!emailContent.trim()) {
      toast({
        title: "Email content required",
        description: "Please enter the email content to summarize",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const result = await summarizeEmail.mutateAsync(emailContent);
      setSummary(result);
    } catch (error) {
      console.error('Error summarizing email:', error);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    
    toast({
      title: "Summary copied",
      description: "Email summary copied to clipboard"
    });
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">📩 Email Summarizer</CardTitle>
        <CardDescription>
          Creates a clear, professional summary of the email content, focusing only on the visible text
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-500 mb-2">Enter the email content you want to summarize:</p>
          <Textarea 
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
            placeholder="Paste the email content here..."
            className="h-32 resize-none"
          />
        </div>
        
        <Button 
          onClick={handleSummarize} 
          disabled={summarizeEmail.isPending || !emailContent.trim()}
          className="w-full"
        >
          {summarizeEmail.isPending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Summarizing...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Summarize Email
            </>
          )}
        </Button>
        
        {summary && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Summary:</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopy}
              >
                {copied ? (
                  <CheckCheck className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="border rounded-lg p-3 bg-muted/30">
              <p className="text-sm">{summary}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailSummarizer; 