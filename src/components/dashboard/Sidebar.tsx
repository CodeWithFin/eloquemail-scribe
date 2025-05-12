import React from 'react';
import { Mail, Star, CheckCircle2, Clock, Archive, Trash2 } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  getFilteredCount: (type: string) => number;
}

const Sidebar = ({ activeTab, setActiveTab, getFilteredCount }: SidebarProps) => {
  const navItems = [
    { id: 'inbox', icon: <Mail size={20} />, label: 'Inbox' },
    { id: 'starred', icon: <Star size={20} />, label: 'Starred' },
    { id: 'sent', icon: <CheckCircle2 size={20} />, label: 'Sent' },
    { id: 'drafts', icon: <Clock size={20} />, label: 'Drafts' },
    { id: 'archived', icon: <Archive size={20} />, label: 'Archived' },
    { id: 'trash', icon: <Trash2 size={20} />, label: 'Trash' },
  ];

  return (
    <nav className="p-3">
      <ul className="space-y-1">
        {navItems.map((item) => (
          <li key={item.id}>
            <button
              className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors duration-150 ${
                activeTab === item.id
                  ? 'bg-eloquent-50 dark:bg-eloquent-900/20 text-eloquent-600 dark:text-eloquent-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="mr-3 text-gray-500 dark:text-gray-400">{item.icon}</span>
              <span>{item.label}</span>
              <span className="ml-auto bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full px-2 py-0.5 text-xs">
                {getFilteredCount(item.id)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Sidebar;
