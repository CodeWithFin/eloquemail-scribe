import React from 'react';
import ComposeEmail from '../components/email/ComposeEmail';
import Header from '../components/layout/Header';
import { isGmailAuthenticated } from '@/services/gmail';
import { Navigate } from 'react-router-dom';

const ComposePage = () => {
  // Redirect to auth page if not authenticated with Gmail
  if (!isGmailAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <ComposeEmail />
      </div>
    </div>
  );
};

export default ComposePage;
