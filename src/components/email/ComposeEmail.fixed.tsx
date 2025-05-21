// filepath: /home/finley/start-up/email-buddy2.0/src/components/email/ComposeEmail.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { useSendGmailMessage, useCreateGmailDraft } from '@/services/gmail';
import { 
  useImproveEmailText, 
  useGenerateSubjectLine, 
  useAdjustEmailTone,
  useGenerateEmailContent,
  isAIConfigured
} from '@/services/ai/hooks';
import FeedbackPrompt from '../ai/FeedbackPrompt';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import loggingService from '@/services/ai/loggingService';
import { getTemplateById } from '@/services/templates';
import { scheduleEmail } from '@/services/email/scheduleService';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Send, 
  Save, 
  X, 
  MinusCircle, 
  PlusCircle, 
  Sparkles, 
  RefreshCw,
  Wand2,
  MessageSquare,
  FileText,
  Calendar
} from 'lucide-react';
import Editor from '../ui-custom/Editor';
import { toast } from '@/hooks/use-toast';
import AIFeatureGuide from '../ai/AIFeatureGuide';
import TemplateInserter from './TemplateInserter';
import EmailScheduler, { ScheduleOptions } from './EmailScheduler';
import FollowUpCreator, { FollowUpDetails } from './FollowUpCreator';
import { createFollowUp } from '@/services/email/followUpService';
import EmailTrackingToggle, { TrackingOptions } from './EmailTrackingToggle';
import { 
  addTrackingToLinks, 
  createEmailTracking, 
  generateTrackingPixel,
  simulateReadReceipt,
  simulateLinkClick
} from '@/services/email/trackingService';
import { useScheduledEmails, useUpdateScheduledEmail } from '@/services/scheduling/hooks';

interface ComposeEmailProps {
  onCancel?: () => void;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
}

// Debounce function to prevent too many API calls
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

