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
  
  if (analysis.sentiment.formality === 'formal' || options.tone === 'persuasive') {
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

  return \`\${phrases[analysis.intent]} \${analysis.subject}\`;
}

function generateMainResponse(analysis: EmailAnalysis, options: EmailGenerationOptions): string {
  let response = '';
  
  // Address questions if present
  if (analysis.questions.length > 0) {
    response = generateQuestionResponses(analysis.questions, options);
  }
  
  // Add context-specific response based on intent
  switch (analysis.intent) {
    case 'request':
      response += generateRequestResponse(analysis, options);
      break;
    case 'meeting':
      response += generateMeetingResponse(analysis, options);
      break;
    case 'followUp':
      response += generateFollowUpResponse(analysis, options);
      break;
    default:
      response += generateDefaultResponse(analysis, options);
  }
  
  return response;
}

function generateQuestionResponses(questions: string[], options: EmailGenerationOptions): string {
  // This is a placeholder - in a real implementation, you would use an LLM to generate specific answers
  return questions.map(q => \`Regarding your question "\${q}": [Answer would be generated here]\`).join('\n\n');
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

function generateMeetingResponse(analysis: EmailAnalysis, options: EmailGenerationOptions): string {
  // This would integrate with calendar availability in a real implementation
  return 'I would be happy to meet. I am available [time slots would be inserted here].';
}

function generateFollowUpResponse(analysis: EmailAnalysis, options: EmailGenerationOptions): string {
  return 'I appreciate you following up. Here is the current status: [status would be generated here]';
}

function generateDefaultResponse(analysis: EmailAnalysis, options: EmailGenerationOptions): string {
  return 'I will review this information and respond appropriately.';
}

function generateActionItemsResponse(analysis: EmailAnalysis): string {
  if (analysis.actionItems.length === 0) return '';
  
  const items = analysis.actionItems.map(item => \`- \${item}\`).join('\n');
  return \`I will take care of the following action items:\n\${items}\`;
}

function generateDeadlinesConfirmation(analysis: EmailAnalysis): string {
  if (analysis.deadlines.length === 0) return '';
  
  const deadlines = analysis.deadlines
    .map(d => d.date ? \`by \${d.date.toLocaleDateString()}\` : d.text)
    .join(' and ');
  
  return \`I confirm that I will complete the requested items \${deadlines}\`;
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

  return \`\${closings[options.tone]},\n[Your name]\`;
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
