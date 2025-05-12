import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleGmailAuthCallback } from '@/services/gmail';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const processCallback = () => {
      // Try to extract token from URL
      const token = handleGmailAuthCallback();

      if (token) {
        toast({
          title: "Authentication successful",
          description: "Your Gmail account was successfully connected.",
        });
        
        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        toast({
          title: "Authentication failed",
          description: "Could not connect your Gmail account. Please try again.",
          variant: "destructive",
        });
        
        // Redirect to dashboard with error
        navigate('/dashboard?auth=failed');
      }
    };

    // Process the callback after a short delay to ensure rendering
    const timer = setTimeout(processCallback, 500);
    return () => clearTimeout(timer);
  }, [navigate, toast]);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-b from-eloquent-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <div className="text-center">
        <Loader2 size={48} className="text-eloquent-500 animate-spin mx-auto" />
        <h2 className="mt-6 text-2xl font-semibold text-gray-900">
          Completing authentication...
        </h2>
        <p className="mt-2 text-gray-600">
          Please wait while we connect your Gmail account.
        </p>
      </div>
    </div>
  );
};

export default GoogleAuthCallback;