const ComposeEmail: React.FC<ComposeEmailProps> = ({ 
  onCancel, 
  initialTo = '', 
  initialSubject = '', 
  initialBody = '' 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const scheduledEmailId = searchParams.get('scheduled');
  const replyId = searchParams.get('replyId');
  const originalReplyText = searchParams.get('originalReplyText');
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [isSchedulingEmail, setIsSchedulingEmail] = useState(false);
  const [trackingOptions, setTrackingOptions] = useState<TrackingOptions>({
    trackOpens: false,
    trackClicks: false,
  });
  const [isEditingScheduled, setIsEditingScheduled] = useState(false);
  
  // Feedback states
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);
  
  // Additional state for reply functionality
  const [originalBody, setOriginalBody] = useState('');
  
  // Gmail hooks
  const sendEmail = useSendGmailMessage();
  const saveDraft = useCreateGmailDraft();
  
  // AI hooks
  const improveText = useImproveEmailText();
  const generateSubject = useGenerateSubjectLine();
  const adjustTone = useAdjustEmailTone();
  const generateContent = useGenerateEmailContent();
  
  // Scheduling hooks
  const { data: scheduledEmails } = useScheduledEmails();
  const updateScheduledEmail = useUpdateScheduledEmail();
  
  // Check auto-generate setting and load template on component mount
  useEffect(() => {
    const isAutoGenerate = localStorage.getItem('auto_generate_content') === 'true';
    setAutoGenerate(isAutoGenerate);
    
    // Check if we have a template ID from navigation state
    if (location.state?.templateId) {
      setIsLoadingTemplate(true);
      const template = getTemplateById(location.state.templateId);
      if (template) {
        setBody(template.content);
        if (!subject && template.name) {
          setSubject(template.name);
        }
      }
      setIsLoadingTemplate(false);
    }
  }, [location.state, subject]);
  
  // Check if this is a reply to an AI-generated message
  useEffect(() => {
    // Extract replyId from URL if it exists
    const replyIdParam = searchParams.get('replyId');
    const originalBodyParam = searchParams.get('originalBody');
    
    if (replyIdParam) {
      // We already have replyId from URL params, no need to set it again
      // setReplyId(replyIdParam);
      
      if (originalBodyParam) {
        // Store the original AI-generated text for comparison
        setOriginalBody(decodeURIComponent(originalBodyParam));
      }
    }
  }, [searchParams]);

  // Load scheduled email data if editing
  useEffect(() => {
    if (scheduledEmailId && scheduledEmails) {
      const scheduledEmail = scheduledEmails.find(email => email.id === scheduledEmailId);
      if (scheduledEmail) {
        setIsEditingScheduled(true);
        setTo(scheduledEmail.email.to);
        setCc(scheduledEmail.email.cc || '');
        setBcc(scheduledEmail.email.bcc || '');
        setSubject(scheduledEmail.email.subject);
        setBody(scheduledEmail.email.body);
        setIsSchedulingEmail(true);
      }
    }
  }, [scheduledEmailId, scheduledEmails]);

  const handleSend = async () => {
    if (!to) {
      toast({
        title: "Missing recipient",
        description: "Please enter a recipient email address",
        variant: "destructive"
      });
      return;
    }
    
    try {
      let emailBody = body;
      let trackingId: string | undefined;
      
      // Create tracking if any tracking option is enabled
      if (trackingOptions.trackOpens || trackingOptions.trackClicks) {
        // Create tracking record
        const tracking = createEmailTracking({
          emailId: 'email_' + Date.now(), // Generate a unique ID
          subject,
          recipient: to,
          sentAt: new Date().toISOString()
        });
        
        trackingId = tracking.id;
        
        // Add tracking pixel for read receipts if enabled
        if (trackingOptions.trackOpens) {
          emailBody += generateTrackingPixel(trackingId);
          
          // For demo purposes: simulate the read receipt after some time
          simulateReadReceipt(trackingId);
        }
        
        // Add tracking to links if enabled
        if (trackingOptions.trackClicks) {
          emailBody = addTrackingToLinks(emailBody, trackingId);
          
          // For demo purposes: simulate link clicks if we have links
          if (emailBody.includes('href=')) {
            const demoUrl = 'https://example.com/demo';
            simulateLinkClick(trackingId, demoUrl);
          }
        }
        
        toast({
          title: "Email tracking enabled",
          description: "You'll be able to track opens and clicks in the Tracking page"
        });
      }

      await sendEmail.mutateAsync({
        to,
        subject,
        body: emailBody,
        cc: showCc ? cc : undefined,
        bcc: showBcc ? bcc : undefined
      });
      
      // Check if this is a reply to an AI-generated message and show feedback prompt
      if (replyId) {
        // Determine if the reply was edited
        const wasEdited = originalReplyText && body !== originalReplyText;
        
        // Mark reply as used in logging service
        loggingService.markReplyAsUsed(replyId, wasEdited);
        
        // Show feedback prompt after a short delay
        setTimeout(() => {
          setShowFeedbackPrompt(true);
        }, 2000);
      } else {
        // Reset form and navigate back to inbox if no feedback needed
        resetForm();
        if (onCancel) {
          onCancel();
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      // Error is handled in the hook
    }
  };
  
  const handleSaveDraft = async () => {
    if (!to && !subject && !body) {
      if (onCancel) {
        onCancel();
      }
      return;
    }
    
    try {
      await saveDraft.mutateAsync({
        to,
        subject,
        body,
        cc: showCc ? cc : undefined,
        bcc: showBcc ? bcc : undefined
      });
      
      // Reset form and navigate back to inbox
      resetForm();
      if (onCancel) {
        onCancel();
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      // Error is handled in the hook
    }
  };
  
  const handleScheduleEmail = (scheduleOptions: ScheduleOptions) => {
    if (!to) {
      toast({
        title: "Missing recipient",
        description: "Please enter a recipient email address",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create a date object combining the selected date and time
      const [hours, minutes] = scheduleOptions.time.split(':').map(Number);
      const scheduledDate = new Date(scheduleOptions.date);
      scheduledDate.setHours(hours, minutes, 0, 0);
      
      // Schedule the email
      scheduleEmail({
        emailId: '', // We don't have a draft ID in this case
        subject,
        to: to.split(',').map(email => email.trim()),
        cc: showCc && cc ? cc.split(',').map(email => email.trim()) : undefined,
        bcc: showBcc && bcc ? bcc.split(',').map(email => email.trim()) : undefined,
        body,
        scheduledTime: scheduledDate.toISOString()
      });
      
      toast({
        title: "Email scheduled",
        description: `Your email will be sent on ${scheduledDate.toLocaleDateString()} at ${scheduleOptions.time}`
      });
      
      resetForm();
      navigate('/scheduled');
    } catch (error) {
      console.error('Error scheduling email:', error);
      toast({
        title: "Scheduling failed",
        description: "There was an error scheduling your email",
        variant: "destructive"
      });
    }
  };
  
  const handleCreateFollowUp = (followUpDetails: FollowUpDetails) => {
    try {
      createFollowUp({
        emailId: '',
        subject: followUpDetails.subject,
        recipient: followUpDetails.recipient,
        dueDate: followUpDetails.dueDate.toISOString(),
        notes: followUpDetails.notes,
        priority: followUpDetails.priority,
        status: 'pending'
      });
      
      toast({
        title: "Follow-up created",
        description: `You'll be reminded to follow up on ${followUpDetails.dueDate.toLocaleDateString()}`
      });
    } catch (error) {
      console.error('Error creating follow-up:', error);
      toast({
        title: "Error",
        description: "Failed to create follow-up reminder",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setTo('');
    setSubject('');
    setBody('');
    setCc('');
    setBcc('');
    setShowCc(false);
    setShowBcc(false);
  };
  
  const handleCancel = () => {
    if (to || subject || body) {
      if (window.confirm('Discard this email?')) {
        resetForm();
        if (onCancel) {
          onCancel();
        } else {
          navigate('/dashboard');
        }
      }
    } else {
      if (onCancel) {
        onCancel();
      } else {
        navigate('/dashboard');
      }
    }
  };
  
  // AI-powered features
  const handleImproveText = async () => {
    if (!body) {
      toast({
        title: "Nothing to improve",
        description: "Please write some content first"
      });
      return;
    }
    
    try {
      const improved = await improveText.mutateAsync(body);
      setBody(improved);
      toast({
        title: "Text improved",
        description: "Your email has been enhanced"
      });
    } catch (error) {
      // Error is handled in the hook
    }
  };
  
  const handleGenerateSubject = async () => {
    if (!body) {
      toast({
        title: "Cannot generate subject",
        description: "Please write your email content first"
      });
      return;
    }
    
    try {
      const generatedSubject = await generateSubject.mutateAsync(body);
      setSubject(generatedSubject);
      toast({
        title: "Subject generated",
        description: "A subject line has been created based on your content"
      });
    } catch (error) {
      // Error is handled in the hook
    }
  };
  
  const handleAdjustTone = async (tone: 'formal' | 'friendly' | 'assertive' | 'concise' | 'persuasive') => {
    if (!body) {
      toast({
        title: "Nothing to adjust",
        description: "Please write some content first"
      });
      return;
    }
    
    try {
      const adjustedText = await adjustTone.mutateAsync({ text: body, tone });
      setBody(adjustedText);
      toast({
        title: "Tone adjusted",
        description: `Your email now sounds more ${tone}`
      });
    } catch (error) {
      // Error is handled in the hook
    }
  };
  
  // Generate email content based on subject
  const handleGenerateContent = async () => {
    if (!subject) {
      toast({
        title: "Missing subject",
        description: "Please enter a subject line first"
      });
      return;
    }
    
    // If there's existing content, confirm before replacing
    if (body) {
      if (!window.confirm("This will replace your existing email content. Are you sure?")) {
        return;
      }
    }
    
    try {
      const generatedContent = await generateContent.mutateAsync(subject);
      setBody(generatedContent);
      toast({
        title: "Content generated",
        description: "Email content has been created based on your subject"
      });
    } catch (error) {
      // Error is handled in the hook
    }
  };
  
  // Debounced version of content generation with no confirmation
  const debouncedGenerateContent = useCallback(
    debounce(async (subjectText: string) => {
      if (!subjectText || subjectText.length < 3 || !isAIConfigured() || !autoGenerate) {
        return;
      }
      
      try {
        // Only auto-generate if body is empty
        if (!body) {
          const generatedContent = await generateContent.mutateAsync(subjectText);
          setBody(generatedContent);
          toast({
            title: "Content generated",
            description: "Email draft created based on subject"
          });
        }
      } catch (error) {
        // Silently fail for auto-generation
        console.error('Auto-generation failed:', error);
      }
    }, 1000),
    [body, autoGenerate, generateContent]
  );
  
  // Call the debounced function when subject changes
  useEffect(() => {
    if (autoGenerate && subject.length >= 3) {
      debouncedGenerateContent(subject);
    }
  }, [subject, autoGenerate, debouncedGenerateContent]);
  
  // Handler for feedback prompt close
  const handleFeedbackClose = () => {
    setShowFeedbackPrompt(false);
    
    // After collecting feedback, navigate away
    setTimeout(() => {
      resetForm();
      if (onCancel) {
        onCancel();
      } else {
        navigate('/dashboard');
      }
    }, 500);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Compose Email</span>
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <X size={20} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AIFeatureGuide 
          title="Enhance Your Email with AI" 
          description="Configure AI to access smart composition features" 
        />
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center">
              <label htmlFor="to" className="block text-sm font-medium">To:</label>
              <div className="space-x-2">
                {!showCc && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs" 
                    onClick={() => setShowCc(true)}
                  >
                    <PlusCircle size={14} className="mr-1" />
                    Cc
                  </Button>
                )}
                {!showBcc && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs" 
                    onClick={() => setShowBcc(true)}
                  >
                    <PlusCircle size={14} className="mr-1" />
                    Bcc
                  </Button>
                )}
              </div>
            </div>
            <Input 
              id="to" 
              value={to} 
              onChange={(e) => setTo(e.target.value)} 
              placeholder="Recipient email address"
            />
          </div>
          
          {showCc && (
            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="cc" className="block text-sm font-medium">Cc:</label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs" 
                  onClick={() => setShowCc(false)}
                >
                  <MinusCircle size={14} className="mr-1" />
                  Remove
                </Button>
              </div>
              <Input 
                id="cc" 
                value={cc} 
                onChange={(e) => setCc(e.target.value)} 
                placeholder="Carbon copy recipients"
              />
            </div>
          )}
          
          {showBcc && (
            <div>
              <div className="flex justify-between items-center">
                <label htmlFor="bcc" className="block text-sm font-medium">Bcc:</label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs" 
                  onClick={() => setShowBcc(false)}
                >
                  <MinusCircle size={14} className="mr-1" />
                  Remove
                </Button>
              </div>
              <Input 
                id="bcc" 
                value={bcc} 
                onChange={(e) => setBcc(e.target.value)} 
                placeholder="Blind carbon copy recipients"
              />
            </div>
          )}
          
          <div className="flex space-x-2">
            <div className="flex-1">
              <label htmlFor="subject" className="block text-sm font-medium">Subject:</label>
              <Input 
                id="subject" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                placeholder="Email subject"
              />
              {autoGenerate && (
                <p className="text-xs text-gray-500 mt-1">
                  Auto-generate is on. Type subject to create content.
                </p>
              )}
            </div>
            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={handleGenerateSubject}
                disabled={generateSubject.isPending || !body}
                title="Generate subject from content"
              >
                {generateSubject.isPending ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Sparkles size={18} />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={handleGenerateContent}
                disabled={generateContent.isPending || !subject}
                title="Generate content from subject"
              >
                {generateContent.isPending ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <MessageSquare size={18} />
                )}
              </Button>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="body" className="block text-sm font-medium">Message:</label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleImproveText}
                  disabled={improveText.isPending || !body}
                  className="text-xs"
                >
                  {improveText.isPending ? (
                    <RefreshCw size={14} className="mr-1 animate-spin" />
                  ) : (
                    <Wand2 size={14} className="mr-1" />
                  )}
                  Improve Text
                </Button>
                
                <TemplateInserter onInsert={(content) => {
                  // If there's already content, add a newline
                  const newContent = body ? `${body}\n\n${content}` : content;
                  setBody(newContent);
                }} />
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      disabled={!body}
                    >
                      <Sparkles size={14} className="mr-1" />
                      Adjust Tone
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2">
                    <div className="flex flex-col space-y-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleAdjustTone('formal')}
                        disabled={adjustTone.isPending}
                        className="justify-start"
                      >
                        Formal
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleAdjustTone('friendly')}
                        disabled={adjustTone.isPending}
                        className="justify-start"
                      >
                        Friendly
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleAdjustTone('assertive')}
                        disabled={adjustTone.isPending}
                        className="justify-start"
                      >
                        Assertive
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleAdjustTone('concise')}
                        disabled={adjustTone.isPending}
                        className="justify-start"
                      >
                        Concise
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleAdjustTone('persuasive')}
                        disabled={adjustTone.isPending}
                        className="justify-start"
                      >
                        Persuasive
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <Editor 
              initialValue={body}
              onChange={setBody}
              placeholder="Compose your email..."
              minHeight="300px"
            />
            
            {generateContent.isPending && (
              <div className="mt-2 flex items-center justify-center space-x-2 text-sm text-gray-500">
                <RefreshCw size={14} className="animate-spin" />
                <span>Generating email content...</span>
              </div>
            )}
            
            {adjustTone.isPending && (
              <div className="mt-2 flex items-center justify-center space-x-2 text-sm text-gray-500">
                <RefreshCw size={14} className="animate-spin" />
                <span>Adjusting tone...</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <div className="flex gap-2">
          <Button
            type="button" 
            variant="outline" 
            onClick={handleCancel}
          >
            Discard
          </Button>
          <Link to="/templates">
            <Button
              type="button" 
              variant="outline"
            >
              <FileText size={18} className="mr-2" />
              Templates
            </Button>
          </Link>
          <FollowUpCreator
            subject={subject}
            recipient={to}
            onFollowUpCreated={handleCreateFollowUp}
          />
        </div>
        <div className="flex space-x-2">
          <EmailScheduler 
            onSchedule={handleScheduleEmail}
            disabled={!to || (!subject && !body)}
          />
          <EmailTrackingToggle 
            onChange={setTrackingOptions}
            defaultValue={trackingOptions}
          />
          <Button
            type="button" 
            variant="outline" 
            onClick={handleSaveDraft}
            disabled={saveDraft.isPending}
          >
            <Save size={18} className="mr-2" />
            Save Draft
          </Button>
          <Button
            type="button" 
            onClick={handleSend}
            disabled={sendEmail.isPending}
          >
            <Send size={18} className="mr-2" />
            Send
          </Button>
        </div>
      </CardFooter>
      
      {/* Feedback prompt for AI-generated content */}
      {replyId && (
        <FeedbackPrompt 
          replyId={replyId}
          show={showFeedbackPrompt}
          onClose={handleFeedbackClose}
        />
      )}
    </Card>
  );
};

export default ComposeEmail;
