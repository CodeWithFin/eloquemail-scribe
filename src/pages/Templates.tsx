import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, Info } from 'lucide-react';
import TemplateManager from '@/components/email/TemplateManager';
import { EmailTemplate, EmailSnippet } from '@/services/templates';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const TemplatesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleSelectTemplate = (template: EmailTemplate) => {
    // Navigate to compose with the selected template
    navigate('/compose', { state: { templateId: template.id } });
    
    toast({
      title: "Template selected",
      description: `Using template: ${template.name}`
    });
  };
  
  const handleSelectSnippet = (snippet: EmailSnippet) => {
    // Copy snippet to clipboard since we can't directly
    // insert it without being in the composer
    navigator.clipboard.writeText(snippet.content);
    
    toast({
      title: "Snippet copied",
      description: "The snippet has been copied to clipboard."
    });
  };

  return (
    <>
      <Helmet>
        <title>Templates | Email Buddy 2.0</title>
      </Helmet>
      
      <div className="container max-w-6xl py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Templates & Snippets</h1>
            <p className="text-gray-600 dark:text-gray-400">Create and manage reusable email templates and text snippets</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-eloquent-500" />
                  <CardTitle>Template Library</CardTitle>
                </div>
                <CardDescription>
                  Create, edit, and use your email templates and snippets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TemplateManager 
                  onSelectTemplate={handleSelectTemplate}
                  onSelectSnippet={handleSelectSnippet}
                />
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Template Tips</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 text-sm space-y-2">
                  <li>
                    <strong>Use placeholders</strong> - Insert placeholders like {"{name}"} that will be replaced when using the template.
                  </li>
                  <li>
                    <strong>Create snippets</strong> - For text you use frequently, like signature or closing remarks.
                  </li>
                  <li>
                    <strong>Organize by category</strong> - Keep your templates organized for different purposes.
                  </li>
                </ul>
              </AlertDescription>
            </Alert>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Common Placeholders</CardTitle>
                <CardDescription>
                  Variables you can use in templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <div>
                    <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{"{name}"}</code>
                    <p className="text-gray-600 dark:text-gray-400">Recipient's name</p>
                  </div>
                  <div>
                    <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{"{your_name}"}</code>
                    <p className="text-gray-600 dark:text-gray-400">Your name</p>
                  </div>
                  <div>
                    <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{"{company}"}</code>
                    <p className="text-gray-600 dark:text-gray-400">Company name</p>
                  </div>
                  <div>
                    <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{"{date}"}</code>
                    <p className="text-gray-600 dark:text-gray-400">Current date</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default TemplatesPage;
