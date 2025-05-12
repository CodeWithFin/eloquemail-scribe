import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSendGmailMessage, useCreateGmailDraft } from '@/services/gmail';
import { 
  useImproveEmailText, 
  useGenerateSubjectLine, 
  useAdjustEmailTone 
} from '@/services/ai/hooks';
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
  Wand2
} from 'lucide-react';
import Editor from '../ui-custom/Editor';
import { toast } from '@/hooks/use-toast';

interface ComposeEmailProps {
  onCancel?: () => void;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
}

const ComposeEmail: React.FC<ComposeEmailProps> = ({ 
  onCancel, 
  initialTo = '', 
  initialSubject = '', 
  initialBody = '' 
}) => {
  const navigate = useNavigate();
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  
  // Gmail hooks
  const sendEmail = useSendGmailMessage();
  const saveDraft = useCreateGmailDraft();
  
  // AI hooks
  const improveText = useImproveEmailText();
  const generateSubject = useGenerateSubjectLine();
  const adjustTone = useAdjustEmailTone();
  
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
      await sendEmail.mutateAsync({
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
            </div>
            <div className="flex items-end">
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
        <div>
          <Button
            type="button" 
            variant="outline" 
            onClick={handleCancel}
          >
            Discard
          </Button>
        </div>
        <div className="space-x-2">
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
    </Card>
  );
};

export default ComposeEmail; 