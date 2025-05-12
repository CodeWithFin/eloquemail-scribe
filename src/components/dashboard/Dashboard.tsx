import React, { useState } from 'react';
import Glass from '../ui-custom/Glass';
import { useNavigate } from 'react-router-dom';
import { 
  useGmailMessages, 
  useStarGmailMessage, 
  useMarkGmailMessageAsRead 
} from '@/services/gmail';
import { useToast } from "@/hooks/use-toast";

// Import components
import StatCards from './StatCards';
import SearchBar from './SearchBar';
import Sidebar from './Sidebar';
import EmailHeader from './EmailHeader';
import EmailList from './EmailList';
import GmailConnect from './GmailConnect';
import { Email } from '@/services/emailService';

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inbox');
  
  // Fetch emails using react-query with Gmail API
  const { data: emails = [], isLoading, error } = useGmailMessages(localStorage.getItem('gmail_token'));
  const starEmailMutation = useStarGmailMessage();
  const markAsReadMutation = useMarkGmailMessageAsRead();

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
      // Navigate to email detail view
      navigate(`/email/${id}`);
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
    { label: 'Total Emails', value: emails.length || 0, color: 'bg-eloquent-500' },
    { label: 'Unread', value: emails.filter(e => !e.read).length || 0, color: 'bg-amber-500' },
    { label: 'Starred', value: emails.filter(e => e.starred).length || 0, color: 'bg-purple-500' },
    { label: 'Categories', value: '3', color: 'bg-green-500' }
  ];

  // Filter emails based on active tab
  const filteredEmails = (emails as Email[]).filter(email => {
    if (activeTab === 'starred') return email.starred;
    if (activeTab === 'sent') return email.category === 'sent';
    if (activeTab === 'drafts') return email.category === 'drafts';
    if (activeTab === 'archived') return email.category === 'archived';
    if (activeTab === 'trash') return email.category === 'trash';
    
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
