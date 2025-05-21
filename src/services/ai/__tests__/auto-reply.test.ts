import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateFullReply, generateReplyOptions, generateSmartReplies } from '../gemini';
import { type Deadline } from '../types';

// Helper to convert deadline strings to Date objects
const ensureDeadlineDates = (deadlines: any[]): Deadline[] => {
  return deadlines.map(deadline => ({
    text: deadline.text,
    date: deadline.date instanceof Date ? deadline.date : 
          deadline.date ? new Date(deadline.date) : null
  }));
};

// Mock the DOM API for tests
beforeEach(() => {
  global.document = {
    createElement: () => ({
      innerHTML: '',
      textContent: '',
      innerText: ''
    }),
  } as any;
  
  // Mock setTimeout to speed up tests
  vi.useFakeTimers();
});

afterEach(() => {
  vi.resetAllMocks();
  vi.useRealTimers();
});

// Mock the analyzeEmail function
vi.mock('../gemini', async (importOriginal) => {
  const actual = await importOriginal() as any;
  
  // Only mock the analyzeEmail function
  return {
    ...actual,
    analyzeEmail: vi.fn().mockImplementation((emailContent) => {
      // Simple email analysis mock based on content
      const hasQuestion = emailContent.includes('?');
      const hasPleaseOrCould = emailContent.toLowerCase().includes('please') || 
                                emailContent.toLowerCase().includes('could you');
      const hasDeadline = emailContent.toLowerCase().includes('by') || 
                           emailContent.toLowerCase().includes('due') ||
                           emailContent.toLowerCase().includes('deadline');
      const hasUrgent = emailContent.toLowerCase().includes('urgent') || 
                         emailContent.toLowerCase().includes('asap');
      const hasPositive = emailContent.toLowerCase().includes('thanks') || 
                           emailContent.toLowerCase().includes('appreciate') ||
                           emailContent.toLowerCase().includes('great');
      const hasNegative = emailContent.toLowerCase().includes('disappointed') || 
                           emailContent.toLowerCase().includes('issue') ||
                           emailContent.toLowerCase().includes('problem');
                           
      // Extract questions
      const questions = emailContent.split(/[.!?]/)
        .filter(s => s.trim().endsWith('?'))
        .map(q => q.trim());
        
      // Extract action items
      const actionItems = [];
      if (hasPleaseOrCould) {
        const sentences = emailContent.split(/[.!?]/).map(s => s.trim()).filter(Boolean);
        for (const sentence of sentences) {
          if (sentence.toLowerCase().includes('please') || sentence.toLowerCase().includes('could you')) {
            actionItems.push(sentence);
          }
        }
      }
      
      // Extract deadlines
      const deadlines = [];
      if (hasDeadline) {
        const sentences = emailContent.split(/[.!?]/).map(s => s.trim()).filter(Boolean);
        for (const sentence of sentences) {
          if (sentence.toLowerCase().includes('by') || 
              sentence.toLowerCase().includes('due') ||
              sentence.toLowerCase().includes('deadline')) {
            deadlines.push({ 
              text: sentence, 
              date: new Date(), 
              isPriority: hasUrgent 
            });
          }
        }
      }
      
      return Promise.resolve({
        sender: { 
          name: emailContent.includes('Alex') ? 'Alex Smith' : undefined,
          email: emailContent.includes('@') ? 'test@example.com' : 'unknown@email.com'
        },
        subject: emailContent.includes('Subject:') 
          ? emailContent.split('Subject:')[1].split('\n')[0].trim() 
          : 'Test Subject',
        intent: hasQuestion ? 'request' : (hasDeadline ? 'meeting' : 'information'),
        primaryPurpose: hasQuestion ? 'Asking for information' : 'Sharing information',
        questions,
        actionItems,
        deadlines,
        previousEmailReferences: emailContent.toLowerCase().includes('previous') ? ['previous email'] : [],
        urgency: hasUrgent ? 'high' : (hasDeadline ? 'medium' : 'low'),
        importance: hasUrgent ? 'high' : 'medium',
        formality: emailContent.includes('Dear') ? 'formal' : (emailContent.includes('Hi') ? 'casual' : 'neutral'),
        sentiment: { 
          tone: hasPositive && !hasNegative ? 'positive' : (hasNegative ? 'negative' : 'neutral'),
          confidence: 0.8
        },
        hasAttachments: emailContent.toLowerCase().includes('attach'),
        attachmentReferences: emailContent.toLowerCase().includes('attach') ? ['document'] : [],
        timestamp: new Date(),
        metadata: {
          confidence: 0.85,
          requiresHumanReview: hasUrgent || hasNegative,
          reviewReason: hasUrgent ? 'High urgency' : (hasNegative ? 'Negative sentiment' : undefined),
          relationshipContext: emailContent.includes('colleague') ? 'professional' : 'unknown',
          keyTopics: ['test']
        }
      });
    })
  };
});

