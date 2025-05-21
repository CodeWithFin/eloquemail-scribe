import { describe, expect, test } from 'vitest';
import { parseEmailContent, analyzeEmailContent } from './emailAnalysis';
import { generateEmailReply } from './emailReplyGenerator';

describe('Email Analysis System', () => {
  const sampleEmail = `
From: Alex Smith <alex.smith@company.com>
Subject: Project Deadline Extension Request
Date: Mon, 20 May 2025 09:30:00 GMT

Hi [Recipient],

I hope this email finds you well. I'm writing regarding the Wilson project deliverables that are due this Friday. 

Due to the unexpected server outage last week that lasted 2 days, our team lost critical development time. Would it be possible to extend the deadline by 3 business days to ensure we can deliver quality work?

Also, could you clarify if the financial projections should be included in the main report or as a separate appendix?

Thanks for your consideration,
Alex
`;

  describe('parseEmailContent', () => {
    test('correctly parses email components', () => {
      const parsed = parseEmailContent(sampleEmail);
      
      expect(parsed.sender.name).toBe('Alex Smith');
      expect(parsed.sender.email).toBe('alex.smith@company.com');
      expect(parsed.subject).toBe('Project Deadline Extension Request');
      expect(parsed.hasAttachments).toBe(false);
    });
  });

  describe('analyzeEmailContent', () => {
    test('correctly identifies questions', () => {
      const parsed = parseEmailContent(sampleEmail);
      const analysis = analyzeEmailContent(parsed);
      
      expect(analysis.questions).toHaveLength(2);
      expect(analysis.questions).toContain('Would it be possible to extend the deadline by 3 business days to ensure we can deliver quality work?');
    });

    test('correctly identifies action items', () => {
      const parsed = parseEmailContent(sampleEmail);
      const analysis = analyzeEmailContent(parsed);
      
      expect(analysis.actionItems.some(item => 
        item.toLowerCase().includes('deadline') || 
        item.toLowerCase().includes('extend')
      )).toBe(true);
    });

    test('correctly determines intent and urgency', () => {
      const parsed = parseEmailContent(sampleEmail);
      const analysis = analyzeEmailContent(parsed);
      
      expect(analysis.intent).toBe('request');
      expect(analysis.urgency).toBe('medium');
    });
  });

  describe('generateEmailReply', () => {
    test('generates appropriate reply for deadline extension request', async () => {
      const reply = await generateEmailReply(sampleEmail, {
        tone: 'formal',
        length: 'medium',
        includeIntro: true,
        includeOutro: true,
        includeActionItems: true,
        includeDeadlines: true
      });
      
      expect(reply.text).toContain('Dear Alex');
      expect(reply.text).toContain('deadline');
      expect(reply.text).toContain('financial projections');
      expect(reply.metadata.questionsAddressed).toHaveLength(2);
    });

    test('flags high urgency emails for human review', async () => {
      const urgentEmail = sampleEmail.replace(
        'Project Deadline Extension Request',
        'URGENT: Critical System Failure'
      );
      
      const reply = await generateEmailReply(urgentEmail, {
        tone: 'formal',
        length: 'medium',
        includeIntro: true,
        includeOutro: true
      });
      
      expect(reply.metadata.requiresHumanReview).toBe(true);
      expect(reply.metadata.confidence).toBeLessThan(0.9);
    });

    test('maintains appropriate tone in responses', async () => {
      const formalReply = await generateEmailReply(sampleEmail, {
        tone: 'formal',
        length: 'medium',
        includeIntro: true,
        includeOutro: true
      });
      
      expect(formalReply.text).toContain('Dear');
      expect(formalReply.text).toContain('Best regards');
      
      const friendlyReply = await generateEmailReply(sampleEmail, {
        tone: 'friendly',
        length: 'medium',
        includeIntro: true,
        includeOutro: true
      });
      
      expect(friendlyReply.text).toContain('Hi');
      expect(friendlyReply.text).toContain('Best wishes');
    });

    test('includes all necessary components in response', async () => {
      const reply = await generateEmailReply(sampleEmail, {
        tone: 'formal',
        length: 'medium',
        includeIntro: true,
        includeOutro: true,
        includeActionItems: true,
        includeDeadlines: true
      });
      
      // Check for key components
      expect(reply.text).toMatch(/^Dear/); // Greeting
      expect(reply.text).toContain('Thank you for'); // Acknowledgment
      expect(reply.text).toContain('deadline'); // Main response
      expect(reply.text).toMatch(/Best regards|Sincerely/); // Closing
      
      // Metadata validation
      expect(reply.metadata.questionsAddressed).toHaveLength(2);
      expect(reply.metadata.confidence).toBeGreaterThan(0);
      expect(reply.metadata.confidence).toBeLessThanOrEqual(1);
    });
  });

  // Test various email types
  describe('handles different email types correctly', () => {
    test('information sharing email', async () => {
      const infoEmail = \`
From: John Doe <john@example.com>
Subject: Weekly Project Update
Date: Mon, 20 May 2025 10:00:00 GMT

Hi team,

Just wanted to share a quick update on the project progress. We've completed the initial phase and everything is on track.

Best,
John\`;
      
      const reply = await generateEmailReply(infoEmail, {
        tone: 'friendly',
        length: 'short',
        includeIntro: true,
        includeOutro: true
      });
      
      expect(reply.text).toContain('update');
      expect(reply.metadata.requiresHumanReview).toBe(false);
    });

    test('complex multi-question email', async () => {
      const complexEmail = \`
From: Sarah Chen <sarah@example.com>
Subject: Multiple Project Questions
Date: Mon, 20 May 2025 11:00:00 GMT

Hello,

I have several questions about the project:
1. When is the next milestone due?
2. How many resources will be allocated?
3. What is the budget forecast?
4. Can we schedule a review meeting?

Thanks,
Sarah\`;
      
      const reply = await generateEmailReply(complexEmail, {
        tone: 'formal',
        length: 'long',
        includeIntro: true,
        includeOutro: true
      });
      
      expect(reply.metadata.requiresHumanReview).toBe(true);
      expect(reply.metadata.questionsAddressed).toHaveLength(4);
    });

    test('emotional or sensitive content', async () => {
      const sensitiveEmail = \`
From: Mark Johnson <mark@example.com>
Subject: Concerns About Project Direction
Date: Mon, 20 May 2025 12:00:00 GMT

I am very disappointed and frustrated with the current project direction. This is not what we agreed upon, and it's causing significant issues for our team.

We need to discuss this urgently.

Regards,
Mark\`;
      
      const reply = await generateEmailReply(sensitiveEmail, {
        tone: 'formal',
        length: 'medium',
        includeIntro: true,
        includeOutro: true
      });
      
      expect(reply.metadata.requiresHumanReview).toBe(true);
      expect(reply.metadata.reviewReason).toContain('Negative sentiment detected');
    });
  });
});
