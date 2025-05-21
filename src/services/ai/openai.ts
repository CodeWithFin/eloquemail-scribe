import OpenAI from 'openai';
import { EmailDraft } from '../gmail/types';

// Get OpenAI client with the current API key from localStorage
const getOpenAIClient = () => {
  const apiKey = localStorage.getItem('openai_api_key') || '';
  const aiEnabled = localStorage.getItem('ai_features_enabled') === 'true';
  
  if (!apiKey || !aiEnabled) {
    throw new Error('OpenAI API key not set or AI features are disabled. Please configure in Settings.');
  }
  
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true // Allow client-side usage (for development)
  });
};

/**
 * Grammar and style corrections for email content
 */
export const improveEmailText = async (text: string): Promise<string> => {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an email assistant that improves grammar, clarity, and professionalism of email text. Keep the same meaning and tone, just make it better written.'
        },
        {
          role: 'user',
          content: `Improve this email text: "${text}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0]?.message?.content || text;
  } catch (error) {
    console.error('Error improving email text:', error);
    return text; // Return original text if there's an error
  }
};

/**
 * Generate subject line based on email content
 */
export const generateSubjectLine = async (emailBody: string): Promise<string> => {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an assistant that generates concise, effective email subject lines based on email content. The subject should be less than 50 characters.'
        },
        {
          role: 'user',
          content: `Generate a subject line for this email: "${emailBody}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 50
    });

    return response.choices[0]?.message?.content?.replace(/"/g, '') || 'Email Subject';
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
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: "Summarize this email clearly and professionally for a human reader. Focus only on the visible text content and ignore all code, images, CSS, HTML tags, or layout instructions. Do not include any media references, style properties, or technical markup. Your summary should read like a note that explains what the email is about."
        },
        {
          role: 'user',
          content: `Summarize this email thread: "${threadContent}"`
        }
      ],
      temperature: 0.5,
      max_tokens: 300
    });

    return response.choices[0]?.message?.content || 'No summary available';
  } catch (error) {
    console.error('Error summarizing email thread:', error);
    return 'Unable to generate summary';
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
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an email assistant that rewrites emails to sound more ${tone}. Maintain the original meaning and key points.`
        },
        {
          role: 'user',
          content: `Rewrite this email to sound more ${tone}: "${text}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0]?.message?.content || text;
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
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an assistant that generates three different appropriate reply options for an email.

When generating replies:
1. Analyze the email to identify specific questions, requests, deadlines, and sentiment
2. Create contextually relevant replies that address the content of the original email
3. Vary the replies in tone and approach (e.g., one more formal, one more casual, one more direct)
4. Make each reply brief (1-2 sentences) but specific to the email content
5. Include explicit references to details from the email to show comprehension
6. For emails with questions, directly acknowledge the question in your response
7. For emails with action requests, indicate your intention to address them
8. For emails with deadlines, acknowledge the timeline

Each reply should be able to stand alone as a complete response.`
        },
        {
          role: 'user',
          content: `Generate three contextually-relevant reply options for this email: "${emailContent}"`
        }
      ],
      temperature: 0.8,
      max_tokens: 400
    });

    const content = response.choices[0]?.message?.content || '';
    // Split by numbered options or line breaks to get separate replies
    const options = content.split(/\d+\.\s+/).filter(Boolean);
    return options.length >= 2 ? options : ["I'll look into this.", "Thanks for your email.", "Let me get back to you soon."];
  } catch (error) {
    console.error('Error generating reply options:', error);
    return ["I'll look into this.", "Thanks for your email.", "Let me get back to you soon."];
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
    const openai = getOpenAIClient();
    
    const defaultOptions = {
      tone: 'friendly' as const,
      length: 'medium' as const,
      includeIntro: true,
      includeOutro: true,
      context: ''
    };
    
    const settings = { ...defaultOptions, ...options };
    
    let systemPrompt = `You are an email assistant that generates complete, contextually appropriate email replies.
Your task is to generate a ${settings.length} length, ${settings.tone} tone response to the email.

The response should directly address:
1. Each specific question asked in the original email 
2. Each action item requested of the recipient
3. Any deadlines mentioned

When generating the reply:
- Include specific details from the original email to demonstrate comprehension
- Maintain appropriate professional tone, tailored to the formality level of the original email
- Structure paragraphs to address one main point each
- Use specific language rather than generic phrases`;
    
    if (settings.includeIntro) {
      systemPrompt += "\n- Include an appropriate greeting based on the relationship context";
    }
    
    if (settings.includeOutro) {
      systemPrompt += "\n- Include an appropriate signature line consistent with the tone";
    }
    
    systemPrompt += "\n\nThe reply should sound natural, professional, and specifically address the content of the original email rather than being generic.";
    
    let userPrompt = `Generate a reply to this email. Extract questions, action items, deadlines, and sentiment, and respond appropriately to each:\n\n"${emailContent}"`;
    
    if (settings.context) {
      userPrompt += `\n\nAdditional context to include in the reply: ${settings.context}`;
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: settings.length === 'short' ? 200 : (settings.length === 'medium' ? 400 : 600)
    });

    return response.choices[0]?.message?.content || "I'll get back to you soon.";
  } catch (error) {
    console.error('Error generating email reply:', error);
    return "I'll get back to you soon.";
  }
};

/**
 * Analyze email sentiment and key points
 */
export const analyzeEmail = async (emailContent: string): Promise<{
  sender: { name?: string; email: string; company?: string },
  subject: string,
  intent: 'request' | 'information' | 'followUp' | 'introduction' | 'meeting',
  sentiment: 'positive' | 'negative' | 'neutral',
  formality: 'casual' | 'neutral' | 'formal',
  questions: string[],
  actionItems: string[],
  deadlines: Array<{ text: string; date: string; isPriority: boolean }>,
  keyPoints: string[],
  urgency: 'low' | 'medium' | 'high',
  hasAttachments: boolean
}> => {
  try {
    const openai = getOpenAIClient();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Analyze the email and extract the following information in a JSON format:
- sender: an object containing name (if present), email (if present), and company (if present)
- subject: the email subject if present, or a generated subject based on content
- intent: the primary intent (request, information, followUp, introduction, meeting)
- sentiment: the overall tone of the email (positive, negative, or neutral)
- formality: the level of formality (casual, neutral, formal)
- questions: an array of explicit and implicit questions that need responses
- actionItems: an array of any action items or requests in the email
- deadlines: an array of objects, each with text (the deadline as mentioned), date (in ISO format or "unknown"), and isPriority (boolean)
- keyPoints: an array of 2-5 key points from the email
- urgency: how urgent the email seems (low, medium, or high)
- hasAttachments: boolean indicating if attachments are mentioned

Be thorough in your analysis, looking for both explicit and implicit elements.`
        },
        {
          role: 'user',
          content: `Analyze this email: "${emailContent}"`
        }
      ],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: "json_object" }
    });

    const analysisText = response.choices[0]?.message?.content || '{}';
    const analysis = JSON.parse(analysisText);
    
    return {
      sender: analysis.sender || { email: 'unknown@email.com' },
      subject: analysis.subject || 'No subject',
      intent: analysis.intent || 'information',
      sentiment: analysis.sentiment || 'neutral',
      formality: analysis.formality || 'neutral',
      questions: analysis.questions || [],
      actionItems: analysis.actionItems || [],
      deadlines: analysis.deadlines || [],
      keyPoints: analysis.keyPoints || [],
      urgency: analysis.urgency || 'low',
      hasAttachments: analysis.hasAttachments || false
    };
  } catch (error) {
    console.error('Error analyzing email:', error);
    return {
      sender: { email: 'unknown@email.com' },
      subject: 'Error Processing Email',
      intent: 'information',
      sentiment: 'neutral',
      formality: 'neutral',
      questions: [],
      actionItems: [],
      deadlines: [],
      keyPoints: [],
      urgency: 'low',
      hasAttachments: false
    };
  }
};

export default {
  improveEmailText,
  generateSubjectLine,
  summarizeEmailThread,
  adjustEmailTone,
  generateReplyOptions,
  generateFullReply,
  analyzeEmail
}; 