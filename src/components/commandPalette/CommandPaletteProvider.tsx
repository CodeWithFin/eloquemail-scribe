import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CommandPalette, { CommandPaletteHandle } from './CommandPalette';
import { 
  registerCommand, 
  registerCommands, 
  registerShortcut 
} from '@/services/commandPalette';
import registerEmailCommands from '@/services/commandPalette/emailCommands.tsx';
import { 
  Mail, 
  Layout, 
  Settings, 
  FileText, 
  Sparkles, 
  Plus, 
  Star,
  Inbox,
  Clock,
  Archive,
  Trash2,
  Calendar,
  AlertCircle
} from 'lucide-react';

const CommandPaletteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const commandPaletteRef = useRef<CommandPaletteHandle>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Register the command to open the command palette
    registerCommand({
      id: 'command.palette.open',
      title: 'Open Command Palette',
      section: 'Navigation',
      shortcut: 'Ctrl+K',
      keywords: ['search', 'find', 'palette', 'command'],
      perform: () => commandPaletteRef.current?.open(),
    });

    // Register navigation commands
    registerCommands([
      {
        id: 'navigation.dashboard',
        title: 'Go to Dashboard',
        section: 'Navigation',
        shortcut: 'G D',
        icon: <Layout size={16} />,
        perform: () => navigate('/dashboard'),
      },
      {
        id: 'navigation.compose',
        title: 'Compose New Email',
        section: 'Email',
        shortcut: 'C',
        icon: <Plus size={16} />,
        perform: () => navigate('/compose'),
      },
      {
        id: 'navigation.templates',
        title: 'Go to Templates',
        section: 'Templates',
        icon: <FileText size={16} />,
        perform: () => navigate('/templates'),
      },
      {
        id: 'navigation.ai-tools',
        title: 'Go to AI Tools',
        section: 'AI Tools',
        icon: <Sparkles size={16} />,
        perform: () => navigate('/ai-tools'),
      },
      {
        id: 'navigation.scheduled',
        title: 'Go to Scheduled Emails',
        section: 'Email',
        icon: <Calendar size={16} />,
        perform: () => navigate('/scheduled'),
      },
      {
        id: 'navigation.followups',
        title: 'Go to Follow-Ups',
        section: 'Email',
        icon: <AlertCircle size={16} />,
        perform: () => navigate('/follow-ups'),
      },
      {
        id: 'navigation.settings',
        title: 'Go to Settings',
        section: 'Settings',
        icon: <Settings size={16} />,
        perform: () => navigate('/settings'),
      },
    ]);

    // Register email category commands
    registerCommands([
      {
        id: 'email.view.inbox',
        title: 'View Inbox',
        section: 'Email',
        icon: <Inbox size={16} />,
        perform: () => {
          navigate('/dashboard');
          // We would need to update Dashboard to accept an initial tab parameter
          // or use a context to select the tab
        },
      },
      {
        id: 'email.view.starred',
        title: 'View Starred Emails',
        section: 'Email',
        icon: <Star size={16} />,
        perform: () => {
          navigate('/dashboard');
          // Similarly would update Dashboard state
        },
      },
      {
        id: 'email.view.drafts',
        title: 'View Drafts',
        section: 'Email',
        icon: <Clock size={16} />,
        perform: () => {
          navigate('/dashboard');
          // Similarly would update Dashboard state
        },
      },
      {
        id: 'email.view.archived',
        title: 'View Archived',
        section: 'Email',
        icon: <Archive size={16} />,
        perform: () => {
          navigate('/dashboard');
          // Similarly would update Dashboard state
        },
      },
      {
        id: 'email.view.trash',
        title: 'View Trash',
        section: 'Email',
        icon: <Trash2 size={16} />,
        perform: () => {
          navigate('/dashboard');
          // Similarly would update Dashboard state
        },
      },
    ]);

    // Register template commands
    registerCommands([
      {
        id: 'template.create',
        title: 'Create New Template',
        section: 'Templates',
        icon: <Plus size={16} />,
        perform: () => {
          navigate('/templates');
          // Would need to trigger the new template modal
        },
      },
    ]);

    // Register keyboard shortcuts
    registerShortcut('c', 'navigation.compose');
    registerShortcut('g+d', 'navigation.dashboard');
    registerShortcut('g+t', 'navigation.templates');
    registerShortcut('g+a', 'navigation.ai-tools');
    registerShortcut('g+s', 'navigation.settings');
    registerShortcut('g+c', 'navigation.scheduled');
    registerShortcut('g+f', 'navigation.followups');

    // Register all email-related commands
    registerEmailCommands();
  }, [navigate]);

  return (
    <>
      <CommandPalette ref={commandPaletteRef} />
      {children}
    </>
  );
};

export default CommandPaletteProvider;
