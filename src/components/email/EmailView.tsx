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
import type { EmailAnalysis } from '@/services/ai/types';
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
  Check,
  AlertTriangle
} from 'lucide-react';
import FeedbackPrompt from '../ai/FeedbackPrompt';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import AIFeatureGuide from '../ai/AIFeatureGuide';
import loggingService from '@/services/ai/loggingService';
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
  messageContent?: string;
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
  const [analysis, setAnalysis] = useState<EmailAnalysis | null>(null);
  const [isAutoReplyOpen, setIsAutoReplyOpen] = useState(false);
  const [replyTone, setReplyTone] = useState<'formal' | 'friendly' | 'assertive' | 'concise' | 'persuasive'>('friendly');
  const [replyLength, setReplyLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [additionalContext, setAdditionalContext] = useState('');
  const [generatedReply, setGeneratedReply] = useState('');
  const [generatedReplyMetadata, setGeneratedReplyMetadata] = useState<{
    questionsAddressed: string[];
    actionItemsIncluded: string[];
    deadlinesReferenced: Array<{ text: string; date: string }>;
    confidence: number;
    requiresHumanReview: boolean;
    reviewReason?: string;
  }>({
    questionsAddressed: [],
    actionItemsIncluded: [],
    deadlinesReferenced: [],
    confidence: 0.8,
    requiresHumanReview: false
  });
  
  // Feedback states
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);
  const [currentReplyId, setCurrentReplyId] = useState<string | null>(null);

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
        title: "Email summarized",
        description: "A clear summary of the email content has been created"
      });
    } catch (error) {
      // Error is handled in the hook
    }
  };

  // Generate reply suggestions
  const handleGenerateReplies = async () => {
    if (!messageContent) return;

    try {
      const result = await generateReplies.mutateAsync(messageContent);
      setReplyOptions(result.replies);
      
      // Store the reply ID for feedback
      if (result.id) {
        setCurrentReplyId(result.id);
      }
      
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
      // Convert string dates to Date objects
      const analysisWithDateObjects = {
        ...result,
        deadlines: result.deadlines.map(d => ({
          ...d,
          date: new Date(d.date)
        }))
      };
      setAnalysis(analysisWithDateObjects);
      setShowAnalysis(true);
      toast({
        title: "Email analyzed",
        description: "Email content has been analyzed for key information"
      });
    } catch (error) {
      // Error is handled in the hook
    }
  };

  // Handler for opening the auto-reply dialog
  const handleOpenAutoReply = () => {
    if (!messageContent) {
      toast({
        title: "No message content",
        description: "Cannot generate reply for an empty message",
        variant: "destructive"
      });
      return;
    }
    setIsAutoReplyOpen(true);
  };

  // Handler for closing the auto-reply dialog
  const handleCloseAutoReply = () => {
    setIsAutoReplyOpen(false);
    // Reset states when closing dialog
    setGeneratedReply('');
    setAdditionalContext('');
    setReplyTone('friendly');
    setReplyLength('medium');
    setGeneratedReplyMetadata({
      questionsAddressed: [],
      actionItemsIncluded: [],
      deadlinesReferenced: [],
      confidence: 0.8,
      requiresHumanReview: false
    });
  };

  // Handler for generating full reply
  const handleGenerateFullReply = async () => {
    if (!messageContent) return;

    try {
      // Clear previous states and show loading
      setGeneratedReply('');
      setGeneratedReplyMetadata({
        questionsAddressed: [],
        actionItemsIncluded: [],
        deadlinesReferenced: [],
        confidence: 0,
        requiresHumanReview: false
      });

      const result = await generateFullReply.mutateAsync({
        emailContent: messageContent,
        options: {
          tone: replyTone,
          length: replyLength,
          context: additionalContext || undefined,
          includeIntro: true,
          includeOutro: true
        }
      });

      setGeneratedReply(result.text);
      
      // Convert Date objects to strings in deadlinesReferenced before setting state
      const formattedMetadata = {
        ...result.metadata,
        deadlinesReferenced: result.metadata.deadlinesReferenced.map(deadline => ({
          ...deadline,
          date: typeof deadline.date === 'object' ? deadline.date.toISOString() : deadline.date
        }))
      };
      
      setGeneratedReplyMetadata(formattedMetadata);
      
      // Store the reply ID for feedback tracking
      if (result.id) {
        setCurrentReplyId(result.id);
      }

      toast({
        title: "Reply Generated",
        description: `A ${replyLength} ${replyTone} reply has been created`
      });
    } catch (error) {
      toast({
        title: "Error generating reply",
        description: "Failed to generate reply. Please try again.",
        variant: "destructive"
      });
      handleCloseAutoReply();
    }
  };

  const handleUseGeneratedReply = () => {
    if (!generatedReply) return;

    // Check if we have a reply ID for feedback tracking
    if (currentReplyId) {
      // Mark this reply as used in the logging service
      try {
        loggingService.markReplyAsUsed(currentReplyId, false);
        
        // Show feedback prompt after a short delay to allow navigation
        setTimeout(() => {
          setShowFeedbackPrompt(true);
        }, 2000);
      } catch (error) {
        console.error('Error marking reply as used:', error);
      }
    }

    navigate(`/compose?reply=${messageId}&body=${encodeURIComponent(generatedReply)}&replyId=${currentReplyId}&originalReplyText=${encodeURIComponent(generatedReply)}`);
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
    // If there's an AI-generated reply and we're replying normally,
    // this means the user is choosing to edit the reply manually
    if (currentReplyId && generatedReply) {
      navigate(`/compose?reply=${messageId}&body=${encodeURIComponent(generatedReply)}&replyId=${currentReplyId}&originalReplyText=${encodeURIComponent(generatedReply)}`);
    } else {
      // Standard reply without AI
      navigate('/compose?reply=' + messageId);
    }
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

  // Handle the use of quick reply suggestions
  const handleUseReply = (replyText: string) => {
    // Store quick reply usage for feedback
    if (currentReplyId) {
      try {
        loggingService.markReplyAsUsed(currentReplyId, false);
        
        // Show feedback prompt after a short delay
        setTimeout(() => {
          setShowFeedbackPrompt(true);
        }, 2000);
      } catch (error) {
        console.error('Error marking quick reply as used:', error);
      }
    }
    
    // Navigate to compose with the reply text pre-filled
    navigate(`/compose?reply=${messageId}&body=${encodeURIComponent(replyText)}&replyId=${currentReplyId}&originalReplyText=${encodeURIComponent(replyText)}`);
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

  if (error instanceof Error) {
    let errorTitle = 'Message not found';
    let errorDescription = 'The message could not be loaded. It may have been deleted or you may not have permission to view it.';

    if (error.message === 'MESSAGE_NOT_FOUND') {
      errorDescription = 'This message has been deleted or moved to trash.';
    } else if (error.message === 'PERMISSION_DENIED') {
      errorTitle = 'Access denied';
      errorDescription = 'You do not have permission to view this message.';
    } else if (error.message === 'INVALID_TOKEN') {
      errorTitle = 'Authentication error';
      errorDescription = 'Your Gmail session has expired. Please sign out and sign in again.';
    } else if (error.message === 'EMPTY_MESSAGE') {
      errorTitle = 'Empty message';
      errorDescription = 'This message appears to be empty or in an unsupported format.';
    }

    return (
      <Card>
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
          </div>
          <h2 className="text-lg font-medium mt-4">{errorTitle}</h2>
          <p className="text-sm text-gray-500">
            {errorDescription}
          </p>
        </CardHeader>
      </Card>
    );
  }

  const urgencyColor = analysis?.urgency === 'high' ? 'destructive' : (analysis?.urgency === 'medium' ? 'secondary' : 'default');
  const sentimentColor = analysis?.sentiment.tone === 'positive' ? 'green' : (analysis?.sentiment.tone === 'negative' ? 'destructive' : 'default');

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
                <DropdownMenuItem onClick={handleOpenAutoReply}>
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
            title="Creates a clear, professional summary focused on the email content"
          >
            {summarizeEmail.isPending ? (
              <RefreshCw size={16} className="mr-2 animate-spin" />
            ) : (
              <FileText size={16} className="mr-2" />
            )}
            Summarize Email
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
          <div className="mt-4 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <AlertCircle size={16} className="mr-2 text-blue-500" />
              Email Analysis
            </h3>

            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant={sentimentColor === 'green' ? 'default' : sentimentColor}>
                Sentiment: {analysis.sentiment.tone.charAt(0).toUpperCase() + analysis.sentiment.tone.slice(1)}
              </Badge>
              <Badge variant={urgencyColor}>
                Urgency: {analysis.urgency.charAt(0).toUpperCase() + analysis.urgency.slice(1)}
              </Badge>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {analysis.questions && analysis.questions.length > 0 && (
                <AccordionItem value="questions">
                  <AccordionTrigger className="text-sm py-1">Questions</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {analysis.questions.map((question, i) => (
                        <li key={i}>{question}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              )}

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
              <div className="prose max-w-none whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                {summary.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
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
      <Dialog open={isAutoReplyOpen} onOpenChange={(open) => {
        if (!open) {
          setGeneratedReply('');
          setAdditionalContext('');
          setReplyTone('friendly');
          setReplyLength('medium');
          setGeneratedReplyMetadata({
            questionsAddressed: [],
            actionItemsIncluded: [],
            deadlinesReferenced: [],
            confidence: 0.8,
            requiresHumanReview: false
          });
        }
        setIsAutoReplyOpen(open);
      }}>
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
              <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-medium">Generated Reply</h4>
                  <Button variant="ghost" size="sm" onClick={copyGeneratedReply} className="h-7 text-xs">
                    <Clipboard size={14} className="mr-1" />
                    Copy
                  </Button>
                </div>

                {generatedReplyMetadata.requiresHumanReview && (
                  <div className="mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded text-yellow-800 dark:text-yellow-200">
                    <AlertTriangle className="h-4 w-4 inline-block mr-2" />
                    <span className="text-sm">Human review recommended: {generatedReplyMetadata.reviewReason}</span>
                  </div>
                )}

                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium">Confidence Score:</span>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500" 
                        style={{ width: `${generatedReplyMetadata.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm">{Math.round(generatedReplyMetadata.confidence * 100)}%</span>
                  </div>
                </div>

                <div className="prose prose-sm max-w-none">
                  {generatedReply.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </div>

                {generatedReplyMetadata.questionsAddressed.length > 0 && (
                  <div className="mt-4 text-sm">
                    <p className="font-medium mb-1">Questions Addressed:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {generatedReplyMetadata.questionsAddressed.map((q, i) => (
                        <li key={i} className="text-gray-600 dark:text-gray-400">{q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {generatedReplyMetadata.actionItemsIncluded.length > 0 && (
                  <div className="mt-4 text-sm">
                    <p className="font-medium mb-1">Action Items Included:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {generatedReplyMetadata.actionItemsIncluded.map((item, i) => (
                        <li key={i} className="text-gray-600 dark:text-gray-400">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {generatedReplyMetadata.deadlinesReferenced.length > 0 && (
                  <div className="mt-4 text-sm">
                    <p className="font-medium mb-1">Deadlines Referenced:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {generatedReplyMetadata.deadlinesReferenced.map((deadline, i) => (
                        <li key={i} className="text-gray-600 dark:text-gray-400">
                          {deadline.text} - {new Date(deadline.date).toLocaleDateString()}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCloseAutoReply}
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
      
      {/* Feedback Dialog */}
      {currentReplyId && (
        <FeedbackPrompt 
          replyId={currentReplyId}
          show={showFeedbackPrompt}
          onClose={() => setShowFeedbackPrompt(false)}
        />
      )}
    </Card>
  );
};

export default EmailView;