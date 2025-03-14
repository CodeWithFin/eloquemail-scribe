
import React, { useState, useEffect } from 'react';
import { useGmailAuth, useGmailProfile } from '@/services/gmailService';
import { AlertCircle, Mail, Check } from 'lucide-react';
import Button from '../ui-custom/Button';
import { useToast } from "@/hooks/use-toast";

const GmailConnect = () => {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(localStorage.getItem('gmail_token'));
  const { mutate: authenticate, isPending: isAuthenticating } = useGmailAuth();
  const { data: profile, isLoading: isLoadingProfile, error: profileError } = useGmailProfile(token);

  useEffect(() => {
    // Check if we have a token in localStorage
    const storedToken = localStorage.getItem('gmail_token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const handleConnect = () => {
    authenticate(undefined, {
      onSuccess: (newToken) => {
        localStorage.setItem('gmail_token', newToken);
        setToken(newToken);
        toast({
          title: "Gmail connected",
          description: "Your Gmail account has been successfully connected.",
        });
      }
    });
  };

  const handleDisconnect = () => {
    localStorage.removeItem('gmail_token');
    setToken(null);
    toast({
      title: "Gmail disconnected",
      description: "Your Gmail account has been disconnected.",
    });
  };

  if (token && profile) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Check size={20} className="text-green-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Connected to Gmail
            </h3>
            <p className="text-sm text-green-700 mt-1">
              {profile.emailAddress} • {profile.messagesTotal} messages
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleDisconnect}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  if (isLoadingProfile) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Mail size={20} className="text-gray-500 animate-pulse" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800">
              Connecting to Gmail...
            </h3>
          </div>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <AlertCircle size={20} className="text-red-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Failed to connect to Gmail
            </h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleConnect}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-800">
            Connect to Gmail
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Connect your Gmail account to view and manage your emails directly from Email Buddy.
          </p>
        </div>
        <div className="mt-3 sm:mt-0 sm:ml-4">
          <Button
            onClick={handleConnect}
            loading={isAuthenticating}
            iconLeft={<Mail size={18} />}
          >
            Connect Gmail
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GmailConnect;
