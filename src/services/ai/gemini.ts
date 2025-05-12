import { EmailDraft } from '../gmail/types';

// Define types for Gemini API results
interface GenerateContentResponse {
  response: {
    text: () => string;
  };
}

interface GenerativeModel {
  generateContent: (prompt: string) => Promise<GenerateContentResponse>;
}

interface GoogleGenerativeAI {
  getGenerativeModel: (options: { model: string }) => GenerativeModel;
}

// This is a placeholder key - users need to provide their own key in settings
// In a production app, you would handle this server-side
const DEFAULT_GEMINI_API_KEY = ""; 

// Check if we already showed the API key warning
let apiKeyWarningShown = false;

// Get Gemini client with the current API key from localStorage or use default
const getGeminiClient = () => {
  // First try to get a custom API key if the user has set one
  const customApiKey = localStorage.getItem('gemini_api_key');
  // Use the custom key if available, otherwise use the default key
  const apiKey = customApiKey || DEFAULT_GEMINI_API_KEY;
  // Check if AI features are enabled - default to enabled if not set
  const aiEnabled = localStorage.getItem('ai_features_enabled') !== 'false';
  
  if (!aiEnabled) {
    throw new Error('AI features are disabled. Please enable them in Settings.');
  }
  
  if (!apiKey) {
    if (!apiKeyWarningShown) {
      console.warn('No Gemini API key provided. Please add your API key in Settings.');
      apiKeyWarningShown = true;
    }
    throw new Error('No Gemini API key provided. Please add your API key in Settings.');
  }
  
  // Return a custom implementation that uses direct API calls
  return {
    getGenerativeModel: ({ model }: { model: string }) => {
      return {
        generateContent: async (prompt: string) => {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          
          try {
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: prompt
                      }
                    ]
                  }
                ]
              })
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              const errorMessage = errorData.error?.message || 'Unknown error';
              
              if (errorMessage.includes('API key not valid')) {
                throw new Error('Invalid API key. Please update your Gemini API key in Settings.');
              } else {
                throw new Error(`Gemini API error: ${errorMessage}`);
              }
            }
            
            const data = await response.json();
            
            return {
              response: {
                text: () => {
                  // Extract the generated text from the response
                  if (data.candidates && data.candidates[0]?.content?.parts) {
                    return data.candidates[0].content.parts[0].text || '';
                  }
                  return '';
                }
              }
            };
          } catch (error) {
            // Log detailed error information
            console.error('Gemini API error:', error);
            throw error;
          }
        }
      };
    }
  } as GoogleGenerativeAI;
};

/**
 * Grammar and style corrections for email content
 */
export const improveEmailText = async (text: string): Promise<string> => {
  try {
    // Wait to simulate processing time
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Basic text improvement logic - capitalize first letter, fix common punctuation
    let improved = text.trim();
    
    // Capitalize first letter
    if (improved.length > 0) {
      improved = improved.charAt(0).toUpperCase() + improved.slice(1);
    }
    
    // Add period at the end if missing
    if (improved.length > 0 && !improved.endsWith('.') && !improved.endsWith('!') && !improved.endsWith('?')) {
      improved += '.';
    }
    
    // Fix common issues
    improved = improved
      .replace(/\si\s/g, ' I ') // Capitalize standalone "i"
      .replace(/\s{2,}/g, ' ') // Remove multiple spaces
      .replace(/\.\./g, '.') // Replace multiple periods
      .replace(/,\s*([a-z])/g, (match, letter) => `, ${letter}`); // Ensure space after commas
      
    return improved;
  } catch (error) {
    console.error('Error improving email text:', error);
    return text;
  }
};

/**
 * Generate subject line based on email content
 */
