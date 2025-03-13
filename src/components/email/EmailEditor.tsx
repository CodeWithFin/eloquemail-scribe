
import React, { useState } from 'react';
import AIToolbar from './AIToolbar';
import Glass from '../ui-custom/Glass';
import Button from '../ui-custom/Button';
import { Send, Save, Clock, ArrowRight, Users } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const EmailEditor = () => {
  const { toast } = useToast();
  const [emailData, setEmailData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: ''
  });
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEmailData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setIsSaving(true);
    
    // Simulate saving
    setTimeout(() => {
      toast({
        title: "Draft saved",
        description: "Your email has been saved as a draft."
      });
      setIsSaving(false);
    }, 800);
  };

  const handleSend = () => {
    if (!emailData.to || !emailData.subject || !emailData.body) {
      toast({
        title: "Cannot send email",
        description: "Please fill in the recipient, subject, and message fields.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSending(true);
    
    // Simulate sending
    setTimeout(() => {
      toast({
        title: "Email sent successfully",
        description: "Your email has been sent to " + emailData.to
      });
      setIsSending(false);
      
      // Reset form
      setEmailData({
        to: '',
        cc: '',
        bcc: '',
        subject: '',
        body: ''
      });
    }, 1500);
  };

  const handleAIUpdate = (newBody: string) => {
    setEmailData(prev => ({ ...prev, body: newBody }));
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-up">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Compose Email</h2>
        <p className="text-gray-600 mt-2">Create a new message with AI assistance</p>
      </div>
      
      <Glass className="overflow-hidden" blur="lg">
        <div className="border-b border-gray-200">
          <div className="flex items-center px-6 py-4">
            <div className="flex-shrink-0 mr-4">
              <div className="w-10 h-10 rounded-full bg-eloquent-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-eloquent-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">New Message</h3>
              <p className="text-sm text-gray-500">From: you@example.com</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0">
              <label htmlFor="to" className="w-20 text-sm font-medium text-gray-700">
                To:
              </label>
              <input
                id="to"
                name="to"
                type="text"
                value={emailData.to}
                onChange={handleChange}
                className="flex-grow bg-transparent border-b border-gray-300 focus:border-eloquent-400 px-2 py-1 outline-none"
                placeholder="recipient@example.com"
              />
            </div>
            
            {isExpanded && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0">
                  <label htmlFor="cc" className="w-20 text-sm font-medium text-gray-700">
                    Cc:
                  </label>
                  <input
                    id="cc"
                    name="cc"
                    type="text"
                    value={emailData.cc}
                    onChange={handleChange}
                    className="flex-grow bg-transparent border-b border-gray-300 focus:border-eloquent-400 px-2 py-1 outline-none"
                    placeholder="cc@example.com"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0">
                  <label htmlFor="bcc" className="w-20 text-sm font-medium text-gray-700">
                    Bcc:
                  </label>
                  <input
                    id="bcc"
                    name="bcc"
                    type="text"
                    value={emailData.bcc}
                    onChange={handleChange}
                    className="flex-grow bg-transparent border-b border-gray-300 focus:border-eloquent-400 px-2 py-1 outline-none"
                    placeholder="bcc@example.com"
                  />
                </div>
              </>
            )}
            
            <div className="flex">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-gray-500 p-0 hover:bg-transparent hover:text-eloquent-500"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Hide Cc/Bcc' : 'Show Cc/Bcc'}
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0">
              <label htmlFor="subject" className="w-20 text-sm font-medium text-gray-700">
                Subject:
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                value={emailData.subject}
                onChange={handleChange}
                className="flex-grow bg-transparent border-b border-gray-300 focus:border-eloquent-400 px-2 py-1 outline-none"
                placeholder="Enter subject"
              />
            </div>
          </div>
          
          <div className="pt-4">
            <textarea
              name="body"
              id="body"
              rows={12}
              value={emailData.body}
              onChange={handleChange}
              className="w-full bg-transparent border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-eloquent-400 focus:border-transparent resize-none"
              placeholder="Type your email message here..."
            ></textarea>
          </div>
          
          <AIToolbar emailContent={emailData.body} onUpdate={handleAIUpdate} />
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 justify-between pt-4">
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                iconLeft={<Save size={18} />}
                onClick={handleSave}
                loading={isSaving}
              >
                Save Draft
              </Button>
              <Button
                variant="ghost"
                iconLeft={<Clock size={18} />}
                onClick={() => {
                  toast({
                    title: "Schedule",
                    description: "Scheduling functionality is not implemented in this demo."
                  });
                }}
              >
                Schedule
              </Button>
            </div>
            
            <Button
              iconRight={<ArrowRight size={18} />}
              onClick={handleSend}
              loading={isSending}
            >
              Send Email
            </Button>
          </div>
        </div>
      </Glass>
    </div>
  );
};

export default EmailEditor;
