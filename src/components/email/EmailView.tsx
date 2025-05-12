import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGmailMessageContent, useStarGmailMessage } from '@/services/gmail';
import { 
  useSummarizeEmailThread, 
  useGenerateReplyOptions,
  useGenerateFullReply,
  useAnalyzeEmail,
  isAIConfigured
} from '@/services/ai/hooks';
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
  FileText,
  AlertCircle,
  Clock,
  MessageSquare,
  Clipboard,
  ChevronDown,
  Check
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import AIFeatureGuide from '../ai/AIFeatureGuide';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<{
    sentiment: 'positive' | 'negative' | 'neutral';
    keyPoints: string[];
    actionItems: string[];
    urgency: 'low' | 'medium' | 'high';
  } | null>(null);
  const [isAutoReplyOpen, setIsAutoReplyOpen] = useState(false);
  const [replyTone, setReplyTone] = useState<'formal' | 'friendly' | 'assertive' | 'concise' | 'persuasive'>('friendly');
  const [replyLength, setReplyLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [additionalContext, setAdditionalContext] = useState('');
  const [generatedReply, setGeneratedReply] = useState('');
  
  // AI hooks
  const summarizeEmail = useSummarizeEmailThread();
  const generateReplies = useGenerateReplyOptions();
  const generateFullReply = useGenerateFullReply();
  const analyzeEmailContent = useAnalyzeEmail();
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
  
  // Analyze email content
  const handleAnalyzeEmail = async () => {
    if (!messageContent) return;
    
    if (showAnalysis && analysis) {
      // Toggle off if already showing
      setShowAnalysis(false);
      return;
    }
    
    try {
      const result = await analyzeEmailContent.mutateAsync(messageContent);
      setAnalysis(result);
      setShowAnalysis(true);
      toast({
        title: "Email analyzed",
        description: "Email content has been analyzed for key information"
      });
    } catch (error) {
      // Error is handled in the hook
    }
  };
  
  // Generate full reply with options
  const handleGenerateFullReply = async () => {
    if (!messageContent) return;
    
    try {
      setGeneratedReply(''); // Clear any previous reply
      
      const reply = await generateFullReply.mutateAsync({
        emailContent: messageContent,
        options: {
          tone: replyTone,
          length: replyLength,
          context: additionalContext || undefined,
          includeIntro: true,
          includeOutro: true
        }
      });
      
      setGeneratedReply(reply);
      toast({
        title: "Reply generated",
        description: `A ${replyLength} ${replyTone} reply has been created`
      });
    } catch (error) {
      // Error is handled in the hook
    }
  };
  
  const handleUseGeneratedReply = () => {
    if (!generatedReply) return;
    
    navigate(`/compose?reply=${messageId}&body=${encodeURIComponent(generatedReply)}`);
    setIsAutoReplyOpen(false);
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
  
  const copyGeneratedReply = () => {
    if (!generatedReply) return;
    
    navigator.clipboard.writeText(generatedReply);
    toast({
      title: "Copied to clipboard",
      description: "Generated reply has been copied to your clipboard"
    });
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
  
  const urgencyColor = analysis?.urgency === 'high' ? 'destructive' : (analysis?.urgency === 'medium' ? 'yellow' : 'default');
  const sentimentColor = analysis?.sentiment === 'positive' ? 'green' : (analysis?.sentiment === 'negative' ? 'destructive' : 'default');
  
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleAnalyzeEmail}>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  {showAnalysis ? "Hide Analysis" : "Analyze Email"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsAutoReplyOpen(true)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Auto-Reply
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Email header info */}
        <div className="mt-4">
          <h2 className="text-xl font-medium">Subject line of the email</h2>
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <span>From: Sender Name &lt;sender@example.com&gt;</span>
            <span className="mx-2">•</span>
            <span>Today at 12:34 PM</span>
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
        
        {/* Email analysis section */}
        {showAnalysis && analysis && (
          <div className="mt-4 p-3 border border-gray-200 rounded-md bg-gray-50">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <AlertCircle size={16} className="mr-2 text-blue-500" />
              Email Analysis
            </h3>
            
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant={sentimentColor === 'green' ? 'default' : sentimentColor}>
                Sentiment: {analysis.sentiment.charAt(0).toUpperCase() + analysis.sentiment.slice(1)}
              </Badge>
              <Badge variant={urgencyColor}>
                Urgency: {analysis.urgency.charAt(0).toUpperCase() + analysis.urgency.slice(1)}
              </Badge>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="key-points">
                <AccordionTrigger className="text-sm py-1">Key Points</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {analysis.keyPoints.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              {analysis.actionItems.length > 0 && (
                <AccordionItem value="action-items">
                  <AccordionTrigger className="text-sm py-1">Action Items</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {analysis.actionItems.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        )}
        
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
        <AIFeatureGuide 
          title="Unlock Email Intelligence" 
          description="Configure AI to access email summarization and smart replies" 
        />
        
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
      
      {/* Auto-Reply Dialog */}
      <Dialog open={isAutoReplyOpen} onOpenChange={setIsAutoReplyOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Generate AI Reply
            </DialogTitle>
            <DialogDescription>
              Let AI generate a complete reply to this email with your preferences
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reply-tone">Reply Tone</Label>
                <select 
                  id="reply-tone"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1"
                  value={replyTone}
                  onChange={(e) => setReplyTone(e.target.value as any)}
                >
                  <option value="friendly">Friendly</option>
                  <option value="formal">Formal</option>
                  <option value="assertive">Assertive</option>
                  <option value="concise">Concise</option>
                  <option value="persuasive">Persuasive</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="reply-length">Reply Length</Label>
                <select 
                  id="reply-length"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1"
                  value={replyLength}
                  onChange={(e) => setReplyLength(e.target.value as any)}
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="context">Additional Context (optional)</Label>
              <Textarea 
                id="context"
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="Include any specific points you want to address in the reply..."
                className="mt-1"
                rows={3}
              />
            </div>
            
            {generatedReply && (
              <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-medium">Generated Reply</h4>
                  <Button variant="ghost" size="sm" onClick={copyGeneratedReply} className="h-7 text-xs">
                    <Clipboard size={14} className="mr-1" />
                    Copy
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none">
                  {generatedReply.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAutoReplyOpen(false)}
              disabled={generateFullReply.isPending}
            >
              Cancel
            </Button>
            
            {generatedReply ? (
              <Button onClick={handleUseGeneratedReply}>
                <Reply size={16} className="mr-2" />
                Use This Reply
              </Button>
            ) : (
              <Button 
                onClick={handleGenerateFullReply}
                disabled={generateFullReply.isPending}
              >
                {generateFullReply.isPending ? (
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                ) : (
                  <Sparkles size={16} className="mr-2" />
                )}
                Generate Reply
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default EmailView; 