export const generateSubjectLine = async (emailBody: string): Promise<string> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Extract first few words for subject line
    const words = emailBody.split(' ');
    const firstFewWords = words.slice(0, 5).join(' ').trim();
    
    // Generate a subject line based on first few words
    if (firstFewWords.length < 15) {
      return `Re: ${firstFewWords}`;
    } else {
      return `Re: ${firstFewWords.substring(0, 40)}...`;
    }
  } catch (error) {
    console.error('Error generating subject line:', error);
    return 'Email Subject';
  }
};

/**
 * Summarize email thread
 */
export const summarizeEmailThread = async (threadContent: string): Promise<string> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Create a temporary DOM element to help with HTML parsing
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = threadContent;
    
    // Extract text content - this properly handles HTML
    let cleanText = tempDiv.textContent || tempDiv.innerText || '';
    
    // Additional cleanup for common email formatting artifacts
    cleanText = cleanText
      .replace(/\s{2,}/g, ' ') // Remove extra spaces
      .replace(/mso-[^:;]*(:|;)/g, '') // Remove MSO specific content
      .replace(/^\s*style.*?\{.*?\}/gmi, '') // Remove style blocks
      .replace(/charset=("|')[^"']+("|')/g, '') // Remove charset declarations
      .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
      .trim();
    
    // If we have very little text after cleanup, return a helpful message
    if (cleanText.length < 30) {
      return "This email appears to contain very little text content or primarily consists of formatting elements.";
    }
    
    // Create a simplified summary by extracting key sentences
    const sentences = cleanText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10 && s.length < 250) // Reasonable sentence length
      .filter(s => !/^(https?:|www\.|@|<|>|\[|\]|\{|\})/.test(s)); // Filter out URLs and other non-sentence text
    
    // If we don't have enough valid sentences after filtering
    if (sentences.length < 2) {
      return "Email could not be summarized properly. It may contain complex formatting or limited text content.";
    }
    
    // Select important sentences - prioritize the beginning, middle and end of the email
    let keyPoints = [];
    
    // Always include first sentence if it's meaningful
    if (sentences[0] && !sentences[0].toLowerCase().includes('view this email in your browser')) {
      keyPoints.push(sentences[0]);
    }
    
    // Include an early sentence that's not a greeting
    const earlyIndex = sentences.findIndex((s, i) => 
      i > 0 && i < Math.min(5, sentences.length) && 
      !/^(hi|hello|dear|hey|greetings)/i.test(s)
    );
    
    if (earlyIndex !== -1) {
      keyPoints.push(sentences[earlyIndex]);
    }
    
    // Include a sentence from the middle
    const middleIndex = Math.floor(sentences.length / 2);
    if (sentences[middleIndex] && keyPoints.indexOf(sentences[middleIndex]) === -1) {
      keyPoints.push(sentences[middleIndex]);
    }
    
    // Include a sentence from near the end, but not a signature
    const endIndex = sentences.findIndex((s, i) => 
      i > Math.max(sentences.length - 5, 0) && 
      i < sentences.length - 1 &&
      !/^(thanks|thank you|regards|sincerely|best)/i.test(s)
    );
    
    if (endIndex !== -1) {
      keyPoints.push(sentences[endIndex]);
    }
    
    // Remove duplicates
    keyPoints = keyPoints.filter((item, index, self) => 
      self.indexOf(item) === index
    );
    
    // Make sure we have at least some key points
    if (keyPoints.length === 0) {
      // If we couldn't extract meaningful sentences, take the first few non-trivial ones
      keyPoints = sentences
        .filter(s => s.length > 20)
        .slice(0, 3);
    }
    
    // Calculate metadata
    const wordCount = cleanText.split(/\s+/).length;
    
    let summary = "Summary of Email:\n\n";
    
    // Add key points
    keyPoints.forEach(point => {
      if (!point.endsWith('.') && !point.endsWith('!') && !point.endsWith('?')) {
        point += '.';
      }
      summary += `• ${point}\n\n`;
    });
    
    // Add metadata
    summary += `• Email contains approximately ${wordCount} words.`;
    
    return summary;
  } catch (error) {
    console.error('Error summarizing email thread:', error);
    return 'Unable to generate summary. The email may contain complex formatting.';
  }
};

