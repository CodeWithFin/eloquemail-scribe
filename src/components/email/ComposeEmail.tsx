// This file is deprecated. Please use ComposeEmail.new.tsx instead.
// The functionality has been moved to ComposeEmail.new.tsx to improve visual appeal and functionality.
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Define the props interface for documentation purposes
export interface ComposeEmailProps {
  onCancel?: () => void;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
  initialAttachments?: File[];
}

// For backwards compatibility only - redirects to compose page
const ComposeEmail = () => {
  const navigate = useNavigate();
  
  // Redirect to compose page using the new component
  React.useEffect(() => {
    navigate('/compose');
  }, [navigate]);
  
  return <div>Redirecting to compose email...</div>;
}

export default ComposeEmail;

export default ComposeEmail;