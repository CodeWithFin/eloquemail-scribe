
// Aurinko OAuth configuration
const AURINKO_CLIENT_ID = '514e2856ee68ad9dc5126ca9b073fd34';
const AURINKO_REDIRECT_URI = 'http://localhost:3000/api/auth/callback/aurinko';

// Check if the user is authenticated with Aurinko
export const isAurinkoAuthenticated = (): boolean => {
  return localStorage.getItem('aurinko_token') !== null;
};

// Generate the Aurinko authentication URL
export const getAurinkoAuthUrl = (): string => {
  const authUrl = new URL('https://app.aurinko.io/auth');
  
  // Add required parameters
  authUrl.searchParams.append('client_id', AURINKO_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', AURINKO_REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'token');
  authUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/gmail.readonly');
  
  return authUrl.toString();
};

// Handle the Aurinko authentication callback
export const handleAurinkoAuthCallback = (): string | null => {
  // First, check for token in URL hash (SPA flow)
  if (window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const token = hashParams.get('access_token');
    
    if (token) {
      // Store token in localStorage
      localStorage.setItem('aurinko_token', token);
      return token;
    }
  }
  
  // Second, check for token in URL search params (server flow)
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('access_token');
  
  if (token) {
    // Store token in localStorage
    localStorage.setItem('aurinko_token', token);
    return token;
  }
  
  return null;
};

// Initiate the Aurinko authentication flow
export const initiateAurinkoAuth = (): void => {
  const authUrl = getAurinkoAuthUrl();
  window.location.href = authUrl;
};
