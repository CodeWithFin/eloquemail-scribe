import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import EmailView from '../components/email/EmailView';
import { isGmailAuthenticated } from '@/services/gmail';

const ViewEmailPage: React.FC = () => {
  const { messageId } = useParams<{ messageId: string }>();
  
  // Redirect to auth page if not authenticated with Gmail
  if (!isGmailAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }
  
  // Redirect to dashboard if no message ID provided
  if (!messageId) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <EmailView messageId={messageId} />
      </div>
    </div>
  );
};

export default ViewEmailPage; 