/**
 * Adjust email tone (formal, friendly, assertive, etc.)
 */
export const adjustEmailTone = async (
  text: string, 
  tone: 'formal' | 'friendly' | 'assertive' | 'concise' | 'persuasive'
): Promise<string> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let adjustedText = text.trim();
    
    // Apply different modifications based on tone
    switch (tone) {
      case 'formal':
        adjustedText = adjustedText
          .replace(/hey/gi, 'Hello')
          .replace(/hi there/gi, 'Greetings')
          .replace(/thanks/gi, 'Thank you')
          .replace(/gonna/gi, 'going to')
          .replace(/wanna/gi, 'want to')
          .replace(/yeah/gi, 'yes');
        return `${adjustedText}\n\nBest regards,\n[Your Name]`;
        
      case 'friendly':
        return `Hi there!\n\n${adjustedText}\n\nCheers,\n[Your Name]`;
        
      case 'assertive':
        return `${adjustedText}\n\nI look forward to your prompt response.\n\nThank you,\n[Your Name]`;
        
      case 'concise':
        // Remove filler words
        adjustedText = adjustedText
          .replace(/as you know/gi, '')
          .replace(/I think that/gi, '')
          .replace(/basically/gi, '')
          .replace(/in my opinion/gi, '')
          .replace(/\s{2,}/g, ' ');
        return adjustedText;
        
      case 'persuasive':
        return `I'm reaching out because this is important.\n\n${adjustedText}\n\nThis would make a significant difference and I would greatly appreciate your help with this.\n\nThank you,\n[Your Name]`;
        
      default:
        return text;
    }
  } catch (error) {
    console.error(`Error adjusting email tone to ${tone}:`, error);
    return text;
  }
};

/**
 * Generate email reply suggestions based on received email
 */
export const generateReplyOptions = async (emailContent: string): Promise<string[]> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate generic replies
    const containsQuestion = emailContent.toLowerCase().includes('?');
    const containsRequest = /could you|would you|can you|please|help/i.test(emailContent);
    const containsUpdate = /update|progress|status/i.test(emailContent);
    const containsGreeting = /hi|hello|hey/i.test(emailContent);
    
    const options = [];
    
    if (containsQuestion) {
      options.push("Thanks for your question. I'll look into this and get back to you soon.");
    }
    
    if (containsRequest) {
      options.push("I'll take care of this request right away. I'll update you once it's done.");
    }
    
    if (containsUpdate) {
      options.push("Thank you for the update. I appreciate you keeping me informed.");
    }
    
    if (containsGreeting && options.length < 3) {
      options.push("Thanks for reaching out! I'll review this and respond in more detail shortly.");
    }
    
    // Ensure we have at least 3 options
    const defaultOptions = [
      "Thanks for your email. I'll look into this and respond shortly.",
      "I appreciate you reaching out. Let me get back to you on this.",
      "Thank you for the message. I'll take care of this soon."
    ];
    
    while (options.length < 3) {
      options.push(defaultOptions[options.length]);
    }
    
    return options;
  } catch (error) {
    console.error('Error generating reply options:', error);
    return [
      "I'll look into this.",
      "Thanks for your email.",
      "Let me get back to you soon."
    ];
  }
};

/**
 * Generate auto-reply for an email with specified parameters
 */
