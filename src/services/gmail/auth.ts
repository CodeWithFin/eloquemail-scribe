
// Constants for Google OAuth
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels'
].join(' ');

// Using the provided client ID
const CLIENT_ID = '465336393919-pfoeklk9pgp0nhei2hi7j5c5jodv0vsl.apps.googleusercontent.com';

/**
 * Initiates Gmail authentication flow via Google OAuth
 */
export const initiateGmailAuth = async (): Promise<void> => {
  if (!CLIENT_ID) {
    throw new Error('Google Cloud OAuth Client ID is not configured');
  }

  // Get current origin for redirect URI
  const currentOrigin = window.location.origin;
  console.log('Initiating auth with redirect URI:', currentOrigin);

  // Create OAuth 2.0 URL
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.append('client_id', CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', currentOrigin);
  authUrl.searchParams.append('response_type', 'token');
  authUrl.searchParams.append('scope', GMAIL_SCOPES);
  authUrl.searchParams.append('prompt', 'consent');
  
  // Redirect to Google's OAuth page
  window.location.href = authUrl.toString();
};

/**
 * Handle the OAuth callback by extracting the token from URL
 */
export const handleGmailAuthCallback = (): string | null => {
  const hash = window.location.hash;
  
  if (!hash) return null;
  
  const params = new URLSearchParams(hash.substring(1));
  const accessToken = params.get('access_token');
  
  if (accessToken) {
    // Store the token in localStorage
    localStorage.setItem('gmail_token', accessToken);
    
    // Remove the hash from URL to avoid token leakage
    window.history.replaceState(null, '', window.location.pathname);
  }
  
  return accessToken;
};

/**
 * Get the stored Gmail token from localStorage
 */
export const getGmailToken = (): string | null => {
  return localStorage.getItem('gmail_token');
};

/**
 * Remove the Gmail token from localStorage
 */
export const removeGmailToken = (): void => {
  localStorage.removeItem('gmail_token');
};

/**
 * Check if the user is authenticated with Gmail
 */
export const isGmailAuthenticated = (): boolean => {
  return !!getGmailToken();
};
