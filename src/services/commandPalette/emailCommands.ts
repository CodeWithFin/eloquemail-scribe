// Service for registering email-related commands in the command palette
import { registerCommand, Command } from './index';
import { generateFollowUpEmail } from '../email/followUpService';
import { getTemplates, applyTemplateVariables } from '../templates';
import { analyzeEmailContent, parseEmailContent } from '../ai/emailAnalysis';
import { generateQuestionResponses, generateMeetingResponse, generateFollowUpResponse } from '../ai/emailReplyGenerator';

// Helper function to initiate an email composition
const composeEmail = (to?: string, subject?: string, body?: string) => {
  // This would typically open the email composition modal/panel
  // and pre-fill the fields if provided
  console.log('Compose email initiated', { to, subject, body });
  
  // Dispatch an event that the UI can listen for
  const event = new CustomEvent('email:compose', {
    detail: { to, subject, body }
  });
  document.dispatchEvent(event);
};

// Register commands for email composition
export const registerEmailCommands = (): void => {
  // Basic compose command
  registerCommand({
    id: 'email.compose',
    title: 'Compose New Email',
    shortcut: 'ctrl+n',
    section: 'Email',
    keywords: ['write', 'new', 'create', 'email', 'message'],
    perform: () => composeEmail()
  });

  // Template-based email commands
  const templates = getTemplates();
  templates.forEach(template => {
    registerCommand({
      id: `email.template.${template.id}`,
      title: `Email Template: ${template.name}`,
      section: 'Templates',
      keywords: ['template', 'email', template.name.toLowerCase(), template.category.toLowerCase()],
      perform: () => composeEmail(
        undefined, 
        template.name, 
        template.content
      )
    });
  });

  // Reply with AI assistance
  registerCommand({
    id: 'email.reply.smart',
    title: 'Smart Reply to Email',
    section: 'Email',
    keywords: ['reply', 'respond', 'smart', 'ai', 'assistant'],
    perform: () => {
      // This would typically get the currently selected email
      // For demo purposes, we'll use a placeholder
      const selectedEmail = {
        from: 'contact@example.com',
        subject: 'Meeting Request',
        body: 'Would you be available for a meeting tomorrow at 2pm to discuss the project?'
      };
      
      // Parse and analyze the email
      const parsedEmail = parseEmailContent(selectedEmail.body);
      const analysis = analyzeEmailContent(parsedEmail);
      
      // Generate appropriate response based on intent
      let responseBody = '';
      
      if (analysis.intent === 'meeting') {
        responseBody = generateMeetingResponse({
          proposedTimes: ['tomorrow at 2pm'],
          meetingPurpose: 'to discuss the project',
          responseSettings: {
            tone: 'professional',
            length: 'medium'
          }
        });
      } else if (analysis.questions.length > 0) {
        responseBody = generateQuestionResponses({
          questions: analysis.questions,
          responseSettings: {
            tone: 'professional',
            length: 'medium'
          }
        });
      } else if (analysis.intent === 'followUp') {
        responseBody = generateFollowUpResponse({
          context: analysis.actionItems[0] || 'the project',
          status: 'in-progress',
          responseSettings: {
            tone: 'professional',
            length: 'medium'
          }
        });
      }
      
      // Open composer with the generated response
      composeEmail(
        selectedEmail.from,
        `Re: ${selectedEmail.subject}`,
        responseBody
      );
    }
  });

  // Follow up commands
  registerCommand({
    id: 'email.followup.create',
    title: 'Create Follow-up Reminder',
    section: 'Email',
    keywords: ['follow', 'reminder', 'track', 'later'],
    perform: () => {
      // This would typically get the currently selected email
      // and open a follow-up creation dialog
      const event = new CustomEvent('followup:create');
      document.dispatchEvent(event);
    }
  });

  registerCommand({
    id: 'email.followup.list',
    title: 'View All Follow-ups',
    section: 'Email',
    keywords: ['follow', 'list', 'pending', 'reminders'],
    perform: () => {
      // This would typically open the follow-ups view
      const event = new CustomEvent('followup:view');
      document.dispatchEvent(event);
    }
  });

  registerCommand({
    id: 'email.followup.send',
    title: 'Send Follow-up Email',
    section: 'Email',
    keywords: ['follow', 'send', 'remind'],
    perform: () => {
      // This would typically get a selected follow-up item
      // and generate a follow-up email
      const followUp = {
        id: 'demo-followup',
        emailId: 'demo-email',
        subject: 'Project Proposal',
        recipient: 'contact@example.com',
        createdAt: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        status: 'pending' as const,  // Properly typed as a literal
        priority: 'medium' as const, // Properly typed as a literal
        notes: 'Waiting for feedback on the proposal'
      };
      
      const emailData = generateFollowUpEmail(followUp);
      composeEmail(emailData.to, emailData.subject, emailData.body);
    }
  });

  // Email scheduling commands
  registerCommand({
    id: 'email.schedule',
    title: 'Schedule Email for Later',
    section: 'Email',
    keywords: ['schedule', 'later', 'delay', 'send later'],
    perform: () => {
      // This would typically open a scheduling dialog
      const event = new CustomEvent('email:schedule');
      document.dispatchEvent(event);
    }
  });

  // Email tracking commands
  registerCommand({
    id: 'email.tracking.enable',
    title: 'Enable Email Tracking',
    section: 'Email',
    keywords: ['track', 'read', 'receipt', 'notification'],
    perform: () => {
      // This would toggle tracking for the current draft
      const event = new CustomEvent('email:toggleTracking', {
        detail: { enabled: true }
      });
      document.dispatchEvent(event);
    }
  });

  registerCommand({
    id: 'email.tracking.stats',
    title: 'View Email Tracking Stats',
    section: 'Email',
    keywords: ['track', 'stats', 'analytics', 'reports'],
    perform: () => {
      // This would open the tracking stats view
      const event = new CustomEvent('tracking:view');
      document.dispatchEvent(event);
    }
  });
};

// Call this function to initialize all email commands
export const initializeEmailCommands = (): void => {
  registerEmailCommands();
};