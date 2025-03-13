
import React from 'react';
import EmailEditor from '../components/email/EmailEditor';
import Header from '../components/layout/Header';

const ComposePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <EmailEditor />
      </div>
    </div>
  );
};

export default ComposePage;
