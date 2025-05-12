import OpenAI from 'openai';
import { EmailDraft } from '../gmail/types';

// Initialize OpenAI client - API key will be passed from environment variables
// or can be set explicitly for development
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true // Allow client-side usage (for development)
});

/**
 * Grammar and style corrections for email content
 */
export const improveEmailText = async (text: string): Promise<string> => {
  try {
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
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an assistant that summarizes email threads into concise bullet points. Highlight key information, action items, and decisions made.'
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
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an assistant that generates three different appropriate reply options for an email. Make each reply brief (1-2 sentences) and vary them in tone and response type.'
        },
        {
          role: 'user',
          content: `Generate three reply options for this email: "${emailContent}"`
        }
      ],
      temperature: 0.8,
      max_tokens: 300
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

export default {
  improveEmailText,
  generateSubjectLine,
  summarizeEmailThread,
  adjustEmailTone,
  generateReplyOptions
}; 