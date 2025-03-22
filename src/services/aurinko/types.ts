
export interface AurinkoAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface AurinkoProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface AurinkoMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  payload: {
    partId?: string;
    mimeType: string;
    filename?: string;
    headers: {
      name: string;
      value: string;
    }[];
    body?: {
      size: number;
      data?: string;
    };
    parts?: any[];
  };
  sizeEstimate: number;
}

export interface AurinkoMessageList {
  messages: AurinkoMessage[];
  nextPageToken?: string;
  resultSizeEstimate: number;
}
