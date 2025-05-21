// This file is deprecated. Please use ComposeEmail.fixed.tsx instead.
// The functionality has been moved to ComposeEmail.fixed.tsx to fix errors and improve code quality.
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Define the props interface for documentation purposes
export interface ComposeEmailProps {
  onCancel?: () => void;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
}

// For backwards compatibility only - redirects to compose page
const ComposeEmail = () => {
  const navigate = useNavigate();
  
  // Redirect to compose page using the fixed component
  React.useEffect(() => {
    navigate('/compose');
  }, [navigate]);
  
  return <div>Redirecting to compose email...</div>;
}

export default ComposeEmail;