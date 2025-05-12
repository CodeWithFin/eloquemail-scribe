import React from 'react';
import { Mail, Star, CheckCircle2, Clock, Archive, Trash2 } from 'lucide-react';

interface EmailHeaderProps {
  activeTab: string;
  emailCount: number;
}

const EmailHeader = ({ activeTab, emailCount }: EmailHeaderProps) => {
  const getIcon = () => {
    switch (activeTab) {
      case 'inbox': return <Mail size={18} className="mr-2 text-eloquent-500" />;
      case 'starred': return <Star size={18} className="mr-2 text-eloquent-500" />;
      case 'sent': return <CheckCircle2 size={18} className="mr-2 text-eloquent-500" />;
      case 'drafts': return <Clock size={18} className="mr-2 text-eloquent-500" />;
      case 'archived': return <Archive size={18} className="mr-2 text-eloquent-500" />;
      case 'trash': return <Trash2 size={18} className="mr-2 text-eloquent-500" />;
      default: return <Mail size={18} className="mr-2 text-eloquent-500" />;
    }
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
      <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
        {getIcon()}
        <span className="capitalize">{activeTab}</span>
      </h3>
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {emailCount} {emailCount === 1 ? 'email' : 'emails'}
      </span>
    </div>
  );
};

export default EmailHeader;
