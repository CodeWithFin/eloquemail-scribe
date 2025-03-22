
// Gmail API response types
export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload?: {
    headers: {
      name: string;
      value: string;
    }[];
    parts?: any[];
    mimeType: string;
    body: {
      data?: string;
      size: number;
    };
  };
  sizeEstimate: number;
  historyId: string;
  internalDate: string;
}

// Custom types for our application
export interface GmailEmail {
  id: string;
  subject: string;
  sender: string;
  preview: string;
  date: string;
  read: boolean;
  starred: boolean;
  category?: 'primary' | 'social' | 'promotions';
}
