
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Glass from '../ui-custom/Glass';
import Button from '../ui-custom/Button';
import { 
  PlusCircle, 
  Search, 
  Mail, 
  Clock, 
  Archive, 
  Trash2, 
  Star, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Email {
  id: string;
  subject: string;
  sender: string;
  preview: string;
  date: string;
  read: boolean;
  starred: boolean;
  category?: 'primary' | 'social' | 'promotions';
}

const Dashboard = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('inbox');
  const [emails, setEmails] = useState<Email[]>([
    {
      id: '1',
      subject: 'Project Proposal Update',
      sender: 'Sarah Johnson',
      preview: 'I\'ve updated the project timeline based on our discussion yesterday...',
      date: '10:25 AM',
      read: false,
      starred: true,
      category: 'primary'
    },
    {
      id: '2',
      subject: 'Meeting Reminder: Strategy Session',
      sender: 'Marketing Team',
      preview: 'This is a reminder about our quarterly strategy session scheduled for tomorrow at 2 PM...',
      date: 'Yesterday',
      read: true,
      starred: false,
      category: 'primary'
    },
    {
      id: '3',
      subject: 'Your Invoice #2023-056',
      sender: 'Accounting Department',
      preview: 'Please find attached your invoice for services rendered during the month of June...',
      date: 'Jul 10',
      read: true,
      starred: true,
      category: 'primary'
    },
    {
      id: '4',
      subject: 'New comment on your post',
      sender: 'LinkedIn',
      preview: 'John Doe commented on your recent post: "Great insights on the industry trends..."',
      date: 'Jul 8',
      read: true,
      starred: false,
      category: 'social'
    },
    {
      id: '5',
      subject: 'Your subscription is about to expire',
      sender: 'Premium Services',
      preview: 'Your premium subscription is set to expire in 3 days. Renew now to avoid service interruption...',
      date: 'Jul 5',
      read: true,
      starred: false,
      category: 'promotions'
    }
  ]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }
    
    toast({
      title: "Search performed",
      description: `Searching for "${searchQuery}" (demo only)`,
    });
  };

  const toggleStarred = (id: string) => {
    setEmails(emails.map(email => 
      email.id === id ? { ...email, starred: !email.starred } : email
    ));
  };

  const markAsRead = (id: string) => {
    setEmails(emails.map(email => 
      email.id === id ? { ...email, read: true } : email
    ));
  };

  const filteredEmails = emails.filter(email => {
    if (activeTab === 'starred') return email.starred;
    if (activeTab === 'sent') return false; // No sent emails in demo
    if (activeTab === 'drafts') return false; // No drafts in demo
    if (activeTab === 'archived') return false; // No archived emails in demo
    if (activeTab === 'trash') return false; // No trash emails in demo
    
    // Default inbox
    return true;
  });

  const getFilteredCount = (type: string) => {
    if (type === 'starred') return emails.filter(e => e.starred).length;
    if (type === 'inbox') return emails.length;
    return 0; // Demo purposes
  };

  const statsData = [
    { label: 'Emails Sent', value: 142, color: 'bg-eloquent-500' },
    { label: 'Open Rate', value: '64%', color: 'bg-green-500' },
    { label: 'Response Rate', value: '48%', color: 'bg-amber-500' },
    { label: 'AI Improvements', value: 89, color: 'bg-purple-500' }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto animate-fade-up space-y-8">
      <div className="flex flex-col lg:flex-row justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage and track your emails</p>
        </div>
        
        <div className="flex items-center gap-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search emails..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64 focus:ring-2 focus:ring-eloquent-400 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </form>
          
          <Link to="/compose">
            <Button
              iconLeft={<PlusCircle size={18} />}
            >
              Compose
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, index) => (
          <Glass 
            key={index} 
            className="p-4 relative overflow-hidden"
            opacity="light"
          >
            <div className={`absolute top-0 left-0 w-1 h-full ${stat.color}`}></div>
            <div className="pl-3">
              <p className="text-gray-600 text-sm">{stat.label}</p>
              <p className="text-3xl font-semibold mt-1 text-gray-900">{stat.value}</p>
            </div>
          </Glass>
        ))}
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <Glass className="overflow-hidden" opacity="light">
            <nav className="p-3">
              <ul className="space-y-1">
                {[
                  { id: 'inbox', icon: <Mail size={20} />, label: 'Inbox' },
                  { id: 'starred', icon: <Star size={20} />, label: 'Starred' },
                  { id: 'sent', icon: <CheckCircle2 size={20} />, label: 'Sent' },
                  { id: 'drafts', icon: <Clock size={20} />, label: 'Drafts' },
                  { id: 'archived', icon: <Archive size={20} />, label: 'Archived' },
                  { id: 'trash', icon: <Trash2 size={20} />, label: 'Trash' },
                ].map((item) => (
                  <li key={item.id}>
                    <button
                      className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors duration-150 ${
                        activeTab === item.id
                          ? 'bg-eloquent-50 text-eloquent-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setActiveTab(item.id)}
                    >
                      <span className="mr-3 text-gray-500">{item.icon}</span>
                      <span>{item.label}</span>
                      <span className="ml-auto bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 text-xs">
                        {getFilteredCount(item.id)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </Glass>
        </div>
        
        {/* Email list */}
        <div className="flex-1">
          <Glass className="overflow-hidden" opacity="light">
            <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h3 className="font-medium text-gray-900 flex items-center">
                {activeTab === 'inbox' && <Mail size={18} className="mr-2 text-eloquent-500" />}
                {activeTab === 'starred' && <Star size={18} className="mr-2 text-eloquent-500" />}
                {activeTab === 'sent' && <CheckCircle2 size={18} className="mr-2 text-eloquent-500" />}
                {activeTab === 'drafts' && <Clock size={18} className="mr-2 text-eloquent-500" />}
                {activeTab === 'archived' && <Archive size={18} className="mr-2 text-eloquent-500" />}
                {activeTab === 'trash' && <Trash2 size={18} className="mr-2 text-eloquent-500" />}
                <span className="capitalize">{activeTab}</span>
              </h3>
              <span className="text-sm text-gray-500">
                {filteredEmails.length} {filteredEmails.length === 1 ? 'email' : 'emails'}
              </span>
            </div>
            
            {filteredEmails.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {filteredEmails.map((email) => (
                  <li 
                    key={email.id}
                    className={`group hover:bg-gray-50 transition-colors duration-150 ${
                      !email.read ? 'bg-eloquent-50' : ''
                    }`}
                    onClick={() => markAsRead(email.id)}
                  >
                    <div className="flex px-4 py-4 items-start cursor-pointer">
                      <div className="flex-shrink-0 pt-1">
                        <button
                          className="text-gray-400 hover:text-eloquent-500 focus:outline-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStarred(email.id);
                          }}
                        >
                          <Star 
                            size={20} 
                            className={email.starred ? 'fill-eloquent-500 text-eloquent-500' : ''} 
                          />
                        </button>
                      </div>
                      
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center mb-1">
                          <p className={`text-sm font-medium ${!email.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {email.sender}
                          </p>
                          <span className="ml-auto text-xs text-gray-500">{email.date}</span>
                        </div>
                        
                        <p className={`text-sm ${!email.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                          {email.subject}
                        </p>
                        
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {email.preview}
                        </p>
                      </div>
                      
                      <div className="ml-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-gray-400 hover:text-gray-500 focus:outline-none">
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <AlertCircle size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No emails found</h3>
                <p className="text-gray-500">
                  {activeTab === 'inbox' ? 'Your inbox is empty' : `No ${activeTab} emails`}
                </p>
              </div>
            )}
          </Glass>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
