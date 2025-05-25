import { type EmailAnalysis, type EmailGenerationOptions, type GeneratedReply } from './types';
import { parseEmailContent, analyzeEmailContent } from './emailAnalysis';

const CONFIDENCE_THRESHOLDS = {
  LOW: 0.6,
  MEDIUM: 0.8,
  HIGH: 0.95
};

export async function generateEmailReply(
  emailContent: string,
  options: EmailGenerationOptions
): Promise<GeneratedReply> {
  // Parse and analyze the email
  const parsedEmail = parseEmailContent(emailContent);
  const analysis = analyzeEmailContent(parsedEmail);
  
  // Determine if human review is needed
  const requiresHumanReview = shouldRequireHumanReview(analysis);
  
  // Generate the response components
  const greeting = generateGreeting(analysis, options);
  const acknowledgment = generateAcknowledgment(analysis);
  const mainResponse = generateMainResponse(analysis, options);
  const actionItemsResponse = options.includeActionItems ? generateActionItemsResponse(analysis) : '';
  const deadlinesConfirmation = options.includeDeadlines ? generateDeadlinesConfirmation(analysis) : '';
  const closing = generateClosing(analysis, options);
  
  // Combine all components
  const replyText = [
    greeting,
    acknowledgment,
    mainResponse,
    actionItemsResponse,
    deadlinesConfirmation,
    closing
  ].filter(Boolean).join('\n\n').trim();
  
  // Calculate confidence score
  const confidence = calculateConfidenceScore(analysis, replyText);
  
  return {
    text: replyText,
    metadata: {
      questionsAddressed: analysis.questions,
      actionItemsIncluded: analysis.actionItems,
      deadlinesReferenced: analysis.deadlines,
      confidence,
      requiresHumanReview,
      reviewReason: requiresHumanReview ? determineReviewReason(analysis) : undefined
    }
  };
}

function shouldRequireHumanReview(analysis: EmailAnalysis): boolean {
  return (
    analysis.urgency === 'high' ||
    analysis.sentiment.tone === 'negative' ||
    analysis.questions.length > 3 ||
    analysis.actionItems.length > 3 ||
    /complaint|escalate|supervisor|manager|urgent|immediate/i.test(analysis.subject)
  );
}

function determineReviewReason(analysis: EmailAnalysis): string {
  if (analysis.urgency === 'high') return 'High urgency email requires human attention';
  if (analysis.sentiment.tone === 'negative') return 'Negative sentiment detected';
  if (analysis.questions.length > 3) return 'Complex email with multiple questions';
  if (analysis.actionItems.length > 3) return 'Multiple action items need verification';
  return 'Content requires human judgment';
}

function generateGreeting(analysis: EmailAnalysis, options: EmailGenerationOptions): string {
  if (!options.includeIntro) return '';

  const senderName = analysis.sender.name?.split(' ')[0] || '';
  
  if (options.tone === 'formal') {
    return `Dear ${senderName || 'Sir/Madam'}`;
  }
  
  if (options.tone === 'persuasive') {
    return `Dear ${senderName || 'Colleague'}`;
  }
  
  return `Hi ${senderName || 'there'}`;
}

function generateAcknowledgment(analysis: EmailAnalysis): string {
  const phrases = {
    request: 'Thank you for your request regarding',
    information: 'Thank you for sharing the information about',
    followUp: 'Thank you for following up on',
    introduction: 'Thank you for reaching out regarding',
    meeting: 'Thank you for suggesting a meeting about'
  };

  return `${phrases[analysis.intent]} ${analysis.subject}`;
}

function generateMainResponse(analysis: EmailAnalysis, options: EmailGenerationOptions): string {
  let response = '';
  
  // Address questions if present
  if (analysis.questions.length > 0) {
    response = generateQuestionResponses({
      questions: analysis.questions,
      responseSettings: {
        tone: options.tone,
        length: options.length
      }
    });
  }
  
  // Add context-specific response based on intent
  switch (analysis.intent) {
    case 'request':
      response += generateRequestResponse(analysis, options);
      break;
    case 'meeting':
      response += generateMeetingResponse({
        proposedTimes: ['tomorrow at 2pm'], // Sample proposed time
        meetingPurpose: analysis.subject,
        responseSettings: {
          tone: options.tone,
          length: options.length
        }
      });
      break;
    case 'followUp':
      response += generateFollowUpResponse({
        context: analysis.subject,
        status: 'in-progress',
        responseSettings: {
          tone: options.tone,
          length: options.length
        }
      });
      break;
    default:
      response += generateDefaultResponse(analysis, options);
  }
  
  return response;
}

