import { type EmailAnalysis, type GeneratedReply } from './types';

// Cache interface for storing and retrieving cached AI responses
interface AIResponseCache {
  smartReplies: Map<string, { 
    replies: string[], 
    timestamp: number,
    analysis: EmailAnalysis
  }>;
  emailAnalysis: Map<string, { 
    analysis: EmailAnalysis, 
    timestamp: number 
  }>;
  fullReplies: Map<string, { 
    reply: GeneratedReply, 
    timestamp: number,
    options: any
  }>;
}

// Cache expiration time (in milliseconds)
const CACHE_TTL = {
  SMART_REPLIES: 30 * 60 * 1000, // 30 minutes
  EMAIL_ANALYSIS: 60 * 60 * 1000, // 60 minutes
  FULL_REPLIES: 30 * 60 * 1000 // 30 minutes
};

// Initialize the cache
const cache: AIResponseCache = {
  smartReplies: new Map(),
  emailAnalysis: new Map(),
  fullReplies: new Map()
};

// Helper to generate a cache key
const generateCacheKey = (text: string, options?: any): string => {
  if (!text) return '';
  
  // Create a normalized version of the text for better cache hits
  const normalizedText = text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
    
  // If no options, just return the normalized text
  if (!options) return normalizedText;
  
  // If options exist, include them in the cache key
  return `${normalizedText}:${JSON.stringify(options)}`;
};

// Get similiar cache key with fuzzy matching
const getSimilarCacheKey = (cache: Map<string, any>, text: string): string | null => {
  // For very small texts, require exact matches
  if (text.length < 50) return null;
  
  const normalizedText = text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
    
  // Check each key for similarity
  for (const key of cache.keys()) {
    // If the key is an exact match, return it
    if (key === normalizedText) return key;
    
    // For longer texts, try to find a similar key with at least 80% word overlap
    const textWords = new Set(normalizedText.split(' '));
    const keyWords = new Set(key.split(' '));
    
    // Count common words
    let commonWords = 0;
    for (const word of textWords) {
      if (keyWords.has(word)) commonWords++;
    }
    
    // If more than 80% of the words are the same, consider it a similar text
    const similarityScore = commonWords / Math.min(textWords.size, keyWords.size);
    if (similarityScore > 0.8) return key;
  }
  
  return null;
};

// Smart Replies cache operations
export const getCachedSmartReplies = (text: string): string[] | null => {
  const cacheKey = generateCacheKey(text);
  if (!cacheKey) return null;
  
  // Try exact match first
  if (cache.smartReplies.has(cacheKey)) {
    const cachedData = cache.smartReplies.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL.SMART_REPLIES) {
      console.log('Cache hit: smart replies');
      return cachedData.replies;
    }
  }
  
  // Try similar match
  const similarKey = getSimilarCacheKey(cache.smartReplies, text);
  if (similarKey) {
    const cachedData = cache.smartReplies.get(similarKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL.SMART_REPLIES) {
      console.log('Cache hit (similar): smart replies');
      return cachedData.replies;
    }
  }
  
  return null;
};

export const cacheSmartReplies = (text: string, replies: string[], analysis: EmailAnalysis): void => {
  const cacheKey = generateCacheKey(text);
  if (!cacheKey) return;
  
  cache.smartReplies.set(cacheKey, {
    replies,
    timestamp: Date.now(),
    analysis
  });
  
  // Prune old cache entries if the cache gets too large
  if (cache.smartReplies.size > 100) {
    pruneCache(cache.smartReplies, CACHE_TTL.SMART_REPLIES);
  }
};

// Email analysis cache operations
export const getCachedEmailAnalysis = (text: string): EmailAnalysis | null => {
  const cacheKey = generateCacheKey(text);
  if (!cacheKey) return null;
  
  // Try exact match first
  if (cache.emailAnalysis.has(cacheKey)) {
    const cachedData = cache.emailAnalysis.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL.EMAIL_ANALYSIS) {
      console.log('Cache hit: email analysis');
      return cachedData.analysis;
    }
  }
  
  // Try similar match
  const similarKey = getSimilarCacheKey(cache.emailAnalysis, text);
  if (similarKey) {
    const cachedData = cache.emailAnalysis.get(similarKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL.EMAIL_ANALYSIS) {
      console.log('Cache hit (similar): email analysis');
      return cachedData.analysis;
    }
  }
  
  return null;
};

export const cacheEmailAnalysis = (text: string, analysis: EmailAnalysis): void => {
  const cacheKey = generateCacheKey(text);
  if (!cacheKey) return;
  
  cache.emailAnalysis.set(cacheKey, {
    analysis,
    timestamp: Date.now()
  });
  
  // Prune old cache entries if the cache gets too large
  if (cache.emailAnalysis.size > 100) {
    pruneCache(cache.emailAnalysis, CACHE_TTL.EMAIL_ANALYSIS);
  }
};

// Full replies cache operations
export const getCachedFullReply = (text: string, options: any): GeneratedReply | null => {
  const cacheKey = generateCacheKey(text, options);
  if (!cacheKey) return null;
  
  if (cache.fullReplies.has(cacheKey)) {
    const cachedData = cache.fullReplies.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL.FULL_REPLIES) {
      console.log('Cache hit: full reply');
      return cachedData.reply;
    }
  }
  
  return null;
};

export const cacheFullReply = (text: string, reply: GeneratedReply, options: any): void => {
  const cacheKey = generateCacheKey(text, options);
  if (!cacheKey) return;
  
  cache.fullReplies.set(cacheKey, {
    reply,
    options,
    timestamp: Date.now()
  });
  
  // Prune old cache entries if the cache gets too large
  if (cache.fullReplies.size > 100) {
    pruneCache(cache.fullReplies, CACHE_TTL.FULL_REPLIES);
  }
};

// Helper to prune old cache entries
const pruneCache = <T>(cache: Map<string, { timestamp: number } & T>, maxAge: number): void => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > maxAge) {
      cache.delete(key);
    }
  }
};

// Clear all caches
export const clearAllCaches = (): void => {
  cache.smartReplies.clear();
  cache.emailAnalysis.clear();
  cache.fullReplies.clear();
};

export default {
  getCachedSmartReplies,
  cacheSmartReplies,
  getCachedEmailAnalysis,
  cacheEmailAnalysis,
  getCachedFullReply,
  cacheFullReply,
  clearAllCaches
};
