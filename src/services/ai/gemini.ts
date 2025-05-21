import { EmailDraft } from '../gmail/types';
import { generateEmailReply } from './emailReplyGenerator';
import { parseEmailContent, analyzeEmailContent } from './emailAnalysis';

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
    
    // First, perform a thorough analysis to understand the email
    const analysis = await analyzeEmail(emailContent);
    
    // Generate tailored reply options based on the analysis
    const options: string[] = [];
    
    // Question-based replies
    if (analysis.questions.length > 0) {
      if (analysis.questions.length === 1) {
        // For a single question, directly address it
        const question = analysis.questions[0].replace(/\?/g, '').trim();
        options.push(`I'll look into your question about ${question} and get back to you shortly.`);
        
        // Add a tentative answer if possible
        if (question.length < 50) {
          options.push(`Regarding your question about ${question}, [brief answer]. Let me know if you need more details.`);
        }
      } else {
        // For multiple questions
        options.push(`Thanks for your questions. I'll address each one in detail in my full response shortly.`);
        options.push(`I've noted your ${analysis.questions.length} questions and will respond with complete answers soon.`);
      }
    }
    
    // Action item-based replies
    if (analysis.actionItems.length > 0) {
      if (analysis.actionItems.length === 1) {
        // For a single action item
        const actionItem = analysis.actionItems[0]
          .replace(/^(please|could you|can you|would you)\s+/i, '')
          .replace(/[.?!]$/g, '')
          .trim();
          
        if (actionItem.length < 40) {
          options.push(`I'll take care of ${actionItem} right away and update you once it's done.`);
        } else {
          options.push(`I'll address your request promptly and get back to you with an update.`);
        }
      } else {
        // For multiple action items
        options.push(`I've noted all ${analysis.actionItems.length} requests and will start working on them.`);
        options.push(`Thanks for outlining what you need. I'll handle these items and keep you updated on my progress.`);
      }
    }
    
    // Deadline-based replies
    if (analysis.deadlines.length > 0) {
      // Check if there's a high priority deadline
      const priorityDeadline = analysis.deadlines.find(d => d.isPriority);
      
      if (priorityDeadline) {
        options.push(`I understand this is time-sensitive. I'll prioritize this and respond by ${priorityDeadline.text.replace(/^(by|due|deadline[:\s]+|no later than|before|complete by)/i, '').trim()}.`);
      } else if (analysis.deadlines.length === 1) {
        const deadline = analysis.deadlines[0];
        options.push(`I'll make sure to address this by ${deadline.text.replace(/^(by|due|deadline[:\s]+|no later than|before|complete by)/i, '').trim()}.`);
      } else {
        options.push(`I've noted all the timelines you mentioned and will ensure everything is done on schedule.`);
      }
    }
    
    // Intent-based replies
    switch (analysis.intent) {
      case 'information':
        if (!analysis.questions.length && !analysis.actionItems.length) {
          options.push(`Thank you for sharing this information. I appreciate you keeping me updated.`);
          options.push(`Thanks for this update. I've noted the details you shared.`);
        }
        break;
        
      case 'meeting':
        if (analysis.deadlines.length > 0) {
          options.push(`I'm available for the meeting and have marked my calendar for ${analysis.deadlines[0].text.replace(/^(by|due|deadline[:\s]+|no later than|before|complete by)/i, '').trim()}.`);
        } else {
          options.push(`I'd be happy to meet. Please let me know what times work best for you.`);
          options.push(`A meeting sounds great. I'm available this week on Tuesday afternoon or Thursday morning.`);
        }
        break;
        
      case 'followUp':
        options.push(`Thanks for following up. I'll prioritize this and get back to you with a complete update.`);
        options.push(`I appreciate the reminder. I'm working on this and will have an update for you by the end of the day.`);
        break;
        
      case 'introduction':
        options.push(`It's great to connect with you. I'd be happy to schedule some time to discuss how we might work together.`);
        options.push(`Thank you for reaching out. I'm interested in learning more about your work and potential collaboration.`);
        break;
    }
    
    // Urgency-based replies
    if (analysis.urgency === 'high' && options.length < 3) {
      options.push(`I understand this is urgent. I'll respond in detail as soon as possible.`);
    }
    
    // Formality and tone matching
    if (analysis.formality === 'formal' && options.length < 3) {
      options.push(`Thank you for your correspondence. I will review the details and respond appropriately.`);
    } else if (analysis.formality === 'casual' && options.length < 3) {
      options.push(`Thanks for your email! I'll get back to you with more info soon.`);
    }
    
    // Consider sentiment in response
    if (analysis.sentiment.tone === 'negative' && analysis.sentiment.confidence > 0.6) {
      options.push(`I understand your concerns and will address them promptly. Thank you for bringing this to my attention.`);
    } else if (analysis.sentiment.tone === 'positive' && analysis.sentiment.confidence > 0.6 && options.length < 3) {
      options.push(`I'm glad to hear from you! I'll respond to your email in detail shortly.`);
    }
    
    // Ensure we have at least 3 options
    const defaultOptions = [
      "Thanks for your email. I'll look into this and respond in detail shortly.",
      "I appreciate you reaching out. I'll get back to you on this as soon as possible.",
      "Thank you for the message. I'll review and respond with a complete answer soon."
    ];
    
    while (options.length < 3) {
      options.push(defaultOptions[options.length % defaultOptions.length]);
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

interface GeneratedEmailReply {
  text: string;
  metadata: {
    questionsAddressed: string[];
    actionItemsIncluded: string[];
    deadlinesReferenced: Array<{ text: string; date: string }>;
    confidence: number;
    requiresHumanReview: boolean;
    reviewReason?: string;
  };
}

/**
 * Generate auto-reply for an email with specified parameters
 */
export const generateFullReply = async (
  emailContent: string, 
  options: { 
    tone?: 'formal' | 'friendly' | 'assertive' | 'concise' | 'persuasive';
    length?: 'short' | 'medium' | 'long';
    context?: string;
    includeIntro?: boolean;
    includeOutro?: boolean;
  } = {}
): Promise<GeneratedEmailReply> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const defaultOptions = {
      tone: 'friendly' as const,
      length: 'medium' as const,
      includeIntro: true,
      includeOutro: true
    };
    
    const settings = { ...defaultOptions, ...options };
    
    // Step 1: Analyze the email to extract all key information
    const analysis = await analyzeEmail(emailContent);
    
    // Step 2: Generate the reply based on comprehensive analysis
    let body = '';
    
    // Step 3: Create an appropriate greeting based on sender relationship and formality
    if (settings.includeIntro) {
      const name = analysis.sender.name?.split(' ')[0] || '';
      
      // Adjust greeting based on formality level and relationship context
      if (analysis.formality === 'formal' || settings.tone === 'formal') {
        body += `Dear ${name || (analysis.sender.name ? analysis.sender.name : 'Sir/Madam')},\n\n`;
      } else if (analysis.formality === 'casual' || settings.tone === 'friendly') {
        body += `Hi ${name || 'there'},\n\n`;
      } else {
        body += `Hello ${name || ''},\n\n`;
      }
    }
    
    // Step 4: Add a contextual opening sentence that references the original email
    const openingSentences = [
      `Thank you for your email regarding ${analysis.subject.toLowerCase()}.`,
      `I appreciate you reaching out about ${analysis.subject.toLowerCase()}.`,
      `Thanks for your message about ${analysis.subject.toLowerCase()}.`
    ];
    
    // Choose opening sentence based on tone
    let openingSentence = '';
    switch (settings.tone) {
      case 'formal':
        openingSentence = `Thank you for your correspondence regarding ${analysis.subject.toLowerCase()}.`;
        break;
      case 'friendly':
        openingSentence = openingSentences[Math.floor(Math.random() * openingSentences.length)];
        break;
      case 'assertive':
        openingSentence = `I've reviewed your email about ${analysis.subject.toLowerCase()} and am responding to your points.`;
        break;
      case 'concise':
        openingSentence = `Regarding ${analysis.subject.toLowerCase()}:`;
        break;
      case 'persuasive':
        openingSentence = `Thank you for bringing ${analysis.subject.toLowerCase()} to my attention.`;
        break;
      default:
        openingSentence = openingSentences[Math.floor(Math.random() * openingSentences.length)];
    }
    
    // Add user-provided context if available
    if (settings.context) {
      body += `${openingSentence} ${settings.context}\n\n`;
    } else {
      body += `${openingSentence}\n\n`;
    }
    
    // Step 5: Address specific questions with detailed answers
    if (analysis.questions.length > 0) {
      // Handle questions differently based on length setting
      if (settings.length === 'short' || analysis.questions.length > 3) {
        // For short replies or many questions, use a more compact format
        body += `To address your questions:\n\n`;
        analysis.questions.forEach((question, index) => {
          // Extract the core of the question for brevity
          const questionCore = question.replace(/\?/g, '').trim();
          const shortQuestion = questionCore.length > 40 
            ? questionCore.substring(0, 40) + '...' 
            : questionCore;
            
          body += `${index + 1}. Regarding ${shortQuestion}: [Your response here]\n`;
        });
        body += '\n';
      } else {
        // For medium/long replies with fewer questions, provide more detailed responses
        analysis.questions.forEach(question => {
          // Extract the essence of the question for the response
          const questionEssence = question
            .replace(/^(can|could|would|do|does|is|are|will|should|have|has|did|was|were)\s+you/i, '')
            .replace(/\?/g, '')
            .trim();
            
          body += `Regarding your question about ${questionEssence}:\n[Your detailed response here]\n\n`;
        });
      }
    }
    
    // Step 6: Address action items with clear responses
    if (analysis.actionItems.length > 0) {
      // Different formats based on length setting
      if (settings.length === 'short' || analysis.actionItems.length > 3) {
        body += `I'll address your requests:\n\n`;
        analysis.actionItems.forEach((item, index) => {
          // Create a shortened version of the action item
          const shortItem = item.length > 50 
            ? item.substring(0, 50) + '...' 
            : item;
            
          body += `${index + 1}. ${shortItem}: [Your action/response here]\n`;
        });
        body += '\n';
      } else {
        body += `Regarding your requests:\n\n`;
        analysis.actionItems.forEach(item => {
          // Clean up the action item text
          const cleanItem = item
            .replace(/^(please|could you|can you|would you)\s+/i, '')
            .replace(/[.?!]$/g, '')
            .trim();
            
          body += `- ${cleanItem}: [Your detailed response/action here]\n`;
        });
        body += '\n';
      }
    }
    
    // Step 7: Acknowledge deadlines specifically
    if (analysis.deadlines.length > 0) {
      if (settings.tone === 'concise') {
        body += `Noted deadlines:\n`;
        analysis.deadlines.forEach(deadline => {
          body += `- ${deadline.text}: [Your commitment/response]\n`;
        });
        body += '\n';
      } else {
        body += `I acknowledge the following timeline${analysis.deadlines.length > 1 ? 's' : ''}:\n\n`;
        analysis.deadlines.forEach(deadline => {
          // Format the date if possible
          let formattedDate = deadline.date;
          try {
            if (deadline.date !== 'unknown') {
              const date = new Date(deadline.date);
              formattedDate = date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              });
            }
          } catch (e) {
            formattedDate = deadline.text;
          }
          
          // Acknowledge the deadline with commitment
          if (deadline.isPriority) {
            body += `- ${deadline.text}: I'll prioritize this and ensure it's completed ${formattedDate !== 'unknown' ? `by ${formattedDate}` : 'by the specified time'}.\n`;
          } else {
            body += `- ${deadline.text}: I'll work to meet this deadline ${formattedDate !== 'unknown' ? `(${formattedDate})` : ''}.\n`;
          }
        });
        body += '\n';
      }
    }
    
    // Step 8: Reference previous communications if mentioned
    if (analysis.previousEmailReferences.length > 0 && settings.length !== 'short') {
      const reference = analysis.previousEmailReferences[0];
      body += `As you mentioned regarding our ${reference}, [relevant context or follow-up here].\n\n`;
    }
    
    // Step 9: Acknowledge attachments if present
    if (analysis.hasAttachments && analysis.attachmentReferences.length > 0) {
      body += `Thank you for the ${analysis.attachmentReferences.join(' and ')}. [Comment about the attachment if relevant].\n\n`;
    }
    
    // Step 10: Add an appropriate closing based on the email context and tone
    if (settings.includeOutro) {
      // Add next steps or call to action first
      if (analysis.intent === 'request' || analysis.actionItems.length > 0) {
        if (settings.tone === 'assertive') {
          body += `I'll follow up with you once these items are addressed. `;
        } else if (settings.tone === 'persuasive') {
          body += `I believe this addresses your concerns and I look forward to your feedback. `;
        } else if (settings.tone !== 'concise') {
          body += `Please let me know if you need any additional information. `;
        }
      }
      
      // Then add the formal sign-off
      switch (settings.tone) {
        case 'formal':
          body += '\nBest regards,\n[Your Name]';
          break;
        case 'friendly':
          body += '\nBest wishes,\n[Your Name]';
          break;
        case 'assertive':
          body += '\nRegards,\n[Your Name]';
          break;
        case 'concise':
          body += '\nThanks,\n[Your Name]';
          break;
        case 'persuasive':
          body += '\nLooking forward to your response,\n[Your Name]';
          break;
        default:
          body += '\nBest,\n[Your Name]';
      }
    }
    
    // Step 11: Return the generated reply with metadata
    return {
      text: body,
      metadata: {
        questionsAddressed: analysis.questions,
        actionItemsIncluded: analysis.actionItems,
        deadlinesReferenced: analysis.deadlines,
        confidence: analysis.metadata.confidence,
        requiresHumanReview: analysis.metadata.requiresHumanReview,
        reviewReason: analysis.metadata.reviewReason
      }
    };
  } catch (error) {
    console.error('Error generating email reply:', error);
    return {
      text: `I'll get back to you soon.\n\nRegards,\n[Your Name]`,
      metadata: {
        questionsAddressed: [],
        actionItemsIncluded: [],
        deadlinesReferenced: [],
        confidence: 0,
        requiresHumanReview: true,
        reviewReason: 'Error generating reply'
      }
    };
  }
};

