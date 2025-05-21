// Email-related commands for the command palette
import React from 'react';
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  BarChart, 
  Download, 
  Send, 
  Trash2, 
  Archive, 
  Star, 
  Reply, 
  Forward, 
  Save,
  AlertOctagon
} from 'lucide-react';
import { registerCommands, executeCommand } from '.';

// These are placeholder functions - they'll be implemented as we develop each feature
const scheduleEmail = () => {
  // Execute the command to open the compose window
  executeCommand('navigation.compose');
  // The email scheduler is now available in the compose screen
};

const setFollowUp = () => {
  console.log('Set follow-up feature to be implemented');
  // Will be connected to the follow-up tracking functionality
};

const trackEmail = () => {
  // Navigate to the email compose screen with tracking enabled
  window.location.href = '/compose';
  // The tracking toggle is now available in the compose screen
};

const viewTrackedEmails = () => {
  // Navigate to the tracked emails page
  window.location.href = '/tracked';
};

const enableOfflineMode = () => {
  // Navigate to offline emails page
  window.location.href = '/offline';
};

const registerEmailCommands = () => {
  registerCommands([
    // Email Scheduling Commands
    {
      id: 'email.schedule',
      title: 'Schedule Email',
      section: 'Email',
      shortcut: 'Alt+S',
      icon: <Calendar size={16} />,
      keywords: ['schedule', 'later', 'delay', 'time', 'calendar'],
      perform: scheduleEmail,
    },
    {
      id: 'email.reminder',
      title: 'Set Email Reminder',
      section: 'Email',
      icon: <Clock size={16} />,
      keywords: ['reminder', 'notify', 'alert', 'prompt', 'follow-up'],
      perform: scheduleEmail,
    },

    // Follow-Up Tracking Commands
    {
      id: 'email.followup',
      title: 'Set Follow-Up Reminder',
      section: 'Email',
      icon: <AlertCircle size={16} />,
      keywords: ['follow', 'track', 'remind', 'pending', 'waiting'],
      perform: setFollowUp,
    },
    {
      id: 'email.followups.view',
      title: 'View All Follow-Ups',
      section: 'Email',
      icon: <BarChart size={16} />,
      keywords: ['follow', 'track', 'pending', 'waiting', 'list'],
      perform: () => {
        console.log('View follow-ups feature to be implemented');
      },
    },

    // Email Tracking Commands
    {
      id: 'email.tracking.enable',
      title: 'Enable Email Tracking',
      section: 'Email',
      icon: <BarChart size={16} />,
      keywords: ['track', 'read', 'receipt', 'analytics', 'open'],
      perform: trackEmail,
    },
    {
      id: 'email.tracking.view',
      title: 'View Tracked Emails',
      section: 'Email',
      icon: <BarChart size={16} />,
      keywords: ['track', 'read', 'receipt', 'analytics', 'open', 'view', 'stats'],
      perform: viewTrackedEmails,
    },

    // Offline Mode Commands
    {
      id: 'app.offline.enable',
      title: 'Enable Offline Mode',
      section: 'Settings',
      icon: <Download size={16} />,
      keywords: ['offline', 'local', 'sync', 'download', 'cache'],
      perform: enableOfflineMode,
    },
    {
      id: 'app.offline.disable',
      title: 'Disable Offline Mode',
      section: 'Settings',
      keywords: ['offline', 'local', 'sync', 'download', 'cache', 'disable', 'off'],
      perform: () => {
        console.log('Disable offline mode feature to be implemented');
      },
    },

    // Email Actions
    {
      id: 'email.send',
      title: 'Send Email',
      section: 'Email',
      shortcut: 'Ctrl+Enter',
      icon: <Send size={16} />,
      keywords: ['send', 'submit', 'deliver', 'mail'],
      perform: () => {
        console.log('Send email command executed');
      },
    },
    {
      id: 'email.delete',
      title: 'Delete Email',
      section: 'Email',
      shortcut: 'Delete',
      icon: <Trash2 size={16} />,
      keywords: ['delete', 'remove', 'trash', 'bin'],
      perform: () => {
        console.log('Delete email command executed');
      },
    },
    {
      id: 'email.archive',
      title: 'Archive Email',
      section: 'Email',
      shortcut: 'E',
      icon: <Archive size={16} />,
      keywords: ['archive', 'store', 'hide', 'file'],
      perform: () => {
        console.log('Archive email command executed');
      },
    },
    {
      id: 'email.star',
      title: 'Star Email',
      section: 'Email',
      shortcut: 'S',
      icon: <Star size={16} />,
      keywords: ['star', 'favorite', 'important', 'flag', 'mark'],
      perform: () => {
        console.log('Star email command executed');
      },
    },
    {
      id: 'email.reply',
      title: 'Reply to Email',
      section: 'Email',
      shortcut: 'R',
      icon: <Reply size={16} />,
      keywords: ['reply', 'respond', 'answer', 'write back'],
      perform: () => {
        console.log('Reply to email command executed');
      },
    },
    {
      id: 'email.forward',
      title: 'Forward Email',
      section: 'Email',
      shortcut: 'F',
      icon: <Forward size={16} />,
      keywords: ['forward', 'send to', 'pass along', 'redirect'],
      perform: () => {
        console.log('Forward email command executed');
      },
    },
    {
      id: 'email.draft.save',
      title: 'Save Draft',
      section: 'Email',
      shortcut: 'Ctrl+S',
      icon: <Save size={16} />,
      keywords: ['save', 'draft', 'store', 'preserve'],
      perform: () => {
        console.log('Save draft command executed');
      },
    },
    {
      id: 'email.unread',
      title: 'Mark as Unread',
      section: 'Email',
      shortcut: 'Shift+U',
      icon: <AlertOctagon size={16} />,
      keywords: ['unread', 'mark', 'status', 'unseen'],
      perform: () => {
        console.log('Mark as unread command executed');
      },
    },
  ]);
};

export default registerEmailCommands;
