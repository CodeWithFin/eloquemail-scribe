import { type EmailAnalysis } from './types';

interface ParsedEmail {
  sender: {
    name?: string;
    email: string;
  };
  subject: string;
  body: string;
  timestamp: Date;
  hasAttachments: boolean;
}

export function parseEmailContent(emailContent: string): ParsedEmail {
  // Input validation
  if (!emailContent || typeof emailContent !== 'string') {
    return {
      sender: {
        email: 'unknown@example.com',
      },
      subject: '',
      body: '',
      timestamp: new Date(),
      hasAttachments: false
    };
  }

  // Clean up input
  const cleanContent = emailContent
    .replace(/\r\n/g, '\n')  // Normalize line endings
    .replace(/^\s+|\s+$/gm, '') // Trim whitespace
    .replace(/\n{3,}/g, '\n\n'); // Normalize multiple newlines

  // Extract components with improved regex patterns
  const senderPattern = /(?:From|Sender):\s*(?:(?:"?([^"<]+)"?\s*)?(?:<([^>]+)>|([^\s,]+@[^\s,]+)))/i;
  const subjectPattern = /(?:Subject|Re|Fwd):\s*(.+?)(?:\n|$)/i;
  const timestampPattern = /(?:Date|Sent|Received):\s*(.+?)(?:\n|$)/i;
  const attachmentPattern = /(?:attached|attachment|enclosed|file|\.(?:doc|pdf|xls|zip|jpg|png))/i;

  // Extract sender info with fallback
  const senderMatch = cleanContent.match(senderPattern);
  const senderName = senderMatch?.[1]?.trim();
  const senderEmail = (senderMatch?.[2] || senderMatch?.[3] || 'unknown@example.com').trim();

  // Extract subject with cleanup
  const subjectMatch = cleanContent.match(subjectPattern);
  let subject = subjectMatch?.[1]?.trim() || '';
  // Remove Re: and Fwd: prefixes from subject
  subject = subject.replace(/^(?:Re|Fwd):\s*/i, '');

  // Extract timestamp
  const timestampMatch = cleanContent.match(timestampPattern);
  let timestamp: Date;
  try {
    timestamp = timestampMatch ? new Date(timestampMatch[1]) : new Date();
    // Validate timestamp
    if (isNaN(timestamp.getTime())) {
      timestamp = new Date();
    }
  } catch {
    timestamp = new Date();
  }

  // Extract body with better header/footer handling
  const bodyParts = cleanContent.split(/\n\s*\n/);
  let body = bodyParts.length > 1 ? bodyParts.slice(1).join('\n\n') : cleanContent;
  
  // Remove common email footers and signatures
  body = body
    .replace(/(?:\n-{2,}|\n_{2,})[\s\S]*$/m, '') // Remove signature block
    .replace(/(?:Best|Kind|Regards|Sincerely|Thank you)[\s\S]*$/mi, '') // Remove common endings
    .trim();

  return {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    subject,
    body,
    timestamp,
    hasAttachments: attachmentPattern.test(cleanContent)
  };
}

export function analyzeEmailContent(parsedEmail: ParsedEmail): EmailAnalysis {
  // Analyze primary intent with improved patterns
  const intentPatterns = {
    request: /(could you|would you|can you|please|help|assist|need|wondering if|requesting|appreciate if)/i,
    information: /(fyi|just to let you know|wanted to share|for your information|update on|informing you|wanted to inform)/i,
    followUp: /(following up|checking in|status|update|progress|any news|getting back|circling back|reminder about)/i,
    introduction: /(nice to meet|introducing|wanted to introduce|pleasure to meet|let me introduce|connecting you|wanted to connect)/i,
    meeting: /(schedule|meet|discuss|call|conference|zoom|teams|chat|sync|catch up|meeting|appointment)/i
  };

  // Extract questions (sentences ending with question mark)
  const questions = parsedEmail.body
    .match(/[^.!?\n]+\?/g)
    ?.map(q => q.trim()) || [];

  // Extract action items
  const actionItems = extractActionItems(parsedEmail.body);

  // Analyze deadlines
  const deadlines = extractDeadlines(parsedEmail.body);

  // Determine urgency level
  const urgencyLevel = determineUrgency(parsedEmail.body, deadlines);

  // Analyze sentiment and tone
  const sentiment = analyzeSentiment(parsedEmail.body);

  // Determine primary intent with improved multiple intent detection
  let primaryIntent: EmailAnalysis['intent'] = 'information';
  let maxMatchCount = 0;

  for (const [intent, pattern] of Object.entries(intentPatterns)) {
    const matches = parsedEmail.body.match(new RegExp(pattern, 'g')) || [];
    if (matches.length > maxMatchCount) {
      maxMatchCount = matches.length;
      primaryIntent = intent as EmailAnalysis['intent'];
    }
  }

  // Calculate overall confidence and review requirements
  const confidenceFactors = {
    hasSubject: parsedEmail.subject.length > 0 ? 0.2 : 0,
    hasSender: parsedEmail.sender.email !== 'unknown@example.com' ? 0.2 : 0,
    hasBody: parsedEmail.body.length > 0 ? 0.2 : 0,
    hasQuestions: questions.length > 0 ? 0.1 : 0,
    hasDeadlines: deadlines.length > 0 ? 0.1 : 0,
    hasActionItems: actionItems.length > 0 ? 0.1 : 0,
    clearIntent: maxMatchCount > 0 ? 0.1 : 0
  };

  const overallConfidence = Object.values(confidenceFactors).reduce((sum, score) => sum + score, 0);
  
  // Determine if human review is needed based on specific criteria
  const requiresHumanReview = 
    urgencyLevel === 'high' ||
    sentiment.tone === 'negative' ||
    questions.length > 3 ||
    actionItems.length > 3 ||
    overallConfidence < 0.4;

  let reviewReason: string | undefined;
  if (requiresHumanReview) {
    if (urgencyLevel === 'high') reviewReason = 'High urgency email requires attention';
    else if (sentiment.tone === 'negative') reviewReason = 'Negative sentiment detected';
    else if (questions.length > 3) reviewReason = 'Complex email with multiple questions';
    else if (actionItems.length > 3) reviewReason = 'Multiple action items need verification';
    else if (overallConfidence < 0.4) reviewReason = 'Low confidence in analysis';
  }

  return {
    sender: parsedEmail.sender,
    subject: parsedEmail.subject,
    intent: primaryIntent,
    questions,
    actionItems,
    deadlines,
    urgency: urgencyLevel,
    sentiment,
    hasAttachments: parsedEmail.hasAttachments,
    timestamp: parsedEmail.timestamp,
    metadata: {
      confidence: overallConfidence,
      requiresHumanReview,
      reviewReason
    }
  };
}