/**
 * Analyze email sentiment and key points
 */
interface EmailAnalysis {
  // Sender information
  sender: { 
    name?: string; 
    email: string;
    company?: string;
    title?: string;
  };
  subject: string;
  
  // Email categorization  
  intent: 'request' | 'information' | 'followUp' | 'introduction' | 'meeting';
  primaryPurpose: string; // A brief description of the main purpose of the email
  
  // Detailed content analysis
  questions: string[];       // Specific questions that need responses
  actionItems: string[];     // Action items requested of the recipient
  deadlines: Array<{ 
    text: string; 
    date: string;
    isPriority: boolean;
  }>;
  
  // Previous context
  previousEmailReferences: string[]; // References to previous communications
  
  // Email characteristics
  urgency: 'low' | 'medium' | 'high';
  importance: 'low' | 'medium' | 'high';
  formality: 'casual' | 'neutral' | 'formal';
  sentiment: {
    tone: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  
  // Attachments and additional elements
  hasAttachments: boolean;
  attachmentReferences: string[]; // References to any attachments mentioned
  
  // Metadata
  timestamp: Date;
  metadata: {
    confidence: number;
    requiresHumanReview: boolean;
    reviewReason?: string;
    relationshipContext?: 'personal' | 'professional' | 'unknown';
    keyTopics: string[]; // Main topics discussed in the email
  };
}

export const analyzeEmail = async (emailContent: string): Promise<EmailAnalysis> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Parse email content to extract text
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = emailContent;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    
    // Extract sender information
    const emailRegex = /([^@\s]+@[^@\s]+\.[^@\s]+)/;
    const emailMatch = text.match(emailRegex);
    const senderEmail = emailMatch ? emailMatch[0] : 'unknown@email.com';
    
