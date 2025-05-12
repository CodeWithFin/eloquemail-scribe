import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSendGmailMessage, useCreateGmailDraft } from '@/services/gmail';
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
import { Send, Save, X, MinusCircle, PlusCircle } from 'lucide-react';
import Editor from '../ui-custom/Editor';

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
  
  const sendEmail = useSendGmailMessage();
  const saveDraft = useCreateGmailDraft();
  
  const handleSend = async () => {
    if (!to) {
      alert('Please enter a recipient email address');
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
          
          <div>
            <label htmlFor="subject" className="block text-sm font-medium">Subject:</label>
            <Input 
              id="subject" 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
              placeholder="Email subject"
            />
          </div>
          
          <div>
            <label htmlFor="body" className="block text-sm font-medium mb-2">Message:</label>
            <Editor 
              initialValue={body}
              onChange={setBody}
              placeholder="Compose your email..."
              minHeight="300px"
            />
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