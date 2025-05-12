import React, { useState } from 'react';
import { useGmailMessageContent } from '@/services/gmail';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Reply, Forward, Trash, Star, MoreHorizontal, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EmailViewProps {
  messageId: string;
  onBack?: () => void;
}

const EmailView: React.FC<EmailViewProps> = ({ messageId, onBack }) => {
  const navigate = useNavigate();
  const { data: messageContent, isLoading, error } = useGmailMessageContent(messageId);
  const [isStarred, setIsStarred] = useState(false);
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/dashboard');
    }
  };
  
  const handleReply = () => {
    // Implement reply functionality
    navigate('/compose?reply=' + messageId);
  };
  
  const handleForward = () => {
    // Implement forward functionality
    navigate('/compose?forward=' + messageId);
  };
  
  const handleStar = () => {
    setIsStarred(!isStarred);
    // Implement star functionality
  };
  
  const handleDelete = () => {
    // Implement delete functionality
    if (window.confirm('Are you sure you want to delete this message?')) {
      // Delete message
      handleBack();
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
            <div className="space-x-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-6 w-3/4 mt-4" />
          <Skeleton className="h-4 w-1/4 mt-2" />
        </CardHeader>
        <CardContent className="pt-6">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-5/6 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
        </CardContent>
      </Card>
    );
  }
  
  if (error || !messageContent) {
    return (
      <Card>
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
          </div>
          <h2 className="text-lg font-medium mt-4">Message not found</h2>
          <p className="text-sm text-gray-500">
            The message could not be loaded. It may have been deleted or you may not have permission to view it.
          </p>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <div className="space-x-2">
            <Button variant="ghost" size="icon" onClick={handleReply}>
              <Reply size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleForward}>
              <Forward size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleStar}>
              <Star size={18} fill={isStarred ? "currentColor" : "none"} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDelete}>
              <Trash size={18} />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreHorizontal size={18} />
            </Button>
          </div>
        </div>
        
        {/* Email header info */}
        <div className="mt-4">
          <h2 className="text-xl font-medium">Subject line of the email</h2>
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <span className="font-medium">From:</span>
            <span className="ml-2">sender@example.com</span>
          </div>
          <div className="flex items-center mt-1 text-sm text-gray-500">
            <span className="font-medium">To:</span>
            <span className="ml-2">recipient@example.com</span>
          </div>
          <div className="flex items-center mt-1 text-sm text-gray-500">
            <span className="font-medium">Date:</span>
            <span className="ml-2">June 15, 2023 at 10:30 AM</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div 
          className="prose max-w-none" 
          dangerouslySetInnerHTML={{ __html: messageContent }}
        />
      </CardContent>
    </Card>
  );
};

export default EmailView; 