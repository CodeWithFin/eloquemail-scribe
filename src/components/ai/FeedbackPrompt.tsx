import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageSquare } from 'lucide-react';
import loggingService from '@/services/ai/loggingService';
import { useToast } from '@/hooks/use-toast';

interface FeedbackPromptProps {
  replyId: string;
  show: boolean;
  onClose: () => void;
}

const FeedbackPrompt: React.FC<FeedbackPromptProps> = ({ replyId, show, onClose }) => {
  const { toast } = useToast();
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comments, setComments] = useState('');
  const [improvements, setImprovements] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // When user hovers over a star
  const handleMouseOver = (index: number) => {
    setHoveredRating(index);
  };
  
  // When user's mouse leaves the rating area
  const handleMouseLeave = () => {
    setHoveredRating(null);
  };
  
  // When user clicks on a star
  const handleRatingClick = (index: number) => {
    setRating(index);
  };
  
  // When user submits the feedback
  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please provide a rating before submitting feedback",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Submit feedback to the logging service
      loggingService.addFeedbackToLog(
        replyId,
        rating,
        comments,
        improvements
      );
      
      toast({
        title: "Feedback submitted",
        description: "Thank you for your valuable feedback"
      });
      
      // Reset form and close dialog
      setRating(0);
      setComments('');
      setImprovements('');
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error submitting feedback",
        description: "There was a problem submitting your feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Skip feedback
  const handleSkip = () => {
    onClose();
  };
  
  return (
    <Dialog open={show} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MessageSquare className="mr-2 h-5 w-5" />
            How was the AI-generated reply?
          </DialogTitle>
          <DialogDescription>
            Your feedback helps us improve our auto-reply system
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="text-center">
            <p className="text-sm mb-2">Rate the quality of the generated reply:</p>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((index) => (
                <Star
                  key={index}
                  className={`h-8 w-8 cursor-pointer ${
                    (hoveredRating !== null ? index <= hoveredRating : index <= rating)
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-gray-300'
                  }`}
                  onMouseOver={() => handleMouseOver(index)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleRatingClick(index)}
                />
              ))}
            </div>
          </div>
          
          <div>
            <label htmlFor="comments" className="text-sm font-medium">What did you like about this reply?</label>
            <Textarea
              id="comments"
              placeholder="What aspects were most helpful or accurate?"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>
          
          <div>
            <label htmlFor="improvements" className="text-sm font-medium">How could this reply be improved?</label>
            <Textarea
              id="improvements"
              placeholder="Any suggestions for making the reply better?"
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button 
            variant="ghost" 
            onClick={handleSkip}
          >
            Skip
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || rating === 0}
          >
            Submit Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackPrompt;
