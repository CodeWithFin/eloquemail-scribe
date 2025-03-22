
import React, { useState, useEffect } from 'react';
import { 
  useAurinkoAuth, 
  useAurinkoProfile, 
  handleAurinkoAuthCallback 
} from '@/services/aurinko';
import { AlertCircle, Mail, Check } from 'lucide-react';
import Button from '../ui-custom/Button';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const GmailConnect = () => {
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(localStorage.getItem('aurinko_token'));
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { mutate: authenticate, isPending: isAuthenticating } = useAurinkoAuth();
  const { data: profile, isLoading: isLoadingProfile, error: profileError } = useAurinkoProfile(token);

  useEffect(() => {
    // Log current URL to help diagnose redirect issues
    console.log('Current location:', window.location.href);
    console.log('Origin:', window.location.origin);
    
    // Check for OAuth callback in the URL hash and handle token
    const handleOAuthCallback = () => {
      const callbackToken = handleAurinkoAuthCallback();
      
      if (callbackToken) {
        setToken(callbackToken);
        toast({
          title: "Email connected",
          description: "Your email account has been successfully connected.",
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
    const storedToken = localStorage.getItem('aurinko_token');
    if (!token && storedToken) {
      setToken(storedToken);
    }
  }, [toast, token]);

  const handleConnect = () => {
    setConnectionError(null); // Clear any previous errors
    authenticate(undefined, {
      onError: (error) => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setConnectionError(errorMessage);
        toast({
          title: "Connection failed",
          description: `Failed to connect to email: ${errorMessage}`,
          variant: "destructive",
        });
      }
    });
  };

  const handleDisconnect = () => {
    localStorage.removeItem('aurinko_token');
    setToken(null);
    setConnectionError(null);
    toast({
      title: "Email disconnected",
      description: "Your email account has been disconnected.",
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
              Connected to Email
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
              Connecting to Email...
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
              Failed to connect to Email
            </h3>
            <p className="text-sm text-red-700 mt-1">
              {errorMessage}
            </p>
            
            <Alert variant="destructive" className="mt-3 mb-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Aurinko Setup Details</AlertTitle>
              <AlertDescription>
                <p className="mb-2">Make sure the redirect URI in your Aurinko setup matches:</p>
                <code className="bg-red-100 p-1 rounded block overflow-x-auto text-xs">
                  {window.location.origin}/api/auth/callback/aurinko
                </code>
              </AlertDescription>
            </Alert>
            
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
            Connect to Email
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Connect your email account to view and manage your emails directly from Email Buddy.
          </p>
        </div>
        <div className="mt-3 sm:mt-0 sm:ml-4">
          <Button
            onClick={handleConnect}
            loading={isAuthenticating}
            iconLeft={<Mail size={18} />}
          >
            Connect Email
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GmailConnect;
