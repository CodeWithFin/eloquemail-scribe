import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeEmail } from '../gemini';
import { type Deadline } from '../types';

// Helper to fix date objects
const ensureProperDateTypes = (analysis: any): any => {
  return {
    ...analysis,
    deadlines: analysis.deadlines.map((deadline: any) => ({
      ...deadline,
      date: deadline.date instanceof Date ? deadline.date : 
            typeof deadline.date === 'string' ? new Date(deadline.date) : null
    })),
    timestamp: analysis.timestamp instanceof Date ? analysis.timestamp : 
              typeof analysis.timestamp === 'string' ? new Date(analysis.timestamp) : new Date()
  };
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

describe('Email Analysis', () => {
  it('should extract questions correctly', async () => {
    const emailContent = `
      Hi Team,
      
      I hope this email finds you well. I have a few questions about the project:
      
      1. When is the deadline for the first deliverable?
      2. Who is responsible for the QA testing?
      3. Have we finalized the tech stack yet?
      
      Looking forward to your response.
      
      Best,
      Alex
    `;
    
    // Mock setTimeout to resolve immediately
    vi.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
      callback();
      return 0 as any;
    });
    
    // Create a mock for document.createElement
    document.createElement = vi.fn().mockImplementation(() => ({
      innerHTML: '',
      textContent: emailContent,
      innerText: emailContent
    }));
    
    let analysis = await analyzeEmail(emailContent);
    
    // Ensure proper date types
    analysis = ensureProperDateTypes(analysis);
    
    expect(analysis.questions.length).toBe(3);
    expect(analysis.questions).toContain('When is the deadline for the first deliverable?');
    expect(analysis.questions).toContain('Who is responsible for the QA testing?');
    expect(analysis.questions).toContain('Have we finalized the tech stack yet?');
    expect(analysis.intent).toBe('request');
  });
  
  it('should identify action items correctly', async () => {
    const emailContent = `
      Hello,
      
      Could you please review the attached document by Friday?
      
      Also, please update the project timeline and share it with the stakeholders.
      
      Thanks,
      Sarah
    `;
    
    // Mock document.createElement
    document.createElement = vi.fn().mockImplementation(() => ({
      innerHTML: '',
      textContent: emailContent,
      innerText: emailContent
    }));
    
    let analysis = await analyzeEmail(emailContent);
    
    // Ensure proper date types
    analysis = ensureProperDateTypes(analysis);
    
    expect(analysis.actionItems.length).toBeGreaterThanOrEqual(2);
    expect(analysis.actionItems.some(item => 
      item.toLowerCase().includes('review') && 
      item.toLowerCase().includes('document')
    )).toBeTruthy();
    expect(analysis.actionItems.some(item => 
      item.toLowerCase().includes('update') && 
      item.toLowerCase().includes('timeline')
    )).toBeTruthy();
    expect(analysis.hasAttachments).toBeTruthy();
  });
  
  it('should detect deadlines correctly', async () => {
    const emailContent = `
      Hi John,
      
      We need the report by Wednesday next week.
      
      The client presentation is due on May 30, 2025.
      
      Regards,
      Emma
    `;
    
    // Mock document.createElement
    document.createElement = vi.fn().mockImplementation(() => ({
      innerHTML: '',
      textContent: emailContent,
      innerText: emailContent
    }));
    
    let analysis = await analyzeEmail(emailContent);
    
    // Ensure proper date types
    analysis = ensureProperDateTypes(analysis);
    
    expect(analysis.deadlines.length).toBeGreaterThanOrEqual(2);
    expect(analysis.deadlines.some(d => 
      d.text.toLowerCase().includes('wednesday') || 
      d.text.toLowerCase().includes('next week')
    )).toBeTruthy();
    expect(analysis.deadlines.some(d => 
      d.text.toLowerCase().includes('may 30') || 
      d.text.toLowerCase().includes('2025')
    )).toBeTruthy();
  });
  
  it('should determine sentiment correctly', async () => {
    const positiveEmail = `
      Hi Team,
      
      Great work on the project! I'm very happy with the progress and appreciate your hard work.
      
      Best,
      Manager
    `;
    
    const negativeEmail = `
      Hello,
      
      I'm disappointed with the delays and errors in the latest delivery. This is causing significant problems for our timeline.
      
      Regards,
      Client
    `;
    
    // Mock document.createElement for positive email
    document.createElement = vi.fn().mockImplementation(() => ({
      innerHTML: '',
      textContent: positiveEmail,
      innerText: positiveEmail
    }));
    
    let positiveAnalysis = await analyzeEmail(positiveEmail);
    
    // Ensure proper date types
    positiveAnalysis = ensureProperDateTypes(positiveAnalysis);
    
    // Mock document.createElement for negative email
    document.createElement = vi.fn().mockImplementation(() => ({
      innerHTML: '',
      textContent: negativeEmail,
      innerText: negativeEmail
    }));
    
    let negativeAnalysis = await analyzeEmail(negativeEmail);
    
    // Ensure proper date types
    negativeAnalysis = ensureProperDateTypes(negativeAnalysis);
    
    expect(positiveAnalysis.sentiment.tone).toBe('positive');
    expect(negativeAnalysis.sentiment.tone).toBe('negative');
  });
  
  it('should detect urgency correctly', async () => {
    const urgentEmail = `
      URGENT: System Outage
      
      We have a critical system failure that needs immediate attention. Please respond ASAP.
      
      This is affecting all users and needs to be fixed today.
      
      IT Support
    `;
    
    // Mock document.createElement
    document.createElement = vi.fn().mockImplementation(() => ({
      innerHTML: '',
      textContent: urgentEmail,
      innerText: urgentEmail
    }));
    
    let analysis = await analyzeEmail(urgentEmail);
    
    // Ensure proper date types
    analysis = ensureProperDateTypes(analysis);
    
    expect(analysis.urgency).toBe('high');
    expect(analysis.metadata.requiresHumanReview).toBeTruthy();
  });
  
  it('should analyze complex emails correctly', async () => {
    const complexEmail = `
      From: alex.smith@company.com
      Subject: Project Deadline Extension Request
      
      Hi Team,
      
      I hope this email finds you well. I'm writing regarding the Wilson project deliverables that are due this Friday. 
      
      Due to the unexpected server outage last week that lasted 2 days, our team lost critical development time. Would it be possible to extend the deadline by 3 business days to ensure we can deliver quality work?
      
      Also, could you clarify if the financial projections should be included in the main report or as a separate appendix?
      
      Thanks for your consideration,
      Alex
    `;
    
    // Mock document.createElement
    document.createElement = vi.fn().mockImplementation(() => ({
      innerHTML: '',
      textContent: complexEmail,
      innerText: complexEmail
    }));
    
    let analysis = await analyzeEmail(complexEmail);
    
    // Ensure proper date types
    analysis = ensureProperDateTypes(analysis);
    
    expect(analysis.sender.email).toBe('alex.smith@company.com');
    expect(analysis.subject.toLowerCase()).toContain('deadline extension');
    expect(analysis.questions.length).toBeGreaterThanOrEqual(2);
    expect(analysis.questions.some(q => q.toLowerCase().includes('possible to extend'))).toBeTruthy();
    expect(analysis.questions.some(q => q.toLowerCase().includes('financial projections'))).toBeTruthy();
    expect(analysis.deadlines.some(d => d.text.toLowerCase().includes('friday'))).toBeTruthy();
    expect(analysis.intent).toBe('request');
  });
});