export const generateFullReply = async (
  emailContent: string, 
  options: { 
    tone?: 'formal' | 'friendly' | 'assertive' | 'concise' | 'persuasive',
    length?: 'short' | 'medium' | 'long',
    context?: string,
    includeIntro?: boolean,
    includeOutro?: boolean
  } = {}
): Promise<string> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const defaultOptions = {
      tone: 'friendly' as const,
      length: 'medium' as const,
      includeIntro: true,
      includeOutro: true,
      context: ''
    };
    
    const settings = { ...defaultOptions, ...options };
    
    // Generate a reply based on email content and settings
    let intro = '';
    let body = '';
    let outro = '';
    
    // Create intro based on tone
    if (settings.includeIntro) {
      switch (settings.tone) {
        case 'formal':
          intro = 'Dear Sir/Madam,\n\n';
          break;
        case 'friendly':
          intro = 'Hi there,\n\n';
          break;
        case 'assertive':
          intro = 'Hello,\n\n';
          break;
        case 'concise':
          intro = '';
          break;
        case 'persuasive':
          intro = 'Hello,\n\n';
          break;
      }
    }
    
    // Create body based on length and content
    const containsQuestion = emailContent.toLowerCase().includes('?');
    const containsRequest = /could you|would you|can you|please|help/i.test(emailContent);
    const containsUpdate = /update|progress|status/i.test(emailContent);
    
    // Determine body content
    if (containsQuestion) {
      if (settings.length === 'short') {
        body = "Thank you for your question. I'll look into this and get back to you with an answer.\n\n";
      } else if (settings.length === 'medium') {
        body = "Thank you for your question. I understand this is important to you. I'll need to gather some information and will provide you with a detailed answer as soon as possible.\n\n";
      } else {
        body = "Thank you for your question. I understand this is important to you. I'll need to gather some information from our team to ensure I provide you with the most accurate and helpful answer. I anticipate having this for you within the next 1-2 business days. If you need the information more urgently, please let me know and I'll prioritize accordingly.\n\n";
      }
    } else if (containsRequest) {
      if (settings.length === 'short') {
        body = "I'll take care of your request promptly.\n\n";
      } else if (settings.length === 'medium') {
        body = "I'll take care of your request promptly. I appreciate your patience and will update you once it's been completed.\n\n";
      } else {
        body = "I'll take care of your request promptly. I understand the importance of this matter and will prioritize it accordingly. I'll be coordinating with our team to ensure everything is handled properly and efficiently. You can expect an update from me within the next 24 hours with either the completed request or a status update and timeline.\n\n";
      }
    } else if (containsUpdate) {
      if (settings.length === 'short') {
        body = "Thank you for the update. I appreciate you keeping me informed.\n\n";
      } else if (settings.length === 'medium') {
        body = "Thank you for the update. I appreciate you keeping me informed about the progress. This information is very helpful.\n\n";
      } else {
        body = "Thank you for the comprehensive update. I greatly appreciate you keeping me informed about the progress and details of the situation. This information is very helpful for us to stay aligned and make informed decisions moving forward. Please continue to share any new developments as they arise.\n\n";
      }
    } else {
      if (settings.length === 'short') {
        body = "Thanks for your email. I'll review this information shortly.\n\n";
      } else if (settings.length === 'medium') {
        body = "Thanks for your email. I appreciate you reaching out on this matter. I'll review the information you've provided and determine the best next steps.\n\n";
      } else {
        body = "Thanks for your email. I appreciate you reaching out on this matter. I've received the information you've provided and will be giving it my full attention. After a thorough review, I'll determine the best next steps and coordinate with any relevant team members if needed. You can expect my detailed response with any questions or actions needed from your side.\n\n";
      }
    }
    
    // Add context if provided
    if (settings.context) {
      body += `Regarding your question about ${settings.context}: I'll be sure to address this specifically in my follow-up.\n\n`;
    }
    
    // Create outro based on tone
    if (settings.includeOutro) {
      switch (settings.tone) {
        case 'formal':
          outro = 'Best regards,\n[Your Name]';
          break;
        case 'friendly':
          outro = 'Cheers,\n[Your Name]';
          break;
        case 'assertive':
          outro = 'I look forward to your prompt response.\n\nRegards,\n[Your Name]';
          break;
        case 'concise':
          outro = 'Thanks,\n[Your Name]';
          break;
        case 'persuasive':
          outro = 'I really appreciate your help with this.\n\nBest,\n[Your Name]';
          break;
      }
    }
    
    return `${intro}${body}${outro}`;
  } catch (error) {
    console.error('Error generating email reply:', error);
    return "I'll get back to you soon.\n\nRegards,\n[Your Name]";
  }
};

