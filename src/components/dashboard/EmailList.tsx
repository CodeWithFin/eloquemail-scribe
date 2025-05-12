import React, { useState, useEffect } from 'react';
import { Star, ChevronRight, AlertCircle, Loader2, ChevronLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import Button from '../ui-custom/Button';
import { Email } from '@/services/emailService';
import { useToast } from "@/hooks/use-toast";

interface EmailListProps {
  emails: Email[];
  emailsByDate?: { [key: string]: Email[] };
  isLoading: boolean;
  error: Error | null;
  activeTab: string;
  handleToggleStarred: (id: string, currentStarred: boolean) => Promise<void>;
  handleMarkAsRead: (id: string) => Promise<void>;
}

const EmailList = ({ 
  emails, 
  emailsByDate = {}, 
  isLoading, 
  error, 
  activeTab,
  handleToggleStarred,
  handleMarkAsRead
}: EmailListProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const emailsPerPage = 10;
  
  // Reset to first page when active tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);
  
  // Get date keys and sort them in reverse chronological order
  const dateKeys = Object.keys(emailsByDate).sort((a, b) => {
    // Simple date comparison to put newest dates first
    return new Date(b).getTime() - new Date(a).getTime();
  });
  
  // Prepare data for pagination
  let paginatedEmailGroups: { date: string; emails: Email[] }[] = [];
  
  if (dateKeys.length > 0) {
    // Create paginated email groups for date-based display
    let allEmailIndex = 0;
    
    for (const date of dateKeys) {
      const emailsForDate = emailsByDate[date];
      
      if (emailsForDate.length > 0) {
        paginatedEmailGroups.push({
          date,
          emails: emailsForDate
        });
      }
    }
  }
  
  // If no date grouping is used, create a single group
  if (paginatedEmailGroups.length === 0 && emails.length > 0) {
    paginatedEmailGroups = [{
      date: '',
      emails
    }];
  }
  
  // Flatten all emails for pagination counting
  const allEmails = emails;
  
  // Calculate pagination
  const totalPages = Math.ceil(allEmails.length / emailsPerPage);
  const startIdx = (currentPage - 1) * emailsPerPage;
  const endIdx = startIdx + emailsPerPage;
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const renderEmailItem = (email: Email) => (
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
  );

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

  if (allEmails.length === 0) {
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

  // Prepare the emails to display for the current page
  let emailsToDisplay: Email[] = [];
  let currentDateGroups: { date: string; emails: Email[] }[] = [];
  
  if (dateKeys.length > 0) {
    // Date-based grouping
    let count = 0;
    let i = 0;
    
    while (count < startIdx && i < paginatedEmailGroups.length) {
      count += paginatedEmailGroups[i].emails.length;
      i++;
    }
    
    // Found the starting group
    if (i < paginatedEmailGroups.length) {
      const adjustedStartIdx = count - paginatedEmailGroups[i-1]?.emails.length || 0;
      let remainingToShow = emailsPerPage;
      
      while (remainingToShow > 0 && i < paginatedEmailGroups.length) {
        const group = paginatedEmailGroups[i];
        const groupEmails = group.emails;
        const startOffset = i === 0 ? startIdx - adjustedStartIdx : 0;
        const toTake = Math.min(groupEmails.length - startOffset, remainingToShow);
        
        if (toTake > 0) {
          currentDateGroups.push({
            date: group.date,
            emails: groupEmails.slice(startOffset, startOffset + toTake)
          });
          remainingToShow -= toTake;
        }
        
        i++;
      }
    }
  } else {
    // Simple flat list
    emailsToDisplay = allEmails.slice(startIdx, endIdx);
  }

  return (
    <>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {dateKeys.length > 0 && currentDateGroups.length > 0 ? (
          // Render emails grouped by date
          currentDateGroups.map((group) => (
            <React.Fragment key={group.date}>
              {/* Date header */}
              <li className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{group.date}</p>
              </li>
              
              {/* Emails for this date */}
              {group.emails.map(renderEmailItem)}
            </React.Fragment>
          ))
        ) : (
          // Fallback to original rendering if no date grouping
          emailsToDisplay.map(renderEmailItem)
        )}
      </ul>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing <span className="font-medium">{startIdx + 1}</span>
              {' '}-{' '}
              <span className="font-medium">
                {Math.min(endIdx, allEmails.length)}
              </span>
              {' '}of{' '}
              <span className="font-medium">{allEmails.length}</span> emails
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="px-3"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={18} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-3"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default EmailList;
