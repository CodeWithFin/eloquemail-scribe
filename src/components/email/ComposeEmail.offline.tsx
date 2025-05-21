// Offline version of ComposeEmail that works without an internet connection
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  FileText,
  Cloud,
  CloudOff,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import Editor from '../ui-custom/Editor';
import { toast } from '@/hooks/use-toast';
import TemplateInserter from './TemplateInserter';
import { 
  createOfflineEmail, 
  isOnline, 
  setupOfflineListeners 
} from '@/services/email/offlineService';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface ComposeEmailOfflineProps {
  onCancel?: () => void;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
}

const ComposeEmailOffline: React.FC<ComposeEmailOfflineProps> = ({ 
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
  const [networkStatus, setNetworkStatus] = useState(isOnline());
  
  // Monitor network status changes
  useEffect(() => {
    const cleanup = setupOfflineListeners(
      // onOffline
      () => {
        setNetworkStatus(false);
        toast({
          title: "You're offline",
          description: "Email will be saved and sent when you're back online",
          variant: "default"
        });
      },
      // onOnline
      () => {
        setNetworkStatus(true);
        toast({
          title: "You're back online",
          description: "Your emails can now be sent immediately",
          variant: "default"
        });
      }
    );
    
    return cleanup;
  }, []);
  
  const handleSendOffline = () => {
    if (!to) {
      toast({
        title: "Missing recipient",
        description: "Please enter a recipient email address",
        variant: "destructive"
      });
      return;
    }
    
    try {
      createOfflineEmail({
        to: to.split(',').map(email => email.trim()),
        subject,
        body,
        cc: showCc && cc ? cc.split(',').map(email => email.trim()) : undefined,
        bcc: showBcc && bcc ? bcc.split(',').map(email => email.trim()) : undefined,
        status: 'pending'
      });
      
      toast({
        title: networkStatus ? "Email queued" : "Email saved offline",
        description: networkStatus 
          ? "Your email will be sent when possible" 
          : "Your email will be sent when you're back online",
      });
      
      resetForm();
      navigate('/offline');
    } catch (error) {
      console.error('Error saving offline email:', error);
      toast({
        title: "Error",
        description: "There was a problem saving your email",
        variant: "destructive"
      });
    }
  };
  
  const handleSaveDraft = () => {
    if (!to && !subject && !body) {
      if (onCancel) {
        onCancel();
      }
      return;
    }
    
    try {
      createOfflineEmail({
        to: to ? to.split(',').map(email => email.trim()) : [''],
        subject,
        body,
        cc: showCc && cc ? cc.split(',').map(email => email.trim()) : undefined,
        bcc: showBcc && bcc ? bcc.split(',').map(email => email.trim()) : undefined,
        status: 'draft'
      });
      
      toast({
        title: "Draft saved",
        description: "Your email draft has been saved"
      });
      
      resetForm();
      navigate('/offline');
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: "There was a problem saving your draft",
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
          navigate('/offline');
        }
      }
    } else {
      if (onCancel) {
        onCancel();
      } else {
        navigate('/offline');
      }
    }
  };
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>Compose Email</span>
            <Badge status={networkStatus} />
          </div>
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <X size={20} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Offline Mode</AlertTitle>
          <AlertDescription>
            You're using Email Buddy in offline mode. Your emails will be saved locally and sent once you're online again.
          </AlertDescription>
        </Alert>
        
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
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="body" className="block text-sm font-medium">Message:</label>
              <TemplateInserter onInsert={(content) => {
                // If there's already content, add a newline
                const newContent = body ? `${body}\n\n${content}` : content;
                setBody(newContent);
              }} />
            </div>
            
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
        </div>
        <div className="flex space-x-2">
          <Button
            type="button" 
            variant="outline" 
            onClick={handleSaveDraft}
          >
            <Save size={18} className="mr-2" />
            Save Draft
          </Button>
          <Button
            type="button" 
            onClick={handleSendOffline}
          >
            {networkStatus ? (
              <Cloud size={18} className="mr-2" />
            ) : (
              <CloudOff size={18} className="mr-2" />
            )}
            {networkStatus ? "Queue" : "Save"} Email
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

// Network status badge component
const Badge: React.FC<{ status: boolean }> = ({ status }) => {
  return (
    <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
      status 
        ? "bg-green-100 text-green-800" 
        : "bg-amber-100 text-amber-800"
    }`}>
      {status ? (
        <>
          <Wifi className="h-3 w-3" />
          Online
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          Offline
        </>
      )}
    </span>
  );
};

export default ComposeEmailOffline;