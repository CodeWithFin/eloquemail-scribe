import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGmailMessageContent, useStarGmailMessage } from '@/services/gmail';
import { useSummarizeEmailThread, useGenerateReplyOptions } from '@/services/ai/hooks';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Reply, 
  Forward, 
  Trash, 
  Star, 
  MoreHorizontal, 
  ArrowLeft, 
  RefreshCw,
  Sparkles,
  FileText
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';

interface EmailViewProps {
  messageId: string;
  onBack?: () => void;
}

const EmailView: React.FC<EmailViewProps> = ({ messageId, onBack }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: messageContent, isLoading, error } = useGmailMessageContent(messageId);
  const [isStarred, setIsStarred] = useState(false);
  const [activeTab, setActiveTab] = useState<'original' | 'summary'>('original');
  const [summaryGenerated, setSummaryGenerated] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [replyOptions, setReplyOptions] = useState<string[]>([]);
  
  // AI hooks
  const summarizeEmail = useSummarizeEmailThread();
  const generateReplies = useGenerateReplyOptions();
  const starMessage = useStarGmailMessage();
  
  // Generate summary when requested
  const handleGenerateSummary = async () => {
    if (!messageContent) return;
    
    try {
      const summarized = await summarizeEmail.mutateAsync(messageContent);
      setSummary(summarized);
      setSummaryGenerated(true);
      setActiveTab('summary');
      toast({
        title: "Summary generated",
        description: "Email has been summarized for quick reading"
      });
    } catch (error) {
      // Error is handled in the hook
    }
  };
  
  // Generate reply suggestions
  const handleGenerateReplies = async () => {
    if (!messageContent) return;
    
    try {
      const replies = await generateReplies.mutateAsync(messageContent);
      setReplyOptions(replies);
      toast({
        title: "Reply options generated",
        description: "Smart replies have been created based on the email content"
      });
    } catch (error) {
      // Error is handled in the hook
    }
  };
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/dashboard');
    }
  };
  
  const handleReply = () => {
    // Implement reply functionality
    navigate('/compose?reply=' + messageId);
  };
  
  const handleForward = () => {
    // Implement forward functionality
    navigate('/compose?forward=' + messageId);
  };
  
  const handleStar = async () => {
    setIsStarred(!isStarred);
    try {
      await starMessage.mutateAsync({ id: messageId, starred: !isStarred });
    } catch (error) {
      // Revert on error
      setIsStarred(isStarred);
      toast({
        title: "Error",
        description: "Failed to update starred status",
        variant: "destructive"
      });
    }
  };
  
  const handleDelete = () => {
    // Implement delete functionality
    if (window.confirm('Are you sure you want to delete this message?')) {
      // Delete message
      handleBack();
    }
  };
  
  const handleUseReply = (replyText: string) => {
    // Navigate to compose with the reply text pre-filled
    navigate(`/compose?reply=${messageId}&body=${encodeURIComponent(replyText)}`);
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
            <div className="space-x-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-6 w-3/4 mt-4" />
          <Skeleton className="h-4 w-1/4 mt-2" />
        </CardHeader>
        <CardContent className="pt-6">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-5/6 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
        </CardContent>
      </Card>
    );
  }
  
  if (error || !messageContent) {
    return (
      <Card>
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
          </div>
          <h2 className="text-lg font-medium mt-4">Message not found</h2>
          <p className="text-sm text-gray-500">
            The message could not be loaded. It may have been deleted or you may not have permission to view it.
          </p>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <div className="space-x-2">
            <Button variant="ghost" size="icon" onClick={handleReply}>
              <Reply size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleForward}>
              <Forward size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleStar}>
              <Star size={18} fill={isStarred ? "currentColor" : "none"} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDelete}>
              <Trash size={18} />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreHorizontal size={18} />
            </Button>
          </div>
        </div>
        
        {/* Email header info */}
        <div className="mt-4">
          <h2 className="text-xl font-medium">Subject line of the email</h2>
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <span className="font-medium">From:</span>
            <span className="ml-2">sender@example.com</span>
          </div>
          <div className="flex items-center mt-1 text-sm text-gray-500">
            <span className="font-medium">To:</span>
            <span className="ml-2">recipient@example.com</span>
          </div>
          <div className="flex items-center mt-1 text-sm text-gray-500">
            <span className="font-medium">Date:</span>
            <span className="ml-2">June 15, 2023 at 10:30 AM</span>
          </div>
        </div>
        
        {/* AI actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerateSummary}
            disabled={summarizeEmail.isPending}
          >
            {summarizeEmail.isPending ? (
              <RefreshCw size={16} className="mr-2 animate-spin" />
            ) : (
              <FileText size={16} className="mr-2" />
            )}
            Summarize
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerateReplies}
            disabled={generateReplies.isPending || replyOptions.length > 0}
          >
            {generateReplies.isPending ? (
              <RefreshCw size={16} className="mr-2 animate-spin" />
            ) : (
              <Sparkles size={16} className="mr-2" />
            )}
            Smart Replies
          </Button>
        </div>
        
        {/* Smart reply options */}
        {replyOptions.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium text-gray-700">Suggested replies:</p>
            <div className="flex flex-wrap gap-2">
              {replyOptions.map((reply, index) => (
                <Button 
                  key={index} 
                  variant="secondary" 
                  size="sm"
                  onClick={() => handleUseReply(reply)}
                  className="text-xs"
                >
                  {reply.length > 50 ? `${reply.substring(0, 47)}...` : reply}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-6">
        {summaryGenerated ? (
          <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as 'original' | 'summary')}>
            <TabsList className="mb-4">
              <TabsTrigger value="original">Original</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>
            <TabsContent value="original">
              <div 
                className="prose max-w-none" 
                dangerouslySetInnerHTML={{ __html: messageContent }}
              />
            </TabsContent>
            <TabsContent value="summary">
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: summary }} />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div 
            className="prose max-w-none" 
            dangerouslySetInnerHTML={{ __html: messageContent }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default EmailView; 