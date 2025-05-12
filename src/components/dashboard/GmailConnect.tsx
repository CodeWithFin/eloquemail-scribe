
import React, { useState, useEffect } from 'react';
import { 
  isGmailAuthenticated,
  initiateGmailAuth,
  useGmailProfile,
  handleGmailAuthCallback 
} from '@/services/gmail';
import { AlertCircle, Mail, Check } from 'lucide-react';
import Button from '../ui-custom/Button';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const GmailConnect = () => {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(localStorage.getItem('gmail_token'));
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { data: profile, isLoading: isLoadingProfile, error: profileError } = useGmailProfile(token);

  useEffect(() => {
    // Log current URL to help diagnose redirect issues
    console.log('Current location:', window.location.href);
    console.log('Origin:', window.location.origin);
    
    // Check for OAuth callback in the URL hash and handle token
    const handleOAuthCallback = () => {
      const callbackToken = handleGmailAuthCallback();
      
      if (callbackToken) {
        setToken(callbackToken);
        toast({
          title: "Email connected",
          description: "Your Gmail account has been successfully connected.",
        });
        
        // Clear any previous errors
        setConnectionError(null);
        
        // Refresh the page to clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    
    // Run the callback handler on component mount
    handleOAuthCallback();
    
    // Also check localStorage as a fallback
    const storedToken = localStorage.getItem('gmail_token');
    if (!token && storedToken) {
      setToken(storedToken);
    }
  }, [toast, token]);

  const handleConnect = async () => {
    setConnectionError(null); // Clear any previous errors
    setIsAuthenticating(true);
    
    try {
      await initiateGmailAuth();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setConnectionError(errorMessage);
      toast({
        title: "Connection failed",
        description: `Failed to connect to Gmail: ${errorMessage}`,
        variant: "destructive",
      });
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('gmail_token');
    setToken(null);
    setConnectionError(null);
    toast({
      title: "Email disconnected",
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

  if (profileError || connectionError) {
    const errorMessage = connectionError || 
      (profileError instanceof Error ? profileError.message : 'Unable to authenticate');
    
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <AlertCircle size={20} className="text-red-500" />
          </div>
          <div className="ml-3 w-full">
            <h3 className="text-sm font-medium text-red-800">
              Failed to connect to Gmail
            </h3>
            <p className="text-sm text-red-700 mt-1">
              {errorMessage}
            </p>
            
            <Alert variant="destructive" className="mt-3 mb-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Google OAuth Setup</AlertTitle>
              <AlertDescription>
                <p className="mb-2">Make sure you've enabled the Gmail API in your Google Cloud project and set the correct redirect URI:</p>
                <code className="bg-red-100 p-1 rounded block overflow-x-auto text-xs">
                  {window.location.origin}/auth/callback/google
                </code>
              </AlertDescription>
            </Alert>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleConnect}
              className="mt-2"
              loading={isAuthenticating}
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