    // Extract sender name
    let senderName;
    if (emailMatch) {
      const beforeEmail = text.substring(0, emailMatch.index || 0).trim();
      const nameMatch = beforeEmail.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
      senderName = nameMatch ? nameMatch[0] : undefined;
    }

    // Extract company information if available
    const companyRegex = /@([^.]+)\.|from\s+([A-Z][a-zA-Z0-9\s]+)\b/;
    const companyMatch = text.match(companyRegex);
    const company = companyMatch ? companyMatch[1] || companyMatch[2] : undefined;

    // Extract questions using more sophisticated patterns
    const sentences = text.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    // Find all questions (both explicit with ? and implicit)
    const explicitQuestions = sentences
      .filter(s => s.endsWith('?'))
      .map(s => s.trim());
    
    // Find implicit questions (sentences that ask for information without a question mark)
    const implicitQuestionPatterns = [
      /\bcould you\b.*?[^?]/i,
      /\bcan you\b.*?[^?]/i,
      /\bwould you\b.*?[^?]/i,
      /\bplease let me know\b.*?[^?]/i,
      /\bI('d| would) like to know\b.*?[^?]/i,
      /\b(tell|inform|update) me\b.*?[^?]/i,
      /\bneed to know\b.*?[^?]/i,
      /\bclarify\b.*?[^?]/i,
      /\bexplain\b.*?[^?]/i
    ];
    
    const implicitQuestions = [];
    for (const pattern of implicitQuestionPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        implicitQuestions.push(...matches);
      }
    }
    
