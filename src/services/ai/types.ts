export type EmailIntent = 'request' | 'information' | 'followUp' | 'introduction' | 'meeting';

export type UrgencyLevel = 'high' | 'medium' | 'low';

export type EmailSentiment = {
  tone: 'positive' | 'negative' | 'neutral';
  formality: 'formal' | 'informal';
};

export type Deadline = {
  text: string;
  date: Date | null;
};

export interface EmailAnalysis {
  sender: {
    name?: string;
    email: string;
  };
  subject: string;
  intent: EmailIntent;
  questions: string[];
  actionItems: string[];
  deadlines: Deadline[];
  urgency: UrgencyLevel;
  sentiment: {
    tone: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  hasAttachments: boolean;
  timestamp: Date;
  metadata: {
    confidence: number;
    requiresHumanReview: boolean;
    reviewReason?: string;
  };
}

export interface EmailGenerationOptions {
  tone: 'formal' | 'friendly' | 'assertive' | 'concise' | 'persuasive';
  length: 'short' | 'medium' | 'long';
  context?: string;
  includeIntro: boolean;
  includeOutro: boolean;
  preserveContext?: boolean;
  includeActionItems?: boolean;
  includeDeadlines?: boolean;
  humanReviewRecommended?: boolean;
}

export interface GeneratedReply {
  text: string;
  metadata: {
    questionsAddressed: string[];
    actionItemsIncluded: string[];
    deadlinesReferenced: Deadline[];
    confidence: number;
    requiresHumanReview: boolean;
    reviewReason?: string;
  };
}
