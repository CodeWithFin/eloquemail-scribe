import React, { useState } from 'react';
import Header from '../components/layout/Header';
import SmartReplyGenerator from '../components/ai/SmartReplyGenerator';
import EmailSummarizer from '../components/ai/EmailSummarizer';
import EmailPrioritizer from '../components/ai/EmailPrioritizer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Lightbulb } from 'lucide-react';

const AIEmailTools: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI Email Tools</h1>
          <p className="text-gray-600 dark:text-gray-400">Powerful AI tools to help you manage emails more efficiently</p>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-eloquent-500" />
              <CardTitle>Welcome to Email Buddy AI Tools</CardTitle>
            </div>
            <CardDescription>
              These AI-powered tools help you save time and write better emails. Choose a tool below to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-eloquent-100 dark:bg-eloquent-900/30 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">🔁</span>
              </div>
              <h3 className="font-medium mb-1">Smart Reply</h3>
              <p className="text-sm text-gray-500">Generate quick, contextual replies to emails</p>
            </div>
            <div className="p-4 border rounded-lg flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-eloquent-100 dark:bg-eloquent-900/30 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">📩</span>
              </div>
              <h3 className="font-medium mb-1">Email Summarizer</h3>
              <p className="text-sm text-gray-500">Create clear, professional email summaries</p>
            </div>
            <div className="p-4 border rounded-lg flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-eloquent-100 dark:bg-eloquent-900/30 rounded-full flex items-center justify-center mb-3">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-medium mb-1">Priority Analyzer</h3>
              <p className="text-sm text-gray-500">Determine email importance and urgency</p>
            </div>
          </CardContent>
        </Card>
        
        <div className="mb-6 flex items-center">
          <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tip: For best results, paste complete email content including subject, sender, and body.
          </p>
        </div>
        
        <Tabs defaultValue="smart-reply" className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="smart-reply" className="flex-1">Smart Reply</TabsTrigger>
            <TabsTrigger value="summarize" className="flex-1">Email Summarizer</TabsTrigger>
            <TabsTrigger value="prioritize" className="flex-1">Priority Analyzer</TabsTrigger>
          </TabsList>
          
          <TabsContent value="smart-reply" className="mt-0">
            <SmartReplyGenerator />
          </TabsContent>
          
          <TabsContent value="summarize" className="mt-0">
            <EmailSummarizer />
          </TabsContent>
          
          <TabsContent value="prioritize" className="mt-0">
            <EmailPrioritizer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIEmailTools; 