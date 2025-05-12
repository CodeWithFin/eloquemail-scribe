import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Settings } from 'lucide-react';
import { isAIConfigured } from '@/services/ai/hooks';

interface AIFeatureGuideProps {
  title?: string;
  description?: string;
}

const AIFeatureGuide: React.FC<AIFeatureGuideProps> = ({ 
  title = "AI Features Not Configured", 
  description = "Configure your OpenAI API key to use AI-powered features." 
}) => {
  const configured = isAIConfigured();

  if (configured) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="mr-2 h-5 w-5 text-purple-500" />
          {title}
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          To use AI-powered features like smart replies, summarization, and composition assistance, 
          you'll need to provide your OpenAI API key in the settings.
        </p>
      </CardContent>
      <CardFooter>
        <Link to="/settings" className="w-full">
          <Button variant="default" className="w-full flex items-center justify-center">
            <Settings className="mr-2 h-4 w-4" />
            Configure AI Settings
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default AIFeatureGuide; 