function extractActionItems(text: string): string[] {
  const actionPatterns = [
    // Direct requests
    /(?:please|kindly|could you|would you|can you)\s+([^.!?\n]+[.!?])/gi,
    // Tasks with deadlines
    /(?:need|must|should|have to)\s+([^.!?\n]+?(?:by|before|due)\s+[^.!?\n]+[.!?])/gi,
    // Action verbs at start of sentence
    /(?:^|\n)(?:review|update|send|prepare|complete|finish|submit|create)\s+([^.!?\n]+[.!?])/gim
  ];

  const actionItems = new Set<string>();
  for (const pattern of actionPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      actionItems.add(match[1]?.trim() || match[0]?.trim());
    }
  }

  return Array.from(actionItems);
}

function extractDeadlines(text: string): Array<{ text: string; date: string }> {
  const deadlinePatterns = [
    // Explicit deadlines
    /(?:due|by|before|deadline)\s+(?:is\s+)?([^.!?\n]+?(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[^.!?\n]*|tomorrow|next\s+(?:week|month)|(?:Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day)[^.!?\n]*[.!?])/gi,
    // Time-sensitive phrases
    /(?:asap|urgent|as soon as possible|immediate|right away)[^.!?\n]*[.!?]/gi
  ];

  const deadlines = new Set<string>();
  for (const pattern of deadlinePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      deadlines.add(match[1]?.trim() || match[0]?.trim());
    }
  }

  return Array.from(deadlines).map(text => ({
    text,
    date: parseDateFromText(text) || 'unknown'
  }));
}

function parseDateFromText(text: string): string | null {
  try {
    const today = new Date();
    const lowerText = text.toLowerCase();
    
    // Handle relative dates
    if (/tomorrow/i.test(text)) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString();
    }

    if (/next\s+week/i.test(text)) {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return nextWeek.toISOString();
    }

    if (/next\s+month/i.test(text)) {
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth.toISOString();
    }

    // Handle days of the week
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayMatch = dayNames.findIndex(day => lowerText.includes(day));
    if (dayMatch !== -1) {
      const targetDate = new Date(today);
      const currentDay = today.getDay();
      const daysToAdd = dayMatch - currentDay + (dayMatch <= currentDay ? 7 : 0);
      targetDate.setDate(today.getDate() + daysToAdd);
      return targetDate.toISOString();
    }

    // Handle specific dates in various formats
    const datePatterns = [
      // Dec 25th, December 25th, 25th Dec, 25th December
      /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?|\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)/i,
      // MM/DD, DD/MM
      /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/,
      // YYYY-MM-DD
      /\b\d{4}-\d{2}-\d{2}\b/
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const dateStr = match[0];
        let date = new Date(dateStr);
        
        // If date is invalid, try parsing with current year
        if (isNaN(date.getTime())) {
          date = new Date(`${dateStr} ${today.getFullYear()}`);
        }

        // If date is still invalid or in the past, try next occurrence
        if (isNaN(date.getTime()) || date < today) {
          date.setFullYear(today.getFullYear() + 1);
        }

        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

function determineUrgency(text: string, deadlines: Array<{ text: string; date: string }>): 'high' | 'medium' | 'low' {
  const urgentPatterns = {
    high: /(urgent|asap|emergency|immediate|critical|right away)/i,
    medium: /(soon|tomorrow|next day|this week)/i
  };

  if (urgentPatterns.high.test(text)) {
    return 'high';
  }

  if (urgentPatterns.medium.test(text) || deadlines.length > 0) {
    return 'medium';
  }

  return 'low';
}

function analyzeSentiment(text: string): {
  tone: 'positive' | 'negative' | 'neutral';
  confidence: number;
} {
  const positiveWords = ['thanks', 'appreciate', 'happy', 'great', 'good', 'excellent', 'pleased'];
  const negativeWords = ['issue', 'problem', 'concerned', 'disappointed', 'urgent', 'error', 'wrong'];

  const words = text.toLowerCase().split(/\W+/);
  let positiveScore = 0;
  let negativeScore = 0;
  let totalWords = words.length;

  for (const word of words) {
    if (positiveWords.includes(word)) positiveScore++;
    if (negativeWords.includes(word)) negativeScore++;
  }

  // Confidence is based on the ratio of sentiment words to total words
  const sentimentWords = positiveScore + negativeScore;
  const confidence = Math.min((sentimentWords / Math.min(totalWords, 100)) * 2, 1); // Cap at 1.0

  return {
    tone: positiveScore > negativeScore ? 'positive' : negativeScore > positiveScore ? 'negative' : 'neutral',
    confidence
  };
}