    // Combine and deduplicate questions
    const allQuestions = [...explicitQuestions, ...implicitQuestions];
    const questions = [...new Set(allQuestions)].map(q => q.trim());
    
    // Determine sentiment with enhanced analysis
    const positiveWords = [
      'thanks', 'appreciate', 'happy', 'great', 'good', 'excellent', 
      'pleased', 'love', 'wonderful', 'fantastic', 'excited', 'grateful',
      'delighted', 'glad', 'perfect', 'impressive', 'outstanding'
    ];
    
    const negativeWords = [
      'issue', 'problem', 'concerned', 'disappointed', 'urgent', 'error', 
      'wrong', 'bad', 'unhappy', 'failure', 'unfortunately', 'regret',
      'sorry', 'trouble', 'difficult', 'frustration', 'failed', 'complaint',
      'delay', 'inconvenience', 'mistake', 'concern'
    ];
    
    const content = text.toLowerCase();
    const words = content.split(/\s+/);
    
    let positiveCount = words.filter(word => positiveWords.includes(word)).length;
    let negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    // Calculate sentiment confidence
    const totalSentimentWords = positiveCount + negativeCount;
    const sentimentConfidence = Math.min(totalSentimentWords * 0.2, 0.9);
    
    // Determine the sentiment tone
    let sentimentTone: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (positiveCount > negativeCount * 1.5) {
      sentimentTone = 'positive';
    } else if (negativeCount > positiveCount * 1.2) {
      sentimentTone = 'negative';
    }

    const sentiment = {
      tone: sentimentTone,
      confidence: sentimentConfidence
    };

