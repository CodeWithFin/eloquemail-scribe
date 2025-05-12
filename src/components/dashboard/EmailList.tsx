import React from 'react';
import { Star, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import Button from '../ui-custom/Button';
import { Email } from '@/services/emailService';
import { useToast } from "@/hooks/use-toast";

interface EmailListProps {
  emails: Email[];
  isLoading: boolean;
  error: Error | null;
  activeTab: string;
  handleToggleStarred: (id: string, currentStarred: boolean) => Promise<void>;
  handleMarkAsRead: (id: string) => Promise<void>;
}

const EmailList = ({ 
  emails, 
  isLoading, 
  error, 
  activeTab,
  handleToggleStarred,
  handleMarkAsRead
}: EmailListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const filteredEmails = emails.filter(email => {
    if (activeTab === 'starred') return email.starred;
    if (activeTab === 'sent') return email.category === 'sent';
    if (activeTab === 'drafts') return email.category === 'drafts';
    if (activeTab === 'archived') return email.category === 'archived';
    if (activeTab === 'trash') return email.category === 'trash';
    
    // Default inbox
    return email.category === 'primary' || email.category === 'social' || email.category === 'promotions';
  });

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="inline-flex items-center justify-center">
          <Loader2 size={36} className="text-eloquent-500 animate-spin" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4">Loading emails...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
          <AlertCircle size={24} className="text-red-500 dark:text-red-300" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">Failed to load emails</h3>
        <p className="text-gray-500 dark:text-gray-400">
          Please check your connection and try again
        </p>
        <Button 
          variant="secondary" 
          className="mt-4"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['emails'] })}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (filteredEmails.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <AlertCircle size={24} className="text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No emails found</h3>
        <p className="text-gray-500 dark:text-gray-400">
          {activeTab === 'inbox' ? 'Your inbox is empty' : `No ${activeTab} emails`}
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
      {filteredEmails.map((email) => (
        <li 
          key={email.id}
          className={`group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 ${
            !email.read ? 'bg-eloquent-50 dark:bg-eloquent-900/20' : ''
          }`}
          onClick={() => handleMarkAsRead(email.id)}
        >
          <div className="flex px-4 py-4 items-start cursor-pointer">
            <div className="flex-shrink-0 pt-1">
              <button
                className="text-gray-400 dark:text-gray-500 hover:text-eloquent-500 dark:hover:text-eloquent-400 focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleStarred(email.id, email.starred);
                }}
              >
                <Star 
                  size={20} 
                  className={email.starred ? 'fill-eloquent-500 text-eloquent-500 dark:fill-eloquent-400 dark:text-eloquent-400' : ''} 
                />
              </button>
            </div>
            
            <div className="ml-3 flex-1 min-w-0">
              <div className="flex items-center mb-1">
                <p className={`text-sm font-medium ${!email.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  {email.sender}
                </p>
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{email.date}</span>
              </div>
              
              <p className={`text-sm ${!email.read ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                {email.subject}
              </p>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                {email.preview}
              </p>
            </div>
            
            <div className="ml-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default EmailList;