export function generateQuestionResponses(
  params: {
    questions: string[];
    responseSettings: {
      tone: string;
      length: string;
    }
  }
): string {
  if (params.questions.length === 0) return '';
  
  const questions = params.questions;
  const options = {
    tone: params.responseSettings.tone,
    length: params.responseSettings.length
  } as EmailGenerationOptions;
  
  let responses = '';
  
  // Different formats based on length setting
  if (options.length === 'short') {
    // Brief answers for short replies
    responses = questions.map(q => {
      // Extract key terms for concise responses
      const keyTerms = q.toLowerCase()
        .replace(/[?.!,]/g, '')
        .split(' ')
        .filter(word => word.length > 3)
        .slice(0, 3)
        .join(' ');
      
      return `Regarding your question about ${keyTerms}: I'll provide a brief answer here.`;
    }).join('\n\n');
  } else if (options.length === 'medium') {
    // More detailed responses for medium length
    responses = 'To address your questions:\n\n' + 
      questions.map((q, i) => {
        return `${i+1}. ${q}\n   Based on the information available, the answer is [detailed response would be generated here].`;
      }).join('\n\n');
  } else {
    // Comprehensive answers for long replies
    responses = 'I\'d like to address each of your questions in detail:\n\n' +
      questions.map((q, i) => {
        return `**Question ${i+1}: ${q}**\n\nAfter reviewing the details, I can provide the following answer: [comprehensive response with contextual information would be generated here].\n`;
      }).join('\n\n');
  }
  
  return responses;
}

function generateRequestResponse(analysis: EmailAnalysis, options: EmailGenerationOptions): string {
  const { urgency } = analysis;
  
  if (urgency === 'high') {
    return 'I understand the urgency of your request and will prioritize this immediately.';
  }
  
  if (urgency === 'medium') {
    return 'I will look into your request and get back to you as soon as possible.';
  }
  
  return 'I will review your request and respond with more details shortly.';
}

export function generateMeetingResponse(
  params: {
    proposedTimes: string[];
    meetingPurpose: string;
    responseSettings: {
      tone: string;
      length: string;
    }
  }
): string {
  const options = {
    tone: params.responseSettings.tone || 'friendly',
    length: params.responseSettings.length || 'medium'
  } as EmailGenerationOptions;

  const toneResponses = {
    formal: "I would be pleased to schedule a meeting to discuss this matter.",
    friendly: "I'd be happy to meet and chat about this!",
    assertive: "Let's set up a meeting to discuss this further.",
    concise: "Available to meet: ",
    persuasive: "Meeting to discuss this would be beneficial for both of us."
  };
  
  // Generate sample availability based on next business days
  const today = new Date();
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeslots = ['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM', '4:30 PM'];
  
  // Get the next 3 business days (excluding weekends)
  const availabilityDays = [];
  let daysAdded = 0;
  let dayToAdd = 1;
  
  while (daysAdded < 3) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + dayToAdd);
    const weekday = nextDate.getDay();
    
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (weekday !== 0 && weekday !== 6) {
      availabilityDays.push(daysOfWeek[weekday]);
      daysAdded++;
    }
    
    dayToAdd++;
  }
  
  // Sample availability text based on the response length
  let availabilityText = '';
  
  if (options.length === 'short') {
    // Just offer a couple of specific slots
    availabilityText = `${availabilityDays[0]} at ${timeslots[1]} or ${availabilityDays[1]} at ${timeslots[3]}`;
  } else if (options.length === 'medium') {
    // Offer multiple options on different days
    availabilityText = `${availabilityDays[0]} (${timeslots[0]} or ${timeslots[2]}), ${availabilityDays[1]} (${timeslots[1]} or ${timeslots[3]}), or ${availabilityDays[2]} (${timeslots[0]} or ${timeslots[4]})`;
  } else {
    // Comprehensive availability
    availabilityText = `\n- ${availabilityDays[0]}: ${timeslots[0]}, ${timeslots[1]}, or ${timeslots[3]}\n- ${availabilityDays[1]}: ${timeslots[0]}, ${timeslots[2]}, or ${timeslots[4]}\n- ${availabilityDays[2]}: Any time between ${timeslots[0]} and ${timeslots[4]}`;
  }
  
  return `${toneResponses[options.tone]} I'm available ${availabilityText}. Please let me know what works best for you, or suggest alternative times if these don't work.`;
}

