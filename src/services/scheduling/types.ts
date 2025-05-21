import { EmailDraft } from '../gmail/types';

export interface ScheduledEmail {
  id: string;
  email: EmailDraft;
  scheduledTime: string;  // ISO date string
  status: 'scheduled' | 'sent' | 'failed';
  createdAt: string;     // ISO date string
  updatedAt: string;     // ISO date string
}

export interface ScheduleEmailInput {
  email: EmailDraft;
  scheduledTime: string;  // ISO date string
}
