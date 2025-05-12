
import React, { useState } from 'react';
import Glass from '../ui-custom/Glass';
import { useEmails, useStarEmail, useMarkAsRead, Email } from '@/services/emailService';
import { useToast } from "@/hooks/use-toast";

// Import components
import StatCards from './StatCards';
import SearchBar from './SearchBar';
import Sidebar from './Sidebar';
import EmailHeader from './EmailHeader';
import EmailList from './EmailList';
import GmailConnect from './GmailConnect';

const Dashboard = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('inbox');
  
  // Fetch emails using react-query
  const { data: emails = [], isLoading, error } = useEmails();
  const starEmailMutation = useStarEmail();
  const markAsReadMutation = useMarkAsRead();

  const handleToggleStarred = async (id: string, currentStarred: boolean) => {
    try {
      await starEmailMutation.mutateAsync({ id, starred: !currentStarred });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update starred status",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsReadMutation.mutateAsync(id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark email as read",
        variant: "destructive",
      });
    }
  };

  const getFilteredCount = (type: string) => {
    if (type === 'starred') return (emails as Email[]).filter(e => e.starred).length;
    if (type === 'inbox') return emails.length;
    return 0; // Demo purposes
  };

  const statsData = [
    { label: 'Emails Sent', value: 142, color: 'bg-eloquent-500' },
    { label: 'Open Rate', value: '64%', color: 'bg-green-500' },
    { label: 'Response Rate', value: '48%', color: 'bg-amber-500' },
    { label: 'AI Improvements', value: 89, color: 'bg-purple-500' }
  ];

  // Filter emails based on active tab
  const filteredEmails = (emails as Email[]).filter(email => {
    if (activeTab === 'starred') return email.starred;
    if (activeTab === 'sent') return false; // No sent emails in demo
    if (activeTab === 'drafts') return false; // No drafts in demo
    if (activeTab === 'archived') return false; // No archived emails in demo
    if (activeTab === 'trash') return false; // No trash emails in demo
    
    // Default inbox
    return true;
  });

  return (
    <div className="w-full max-w-7xl mx-auto animate-fade-up space-y-8">
      <div className="flex flex-col lg:flex-row justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage and track your emails</p>
        </div>
        
        <SearchBar />
      </div>
      
      {/* Gmail Connect Component */}
      <GmailConnect />
      
      {/* Stats cards */}
      <StatCards stats={statsData} />
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <Glass className="overflow-hidden" opacity="light">
            <Sidebar 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              getFilteredCount={getFilteredCount}
            />
          </Glass>
        </div>
        
        {/* Email list */}
        <div className="flex-1">
          <Glass className="overflow-hidden" opacity="light">
            <EmailHeader 
              activeTab={activeTab} 
              emailCount={filteredEmails.length} 
            />
            
            <EmailList 
              emails={filteredEmails}
              isLoading={isLoading}
              error={error as Error | null}
              activeTab={activeTab}
              handleToggleStarred={handleToggleStarred}
              handleMarkAsRead={handleMarkAsRead}
            />
          </Glass>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