describe('Email Auto-Reply Generation', () => {
  it('should generate appropriate full replies for emails with questions', async () => {
    const emailWithQuestions = `
      Hi Team,
      
      I have a question about the project timeline. When do you expect to complete phase 1?
      
      Also, could you clarify the budget allocation for the marketing activities?
      
      Thanks,
      Alex
    `;
    
    // Mock setTimeout to resolve immediately
    vi.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      callback();
      return 0 as any;
    });
    
    const reply = await generateFullReply(emailWithQuestions, {
      tone: 'friendly',
      length: 'medium'
    });
    
    expect(reply.text).toContain('Hi Alex');
    expect(reply.text.toLowerCase()).toContain('project timeline');
    expect(reply.text.toLowerCase()).toContain('phase 1');
    expect(reply.text.toLowerCase()).toContain('budget allocation');
    expect(reply.metadata.questionsAddressed.length).toBeGreaterThanOrEqual(2);
  });
  
  it('should generate replies that acknowledge deadlines', async () => {
    const emailWithDeadlines = `
      Hello,
      
      Please submit the report by Friday, May 24th.
      
      The client needs it urgently for their board meeting.
      
      Best,
      Project Manager
    `;
    
    const reply = await generateFullReply(emailWithDeadlines, {
      tone: 'formal',
      length: 'short'
    });
    
    expect(reply.text.toLowerCase()).toContain('report');
    expect(reply.text.toLowerCase()).toContain('friday');
    expect(reply.text.toLowerCase()).toContain('deadline');
    
    // Ensure deadlines have proper date objects before checking
    const deadlinesWithDateObjects = ensureDeadlineDates(reply.metadata.deadlinesReferenced);
    expect(deadlinesWithDateObjects.length).toBeGreaterThanOrEqual(1);
  });
  
  it('should generate replies that address action items', async () => {
    const emailWithActionItems = `
      Hi team,
      
      Please review the attached document and provide feedback.
      
      Also, could you update the project status in the tracking system?
      
      Thanks,
      Manager
    `;
    
    const reply = await generateFullReply(emailWithActionItems, {
      tone: 'assertive',
      length: 'medium'
    });
    
    expect(reply.text.toLowerCase()).toContain('review');
    expect(reply.text.toLowerCase()).toContain('document');
    expect(reply.text.toLowerCase()).toContain('update');
    expect(reply.text.toLowerCase()).toContain('project status');
    expect(reply.metadata.actionItemsIncluded.length).toBeGreaterThanOrEqual(2);
  });
  
  it('should adjust reply tone based on settings', async () => {
    const basicEmail = `
      Hello,
      
      Just checking in on the project status.
      
      Regards,
      Client
    `;
    
    const formalReply = await generateFullReply(basicEmail, {
      tone: 'formal',
      length: 'medium'
    });
    
    const friendlyReply = await generateFullReply(basicEmail, {
      tone: 'friendly',
      length: 'medium'
    });
    
    const conciseReply = await generateFullReply(basicEmail, {
      tone: 'concise',
      length: 'short'
    });
    
    expect(formalReply.text).toContain('Dear');
    expect(friendlyReply.text).toContain('Hi');
    expect(conciseReply.text.split('\n').length).toBeLessThan(formalReply.text.split('\n').length);
  });
  
  it('should handle complex emails correctly', async () => {
    const complexEmail = `
      From: alex.smith@company.com
      Subject: Project Deadline Extension Request
      
      Dear Team,
      
      I hope this email finds you well. I'm writing regarding the Wilson project deliverables that are due this Friday. 
      
      Due to the unexpected server outage last week that lasted 2 days, our team lost critical development time. Would it be possible to extend the deadline by 3 business days to ensure we can deliver quality work?
      
      Also, could you clarify if the financial projections should be included in the main report or as a separate appendix?
      
      Thanks for your consideration,
      Alex
    `;
    
    const reply = await generateFullReply(complexEmail, {
      tone: 'formal',
      length: 'long'
    });
    
    expect(reply.text.toLowerCase()).toContain('deadline');
    expect(reply.text.toLowerCase()).toContain('extension');
    expect(reply.text.toLowerCase()).toContain('financial projections');
    expect(reply.metadata.questionsAddressed.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Smart Reply Generation', () => {
  it('should generate contextually relevant reply options', async () => {
    const emailContent = `
      Hi,
      
      Can you send me the latest project report?
      
      Thanks,
      Client
    `;
    
    const replies = await generateReplyOptions(emailContent);
    
    expect(replies.length).toBeGreaterThanOrEqual(3);
    expect(replies.some(reply => 
      reply.toLowerCase().includes('report') || 
      reply.toLowerCase().includes('project')
    )).toBeTruthy();
  });
  
  it('should generate smart replies that address questions', async () => {
    const emailContent = `
      Hello,
      
      What's the status on the new feature development?
      
      Best,
      Manager
    `;
    
    const replies = await generateSmartReplies(emailContent);
    
    expect(replies.length).toBeGreaterThanOrEqual(3);
    expect(replies.some(reply => 
      reply.toLowerCase().includes('status') || 
      reply.toLowerCase().includes('feature')
    )).toBeTruthy();
  });
  
  it('should generate smart replies for urgent emails', async () => {
    const urgentEmail = `
      URGENT: Need Status Update
      
      Please provide an immediate update on the server migration.
      
      Thanks,
      IT Director
    `;
    
    const replies = await generateSmartReplies(urgentEmail);
    
    expect(replies.length).toBeGreaterThanOrEqual(3);
    expect(replies.some(reply => 
      reply.toLowerCase().includes('urgent') || 
      reply.toLowerCase().includes('immediate')
    )).toBeTruthy();
  });
  
  it('should generate appropriate meeting-related replies', async () => {
    const meetingEmail = `
      Hi Team,
      
      Would Thursday at 2pm work for a project review meeting?
      
      Thanks,
      Project Manager
    `;
    
    const replies = await generateSmartReplies(meetingEmail);
    
    expect(replies.length).toBeGreaterThanOrEqual(3);
    expect(replies.some(reply => 
      reply.toLowerCase().includes('thursday') || 
      reply.toLowerCase().includes('meeting') ||
      reply.toLowerCase().includes('2pm')
    )).toBeTruthy();
  });
});