/**
 * Analyze email sentiment and key points
 */
export const analyzeEmail = async (emailContent: string): Promise<{
  sentiment: 'positive' | 'negative' | 'neutral',
  keyPoints: string[],
  actionItems: string[],
  urgency: 'low' | 'medium' | 'high'
}> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Determine sentiment based on keywords
    const positiveWords = ['thanks', 'appreciate', 'happy', 'great', 'good', 'excellent', 'pleased', 'love'];
    const negativeWords = ['issue', 'problem', 'concerned', 'disappointed', 'urgent', 'error', 'wrong', 'bad', 'unhappy'];
    
    const content = emailContent.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (content.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (content.includes(word)) negativeCount++;
    });
    
    let sentiment: 'positive' | 'negative' | 'neutral';
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
    } else {
      sentiment = 'neutral';
    }
    
    // Extract key points using a simple approach
    const sentences = emailContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const keyPoints = sentences.slice(0, Math.min(3, sentences.length)).map(s => s.trim());
    
    // Identify action items by looking for common patterns
    const actionPatterns = [
      /please .*?[.?!]/gi,
      /can you .*?[.?!]/gi,
      /could you .*?[.?!]/gi,
      /would you .*?[.?!]/gi,
      /need to .*?[.?!]/gi,
      /we should .*?[.?!]/gi
    ];
    
    const actionItems = [];
    actionPatterns.forEach(pattern => {
      const matches = emailContent.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (!actionItems.includes(match)) {
            actionItems.push(match);
          }
        });
      }
    });
    
    // Determine urgency
    let urgency: 'low' | 'medium' | 'high' = 'low';
    const urgentWords = ['urgent', 'asap', 'immediately', 'emergency', 'deadline', 'today', 'soon', 'quickly'];
    
    let urgencyCount = 0;
    urgentWords.forEach(word => {
      if (content.includes(word)) urgencyCount++;
    });
    
    if (urgencyCount >= 2) {
      urgency = 'high';
    } else if (urgencyCount === 1) {
      urgency = 'medium';
    }
    
    return {
      sentiment,
      keyPoints: keyPoints.length > 0 ? keyPoints : ['No key points identified'],
      actionItems: actionItems.length > 0 ? actionItems : ['No action items identified'],
      urgency
    };
  } catch (error) {
    console.error('Error analyzing email:', error);
    return {
      sentiment: 'neutral',
      keyPoints: ['Error analyzing email content'],
      actionItems: [],
      urgency: 'low'
    };
  }
};

/**
 * Generate email content based on subject line
 */