export function generateFollowUpResponse(
  params: {
    context: string;
    status: string;
    responseSettings: {
      tone: string;
      length: string;
    }
  }
): string {
  const options = {
    tone: params.responseSettings.tone || 'friendly',
    length: params.responseSettings.length || 'medium'
  } as EmailGenerationOptions;
  
  const status = {
    formal: "I can provide the following status update regarding your inquiry:",
    friendly: "Here's where we stand on this:",
    assertive: "The current status is as follows:",
    concise: "Status update:",
    persuasive: "I'm pleased to share the following progress on this matter:"
  };
  
  // Generate different types of status updates based on the tone and length
  let details = '';
  
  if (options.length === 'short') {
    details = 'I\'ve made progress on this matter and anticipate completing it by [specific date].';
  } else if (options.length === 'medium') {
    details = 'I\'ve completed [X]% of the requested work. The remaining tasks are [list tasks] and I expect to finish by [specific date]. Please let me know if you need any interim updates.';
  } else {
    details = 'Since your last inquiry, I\'ve made the following progress:\n\n' +
      '1. Completed [task A] on [date]\n' +
      '2. Started working on [task B] and have reached [milestone]\n' +
      '3. Scheduled [task C] for [future date]\n\n' +
      'The anticipated completion date remains [specific date]. If there are any changes to this timeline, I\'ll inform you immediately.';
  }
  
  return `${status[options.tone]} ${details}`;
}

function generateDefaultResponse(analysis: EmailAnalysis, options: EmailGenerationOptions): string {
  const toneResponses = {
    formal: "I have reviewed the information you provided and will take appropriate action.",
    friendly: "Thanks for sharing this info! I'll keep it in mind.",
    assertive: "I've noted this information and will proceed accordingly.",
    concise: "Information received and noted.",
    persuasive: "The information you've shared is valuable and will help us move forward effectively."
  };
  
  return toneResponses[options.tone];
}

function generateActionItemsResponse(analysis: EmailAnalysis): string {
  if (analysis.actionItems.length === 0) return '';
  
  const items = analysis.actionItems.map(item => `- ${item}`).join('\n');
  return `I will take care of the following action items:\n${items}`;
}

function generateDeadlinesConfirmation(analysis: EmailAnalysis): string {
  if (analysis.deadlines.length === 0) return '';
  
  const deadlines = analysis.deadlines
    .map(d => d.date ? `by ${d.date.toLocaleDateString()}` : d.text)
    .join(' and ');
  
  return `I confirm that I will complete the requested items ${deadlines}`;
}

function generateClosing(analysis: EmailAnalysis, options: EmailGenerationOptions): string {
  if (!options.includeOutro) return '';

  const closings = {
    formal: 'Best regards',
    friendly: 'Best wishes',
    assertive: 'Looking forward to your response',
    concise: 'Thanks',
    persuasive: 'Thank you for your consideration'
  };

  return `${closings[options.tone]},\n[Your name]`;
}

function calculateConfidenceScore(analysis: EmailAnalysis, generatedReply: string): number {
  let score = 1.0;
  
  // Reduce confidence based on complexity
  if (analysis.questions.length > 2) score *= 0.9;
  if (analysis.actionItems.length > 2) score *= 0.9;
  if (analysis.deadlines.length > 1) score *= 0.9;
  if (analysis.urgency === 'high') score *= 0.8;
  if (analysis.sentiment.tone === 'negative') score *= 0.7;
  
  // Ensure we've addressed all questions and action items
  const replyLower = generatedReply.toLowerCase();
  const unaddressedQuestions = analysis.questions.filter(q => 
    !replyLower.includes(q.toLowerCase().replace(/[?.,]/g, ''))
  );
  if (unaddressedQuestions.length > 0) score *= 0.8;
  
  const unaddressedActions = analysis.actionItems.filter(a =>
    !replyLower.includes(a.toLowerCase().replace(/[.,]/g, ''))
  );
  if (unaddressedActions.length > 0) score *= 0.8;
  
  return Math.min(Math.max(score, 0), 1);
}