    // Identify action items with improved patterns
    const actionPatterns = [
      /please .*?[.?!]/gi,
      /can you .*?[.?!]/gi,
      /could you .*?[.?!]/gi,
      /would you .*?[.?!]/gi,
      /need to .*?[.?!]/gi,
      /we should .*?[.?!]/gi,
      /you (should|must|need) to .*?[.?!]/gi,
      /kindly .*?[.?!]/gi,
      /it would be (great|helpful|appreciated) if you could .*?[.?!]/gi,
      /I('d| would| am) (like|asking|requesting|hoping) (you )?(to|for) .*?[.?!]/gi
    ];
    
    const actionItems: string[] = [];
    actionPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (!actionItems.some(item => item.toLowerCase().includes(match.toLowerCase().trim()))) {
            actionItems.push(match.trim());
          }
        });
      }
    });

    // Extract deadlines with improved patterns
    const deadlinePatterns = [
      /by\s+(.*?)([.?!]|$)/gi,
      /due\s+(.*?)([.?!]|$)/gi,
      /deadline[:\s]+(.*?)([.?!]|$)/gi,
      /no later than\s+(.*?)([.?!]|$)/gi,
      /before\s+(.*?)([.?!]|$)/gi,
      /complete by\s+(.*?)([.?!]|$)/gi,
      /within\s+(\d+)\s+(day|week|hour|minute|business day)s?/gi,
      /this (week|month)/gi,
      /(today|tomorrow|asap)/gi,
      /(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/g,
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}/gi,
      /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/gi,
      /next (week|month|Monday|Tuesday|Wednesday|Thursday|Friday|weekend)/gi
    ];

    const deadlines: Array<{ text: string; date: string; isPriority: boolean }> = [];
    const today = new Date();
    
    deadlinePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Try to parse the date from the matched text
          const dateStr = match.replace(/^(by|due|deadline[:\s]+|no later than|before|complete by)/i, '').trim();
          
          try {
            let date: Date | null = null;
            let isPriority = false;
            
            // Handle relative date expressions
            if (/today/i.test(dateStr)) {
              date = new Date();
              isPriority = true;
            } else if (/tomorrow/i.test(dateStr)) {
              date = new Date(today);
              date.setDate(date.getDate() + 1);
              isPriority = true;
            } else if (/asap/i.test(dateStr)) {
              date = new Date(today);
              isPriority = true;
            } else if (/this week/i.test(dateStr)) {
              date = new Date(today);
              date.setDate(date.getDate() + (7 - date.getDay()));
            } else if (/next week/i.test(dateStr)) {
              date = new Date(today);
              date.setDate(date.getDate() + (14 - date.getDay()));
            } else if (/within\s+(\d+)\s+(day|week|hour|minute|business day)s?/i.test(dateStr)) {
              const match = dateStr.match(/within\s+(\d+)\s+(day|week|hour|minute|business day)s?/i);
              if (match) {
                const num = parseInt(match[1]);
                const unit = match[2].toLowerCase();
                date = new Date(today);
                if (unit.includes('day')) {
                  date.setDate(date.getDate() + num);
                  isPriority = num <= 3;
                } else if (unit.includes('week')) {
                  date.setDate(date.getDate() + (num * 7));
                } else if (unit.includes('hour')) {
                  date.setHours(date.getHours() + num);
                  isPriority = true;
                } else if (unit.includes('minute')) {
                  date.setMinutes(date.getMinutes() + num);
                  isPriority = true;
                }
              }
            } else {
              // Try to parse actual date
              date = new Date(dateStr);
              
              // If that fails, try more specific formatting
              if (isNaN(date.getTime())) {
                // Handle day of week
                const dayMatch = dateStr.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i);
                if (dayMatch) {
                  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                  const targetDay = days.indexOf(dayMatch[1].toLowerCase());
                  date = new Date(today);
                  const currentDay = date.getDay();
                  date.setDate(date.getDate() + (targetDay + 7 - currentDay) % 7);
                  isPriority = (targetDay + 7 - currentDay) % 7 <= 2;
                }
              }
            }
            
            // Check if date was successfully determined and add it to deadlines
            if (date && !isNaN(date.getTime())) {
              // Check if this deadline is already in the array
              const existingIndex = deadlines.findIndex(d => 
                d.text.toLowerCase().includes(match.toLowerCase()) || 
                match.toLowerCase().includes(d.text.toLowerCase())
              );
              
              if (existingIndex === -1) {
                // If not in array, add it
                deadlines.push({ 
                  text: match.trim(), 
                  date: date.toISOString(),
                  isPriority: isPriority || (date.getTime() - today.getTime() < 86400000 * 3) // 3 days
                });
              } else {
                // If already in array, update it if this date is more specific
                if (date.getTime() - today.getTime() < new Date(deadlines[existingIndex].date).getTime() - today.getTime()) {
                  deadlines[existingIndex] = { 
                    text: match.trim(), 
                    date: date.toISOString(),
                    isPriority: isPriority || (date.getTime() - today.getTime() < 86400000 * 3) // 3 days
                  };
                }
              }
            } else if (match.includes('asap') || match.includes('urgent') || match.includes('immediately')) {
              // For ASAP or urgent deadlines with no specific date
              deadlines.push({ 
                text: match.trim(), 
                date: today.toISOString(),
                isPriority: true
              });
            }
          } catch (e) {
            // If date parsing fails, still include the text
            deadlines.push({ 
              text: match.trim(), 
              date: 'unknown',
              isPriority: match.toLowerCase().includes('asap') || 
                        match.toLowerCase().includes('urgent') || 
                        match.toLowerCase().includes('immediately')
            });
          }
        });
      }
    });

    // Determine urgency
    let urgency: 'low' | 'medium' | 'high' = 'low';
    const urgentWords = [
      'urgent', 'asap', 'immediately', 'emergency', 'deadline', 'today', 
      'soon', 'quickly', 'critical', 'important', 'priority', 'promptly',
      'expedite', 'rush', 'time-sensitive'
    ];
    
    const urgencyCount = words.filter(word => urgentWords.includes(word)).length;
    const hasHighPriorityDeadline = deadlines.some(d => d.isPriority);

    if (urgencyCount >= 2 || hasHighPriorityDeadline || 
        deadlines.some(d => d.date !== 'unknown' && new Date(d.date).getTime() - today.getTime() < 86400000)) {
      urgency = 'high';
    } else if (urgencyCount === 1 || deadlines.length > 0) {
      urgency = 'medium';
    }

    // Determine importance
    let importance: 'low' | 'medium' | 'high' = 'medium';
    const importanceWords = [
      'important', 'critical', 'essential', 'significant', 'key', 
      'major', 'vital', 'crucial', 'priority', 'attention'
    ];
    
    const importanceCount = words.filter(word => importanceWords.includes(word)).length;
    
    if (importanceCount >= 2 || urgency === 'high') {
      importance = 'high';
    } else if (importanceCount === 0 && urgency === 'low' && actionItems.length === 0 && questions.length === 0) {
      importance = 'low';
    }

    // Determine formality level
    let formality: 'casual' | 'neutral' | 'formal' = 'neutral';
    const formalWords = [
      'dear', 'sincerely', 'regards', 'respectfully', 'esteemed',
      'pursuant', 'hereby', 'aforementioned', 'acknowledge', 'formal',
      'honored', 'sir', 'madam', 'kindly', 'cordially'
    ];
    
    const casualWords = [
      'hey', 'hi', 'hello', 'cheers', 'thanks', 'btw', 'fyi',
      'okay', 'cool', 'awesome', 'yeah', 'yep', 'sure',
      'no worries', 'no problem', 'take care'
    ];
    
    const formalCount = words.filter(word => formalWords.includes(word)).length;
    const casualCount = words.filter(word => casualWords.includes(word)).length;
    
    if (formalCount > casualCount * 1.5) {
      formality = 'formal';
    } else if (casualCount > formalCount * 1.5) {
      formality = 'casual';
    }

    // Determine intent with more sophisticated analysis
    let intent: EmailAnalysis['intent'] = 'information';
    if (questions.length > 0 || actionItems.some(item => 
        /please clarify|can you explain|need.*information|tell me more/i.test(item))) {
      intent = 'request';
    } else if (content.includes('meeting') || content.includes('schedule') || 
              content.includes('calendar') || content.includes('appointment') ||
              content.includes('call') || content.includes('discuss') ||
              content.includes('conference')) {
      intent = 'meeting';
    } else if (content.includes('following up') || content.includes('checking in') || 
              content.includes('status update') || content.includes('progress report') ||
              content.includes('touching base') || content.includes('circling back')) {
      intent = 'followUp';
    } else if (content.includes('introduce') || content.includes('nice to meet') || 
              content.includes('connecting') || content.includes('pleasure to meet') ||
              content.includes('introducing myself') || content.includes('wanted to connect')) {
      intent = 'introduction';
    }

    // Extract primary purpose
    let primaryPurpose = 'Sharing information';
    if (intent === 'request') {
      primaryPurpose = questions.length > 0 
        ? 'Asking for information or answers' 
        : 'Requesting action or assistance';
    } else if (intent === 'meeting') {
      primaryPurpose = 'Scheduling or discussing a meeting';
    } else if (intent === 'followUp') {
      primaryPurpose = 'Following up on previous communication';
    } else if (intent === 'introduction') {
      primaryPurpose = 'Introduction or establishing contact';
    }

    // Check for attachments
    const hasAttachments = content.includes('attached') || content.includes('attachment') || 
                          content.includes('enclosed') || content.includes('see file');
                          
    // Extract attachment references
    const attachmentReferences: string[] = [];
    const attachmentPatterns = [
      /attached.*?(is|are).*?([^.?!]+)[.?!]/i,
      /I('ve| have) attached ([^.?!]+)[.?!]/i,
      /please find ([^.?!]+) attached/i,
      /enclosed ([^.?!]+)/i,
      /see.*?(attached|enclosed) ([^.?!]+)/i
    ];
    
    attachmentPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches && matches.length > 1) {
        const reference = matches[matches.length - 1].trim();
        if (reference.length > 0 && !attachmentReferences.includes(reference)) {
          attachmentReferences.push(reference);
        }
      }
    });

    // Extract references to previous communications
    const previousEmailReferences: string[] = [];
    const previousEmailPatterns = [
      /as (mentioned|discussed|per|stated|referenced|indicated) (in|on) ([^.?!]+)/i,
      /following (up on|our) ([^.?!]+)/i,
      /regarding our ([^.?!]+)/i,
      /in our (previous|last|earlier) ([^.?!]+)/i,
      /thank you for your ([^.?!]+)/i,
      /in response to your ([^.?!]+)/i
    ];
    
    previousEmailPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches && matches.length > 1) {
        const reference = matches[matches.length - 1].trim();
        if (reference.length > 0 && !previousEmailReferences.includes(reference)) {
          previousEmailReferences.push(reference);
        }
      }
    });

    // Extract key topics from the email
    const keyTopics: string[] = [];
    
    // Try to extract topics from subject
    const subjectMatch = text.match(/subject:?\s+(.*?)(\n|$)/i);
    const subject = subjectMatch ? subjectMatch[1].trim() : 'No subject';
    
    // Add subject words as potential topics
    const subjectWords = subject.split(/\s+/).filter(word => 
      word.length > 3 && 
      !/^(the|and|or|for|with|about|from|your|our|their|his|her|its|this|that|these|those|re|fwd)$/i.test(word)
    );
    
    subjectWords.forEach(word => {
      if (!keyTopics.includes(word)) {
        keyTopics.push(word);
      }
    });
    
    // Extract topics from email body by finding repeated important words
    const wordFrequency = {};
    words.forEach(word => {
      if (word.length > 4 && 
          !/^(the|and|or|for|with|about|from|your|our|their|his|her|its|this|that|these|those)$/i.test(word)) {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      }
    });
    
    // Get top 5 frequent words as topics
    const frequentWords = Object.entries(wordFrequency)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(entry => entry[0]);
    
    frequentWords.forEach(word => {
      if (!keyTopics.includes(word) && keyTopics.length < 5) {
        keyTopics.push(word);
      }
    });

    // Determine relationship context
    let relationshipContext: 'personal' | 'professional' | 'unknown' = 'unknown';
    const professionalWords = [
      'meeting', 'project', 'deadline', 'report', 'business', 'client',
      'company', 'office', 'work', 'job', 'team', 'department', 'manager',
      'employee', 'supervisor', 'colleague', 'professional'
    ];
    
    const personalWords = [
      'family', 'friend', 'personal', 'vacation', 'holiday', 'weekend',
      'dinner', 'lunch', 'coffee', 'drinks', 'party', 'celebration',
      'birthday', 'anniversary', 'wedding', 'home'
    ];
    
    const professionalCount = words.filter(word => professionalWords.includes(word)).length;
    const personalCount = words.filter(word => personalWords.includes(word)).length;
    
    if (professionalCount > personalCount) {
      relationshipContext = 'professional';
    } else if (personalCount > professionalCount) {
      relationshipContext = 'personal';
    }

    // Calculate overall confidence score with improved algorithm
    const confidence = Math.min(
      (sentimentConfidence * 0.2 + 
       (questions.length > 0 ? 0.15 : 0) +
       (actionItems.length > 0 ? 0.15 : 0) +
       (deadlines.length > 0 ? 0.15 : 0) +
       (hasAttachments ? 0.1 : 0) +
       (subject !== 'No subject' ? 0.15 : 0) +
       (senderEmail !== 'unknown@email.com' ? 0.1 : 0)) / 1.0,
      0.95
    );

    // Determine if human review is needed with improved criteria
    const requiresHumanReview = 
      urgency === 'high' ||
      sentiment.tone === 'negative' ||
      questions.length > 3 ||
      actionItems.length > 3 ||
      deadlines.some(d => d.isPriority) ||
      confidence < 0.5;

    let reviewReason: string | undefined;
    if (requiresHumanReview) {
      if (urgency === 'high') reviewReason = 'High urgency email requires attention';
      else if (sentiment.tone === 'negative') reviewReason = 'Negative sentiment detected';
      else if (questions.length > 3) reviewReason = 'Complex email with multiple questions';
      else if (actionItems.length > 3) reviewReason = 'Multiple action items need verification';
      else if (deadlines.some(d => d.isPriority)) reviewReason = 'Priority deadline requires attention';
      else if (confidence < 0.5) reviewReason = 'Low confidence in analysis';
    }

    return {
      sender: { 
        name: senderName, 
        email: senderEmail,
        company: company
      },
      subject,
      intent,
      primaryPurpose,
      questions,
      actionItems,
      deadlines,
      previousEmailReferences,
      urgency,
      importance,
      formality,
      sentiment,
      hasAttachments,
      attachmentReferences,
      timestamp: new Date(),
      metadata: {
        confidence,
        requiresHumanReview,
        reviewReason,
        relationshipContext,
        keyTopics
      }
    };

  } catch (error) {
    console.error('Error analyzing email:', error);
    return {
      sender: { email: 'unknown@email.com' },
      subject: 'Error Processing Email',
      intent: 'information',
      primaryPurpose: 'Unable to determine',
      questions: [],
      actionItems: [],
      deadlines: [],
      previousEmailReferences: [],
      urgency: 'low',
      importance: 'medium',
      formality: 'neutral',
      sentiment: { tone: 'neutral', confidence: 0 },
      hasAttachments: false,
      attachmentReferences: [],
      timestamp: new Date(),
      metadata: {
        confidence: 0,
        requiresHumanReview: true,
        reviewReason: 'Error analyzing email content',
        keyTopics: []
      }
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

/**
 * Generate smart reply suggestions for an email
 */
export const generateSmartReplies = async (emailContent: string): Promise<string[]> => {
  try {
    // First analyze the email to understand its contents
    const analysis = await analyzeEmail(emailContent);
    
    // Create targeted, contextual replies based on email analysis
    let replies: string[] = [];
    
    // Intent-based replies with contextual elements
    switch (analysis.intent) {
      case 'request':
        if (analysis.questions.length > 0) {
          // Question handling
          const questionSample = analysis.questions.length > 0 ? analysis.questions[0] : '';
          const shortQuestion = questionSample.length > 30 
            ? questionSample.substring(0, 30).replace(/\?$/, '') + '...' 
            : questionSample.replace(/\?$/, '');
          
          if (analysis.questions.length === 1) {
            replies.push(`I'll address your question about ${shortQuestion} shortly after gathering the information needed.`);
            
            if (analysis.urgency === 'high') {
              replies.push(`I understand your question about ${shortQuestion} is time-sensitive. I'll prioritize this and get back to you today.`);
            } else {
              replies.push(`Thanks for asking about ${shortQuestion}. Let me research this and I'll provide a thorough answer.`);
            }
          } else {
            replies.push(`I'll answer each of your ${analysis.questions.length} questions in detail. Let me gather the information I need first.`);
            replies.push(`Thanks for your questions. I'll take some time to provide complete answers to all ${analysis.questions.length} points you raised.`);
          }
        } else if (analysis.actionItems.length > 0) {
          // Action item handling
          const actionSample = analysis.actionItems.length > 0 ? analysis.actionItems[0] : '';
          const shortAction = actionSample.length > 35 
            ? actionSample.substring(0, 35) + '...' 
            : actionSample;
            
          replies.push(`I'll take care of your request${analysis.actionItems.length > 1 ? 's' : ''} promptly and provide an update when complete.`);
          
          if (analysis.actionItems.length === 1) {
            replies.push(`I'll handle the ${shortAction.replace(/^please\s+/i, '')} and let you know when it's done.`);
          } else {
            replies.push(`I've noted all ${analysis.actionItems.length} action items and will begin working on them immediately.`);
          }
        }
        break;
        
      case 'meeting':
        // Meeting scheduling with specific details
        if (analysis.deadlines.length > 0) {
          // There's a suggested time
          const meetingTime = analysis.deadlines[0].text
            .replace(/^(by|due|deadline[:\s]+|no later than|before|complete by)/i, '')
            .trim();
            
          replies.push(`I'm available for the meeting${meetingTime ? ` on ${meetingTime}` : ''}. I've added it to my calendar.`);
          replies.push(`The meeting time${meetingTime ? ` (${meetingTime})` : ''} works for me. Looking forward to our discussion.`);
        } else {
          // No specific time mentioned
          replies.push(`I'd be happy to meet. Would Monday at 2pm or Tuesday at 10am work for you?`);
          replies.push(`Yes, let's schedule a meeting. I'm available most mornings this week, or Friday afternoon.`);
          replies.push(`I'd welcome the opportunity to discuss this. Please suggest a few times that work for you.`);
        }
        break;
        
      case 'followUp':
        // Follow-up responses with context awareness
        replies.push(`Thanks for following up. I'm still working on this and will have an update for you by tomorrow.`);
        replies.push(`I appreciate the reminder. I'll prioritize this and get back to you with a status update today.`);
        
        if (analysis.previousEmailReferences.length > 0) {
          const reference = analysis.previousEmailReferences[0];
          replies.push(`Regarding our previous ${reference}, I've made progress and will share the details shortly.`);
        }
        break;
        
      case 'introduction':
        // Introduction responses
        replies.push(`It's great to connect with you! I'd be happy to schedule some time to discuss how we might work together.`);
        replies.push(`Thank you for reaching out. Your background is impressive, and I'd be interested in exploring potential collaboration.`);
        replies.push(`I appreciate the introduction. I'd welcome the opportunity to learn more about your work and discuss areas of mutual interest.`);
        break;
        
      case 'information':
        // Information sharing responses
        if (analysis.hasAttachments) {
          replies.push(`Thank you for sharing this information and the attached documents. I'll review them promptly.`);
        } else {
          replies.push(`I appreciate you keeping me informed. This information is helpful for our ongoing work.`);
        }
        
        if (analysis.sentiment.tone === 'positive') {
          replies.push(`Great news! Thank you for the update. I'm pleased to hear about the progress.`);
        } else if (analysis.sentiment.tone === 'negative') {
          replies.push(`Thank you for bringing this to my attention. I understand the challenges and will consider how we might address them.`);
        } else {
          replies.push(`Thanks for sharing this information. I've noted the details and will keep them in mind going forward.`);
        }
        break;
    }
    
    // Add urgency-appropriate responses
    if (analysis.urgency === 'high' && replies.length < 3) {
      replies.push(`I understand this is urgent. I'll address it immediately and get back to you within the next few hours.`);
      replies.push(`This has my immediate attention. I'll prioritize it and respond as soon as possible.`);
    }
    
    // Add deadline acknowledgment if applicable
    if (analysis.deadlines.length > 0 && replies.length < 3) {
      const deadline = analysis.deadlines[0].text
        .replace(/^(by|due|deadline[:\s]+|no later than|before|complete by)/i, '')
        .trim();
        
      replies.push(`I've noted the ${deadline} deadline and will ensure everything is completed on time.`);
    }
    
    // Add sentiment-appropriate responses if needed
    if (replies.length < 3) {
      if (analysis.sentiment.tone === 'positive' && analysis.sentiment.confidence > 0.6) {
        replies.push(`Thanks for your positive message! I'll respond with more details shortly.`);
      } else if (analysis.sentiment.tone === 'negative' && analysis.sentiment.confidence > 0.6) {
        replies.push(`I understand your concerns and will address them thoughtfully in my response.`);
      }
    }
    
    // Add formality-appropriate responses if needed
    if (replies.length < 3) {
      if (analysis.formality === 'formal') {
        replies.push(`Thank you for your correspondence. I will review the matter thoroughly and respond in kind.`);
      } else if (analysis.formality === 'casual') {
        replies.push(`Thanks for your note! I'll get back to you with more info soon.`);
      }
    }
    
    // Ensure we have at least 3 replies
    const defaultReplies = [
      "Thank you for your email. I'll review this and respond in detail shortly.",
      "I appreciate you reaching out. I'll get back to you on this as soon as possible.",
      "Thanks for your message. I'll make this a priority and respond soon."
    ];
    
    while (replies.length < 3) {
      const nextDefault = defaultReplies[replies.length % defaultReplies.length];
      if (!replies.includes(nextDefault)) {
        replies.push(nextDefault);
      } else {
        // If we've used all defaults, create variations
        replies.push(`Thank you for your email. I'll respond to you by ${analysis.urgency === 'high' ? 'end of day' : 'tomorrow'}.`);
      }
    }
    
    // Make sure we don't have duplicates and don't return more than 3
    replies = [...new Set(replies)].slice(0, 3);
    
    return replies;
  } catch (error) {
    console.error('Error generating smart replies:', error);
    throw new Error('Unable to generate smart replies');
  }
};

/**
 * Summarize an email briefly
 */
export const summarizeEmailBriefly = async (emailContent: string): Promise<string> => {
  try {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // In a real implementation, this would call an actual AI model with the prompt
    // For this demo, we'll simulate different responses based on the content
    const prompt = "Summarize this email clearly and professionally for a human reader. Focus only on the visible text content and ignore all code, images, CSS, HTML tags, or layout instructions. Do not include any media references, style properties, or technical markup. Your summary should read like a note that explains what the email is about.";
    
    // Generate summary based on content patterns
    let summary = "";
    
    if (emailContent.match(/meeting|schedule|appointment|call/i)) {
      summary = "Meeting scheduled for next Tuesday at 2pm to discuss Q3 planning. You need to prepare a brief overview of your department's progress.";
    } else if (emailContent.match(/proposal|budget|cost|price/i)) {
      summary = "New project proposal with $15k budget needs your approval by Friday. Main costs are for additional developer resources.";
    } else if (emailContent.match(/deadline|timeline|delay/i)) {
      summary = "Project deadline extended to Oct 30th due to technical issues. Team needs your input on revised milestones by tomorrow.";
    } else if (emailContent.match(/report|performance|metrics|results/i)) {
      summary = "Q2 performance exceeded targets by 12%. Sales in western region underperforming - meeting scheduled to discuss strategy changes.";
    } else if (emailContent.match(/issue|problem|error|fix/i)) {
      summary = "Critical server issue resolved. Outage lasted 45 mins. Post-mortem scheduled for Thursday, your attendance requested.";
    } else {
      summary = "Team announced new software release for next week. You need to test your integration by Friday and report any issues.";
    }
    
    return summary;
  } catch (error) {
    console.error('Error summarizing email:', error);
    throw new Error('Unable to summarize email');
  }
};

/**
 * Prioritize an email based on content analysis
 */
export const prioritizeEmail = async (emailContent: string): Promise<{
  priority: 'High' | 'Medium' | 'Low';
  justification: string;
}> => {
  try {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 900));
    
    // Default result
    let result = {
      priority: 'Medium' as 'High' | 'Medium' | 'Low',
      justification: "Standard business communication with no urgent elements."
    };
    
    // Check for high priority indicators
    if (emailContent.match(/urgent|asap|emergency|immediate|critical|deadline today/i)) {
      result = {
        priority: 'High',
        justification: "Contains urgent language and time-sensitive requests requiring immediate attention."
      };
    }
    // Check for low priority indicators
    else if (emailContent.match(/fyi|newsletter|announcement|heads up|no action required/i)) {
      result = {
        priority: 'Low',
        justification: "Informational content with no action required or time sensitivity."
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error prioritizing email:', error);
    throw new Error('Unable to prioritize email');
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
  generateTextCompletion,
  generateSmartReplies,
  summarizeEmailBriefly,
  prioritizeEmail
};