export const generateEmailContent = async (subject: string): Promise<string> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Strip any "Re:" or "Fwd:" prefixes for cleaner content generation
    const cleanSubject = subject.replace(/^(Re:|Fwd:)\s*/i, '').trim();
    
    // Generate content based on subject categories
    if (cleanSubject.match(/meeting|call|appointment/i)) {
      return `Hello,\n\nI'd like to schedule a meeting to discuss ${cleanSubject}. Would you be available this week for a 30-minute call?\n\nPlease let me know which of the following times would work for you:\n- Monday at 2:00 PM\n- Tuesday at 11:00 AM\n- Thursday at 3:30 PM\n\nIf none of these times work, please suggest an alternative time that would be convenient for you.\n\nLooking forward to our discussion.\n\nBest regards,\n[Your Name]`;
    }
    
    if (cleanSubject.match(/update|progress|status/i)) {
      return `Hello,\n\nI wanted to provide you with an update on ${cleanSubject}.\n\nHere's a summary of our progress so far:\n\n1. Completed initial analysis and research phase\n2. Identified key requirements and constraints\n3. Developed preliminary implementation plan\n4. Started work on the first milestone\n\nWe're currently on track to meet our deadline. The next steps include finalizing the design and beginning the development phase.\n\nPlease let me know if you have any questions or if you need any additional information.\n\nBest regards,\n[Your Name]`;
    }
    
    if (cleanSubject.match(/invitation|invite|party|event/i)) {
      return `Hello,\n\nI'm excited to invite you to ${cleanSubject}!\n\nDate: [Date]\nTime: [Time]\nLocation: [Location]\n\nPlease RSVP by [Date] so we can finalize arrangements.\n\nLooking forward to seeing you there!\n\nBest wishes,\n[Your Name]`;
    }
    
    if (cleanSubject.match(/thank|thanks|appreciation/i)) {
      return `Hello,\n\nI wanted to take a moment to express my sincere thanks regarding ${cleanSubject}.\n\nYour contribution has made a significant difference, and I truly appreciate your support and dedication.\n\nThank you again for all that you've done.\n\nWarm regards,\n[Your Name]`;
    }
    
    if (cleanSubject.match(/proposal|idea|suggestion/i)) {
      return `Hello,\n\nI'm reaching out with a proposal regarding ${cleanSubject}.\n\nAfter careful consideration, I believe this initiative would benefit our organization by:\n\n1. Improving efficiency in our current processes\n2. Reducing operational costs\n3. Enhancing overall quality and user satisfaction\n\nThe implementation would involve the following phases:\n- Planning and resource allocation (2 weeks)\n- Initial development and testing (4 weeks)\n- Deployment and monitoring (2 weeks)\n\nPlease review this proposal and let me know your thoughts. I'd be happy to discuss this further and address any questions you might have.\n\nBest regards,\n[Your Name]`;
    }
    
    if (cleanSubject.match(/question|inquiry|help/i)) {
      return `Hello,\n\nI'm writing with a question about ${cleanSubject}.\n\nCould you please provide some clarification on this matter? Specifically, I'd like to know:\n\n1. What are the current procedures in place?\n2. Who should be the main point of contact?\n3. What timeline should we expect?\n\nThank you for your assistance with this inquiry.\n\nBest regards,\n[Your Name]`;
    }
    
    // Default template for other subjects
    return `Hello,\n\nI'm writing to you regarding ${cleanSubject}.\n\nI wanted to discuss this matter with you because it's important for our ongoing collaboration. Based on recent developments, I believe we should consider the following points:\n\n1. [Key Point 1]\n2. [Key Point 2]\n3. [Key Point 3]\n\nPlease let me know your thoughts on this. I'm available to discuss further at your convenience.\n\nThank you for your attention to this matter.\n\nBest regards,\n[Your Name]`;
  } catch (error) {
    console.error('Error generating email content:', error);
    return 'Unable to generate email content. Please try again.';
  }
};

/**
 * Generate text completion for Editor component
 */
export const generateTextCompletion = async (text: string): Promise<string> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Since we're simulating Gemini AI, let's create some plausible completions
    const completions = [
      " I look forward to hearing back from you soon.",
      " Please let me know if you need any additional information.",
      " I appreciate your time and consideration.",
      " Let's schedule a meeting to discuss this further.",
      " Thank you for your prompt attention to this matter.",
      " I hope this finds you well."
    ];
    
    // Select a random completion that makes sense in context
    const randomIndex = Math.floor(Math.random() * completions.length);
    return completions[randomIndex];
  } catch (error) {
    console.error('Error generating text completion:', error);
    throw new Error('Unable to generate text completion');
  }
};

export default {
  improveEmailText,
  generateSubjectLine,
  summarizeEmailThread,
  adjustEmailTone,
  generateReplyOptions,
  generateFullReply,
  analyzeEmail,
  generateEmailContent,
  generateTextCompletion
}; 