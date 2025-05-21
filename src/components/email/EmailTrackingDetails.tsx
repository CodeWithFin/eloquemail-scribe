// Component for displaying email tracking information
import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Eye, 
  MailOpen, 
  MousePointer, 
  Send, 
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { EmailTracking } from '@/services/email/trackingService';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from '@/components/ui/badge';

interface EmailTrackingDetailsProps {
  tracking: EmailTracking;
}

const EmailTrackingDetails: React.FC<EmailTrackingDetailsProps> = ({ tracking }) => {
  // Determine status icon and color
  const getStatusDetails = () => {
    switch (tracking.status) {
      case 'sent':
        return {
          icon: <Send className="h-4 w-4" />,
          color: 'bg-blue-100 text-blue-800',
          label: 'Sent'
        };
      case 'delivered':
        return {
          icon: <CheckCircle2 className="h-4 w-4" />,
          color: 'bg-green-100 text-green-800',
          label: 'Delivered'
        };
      case 'read':
        return {
          icon: <Eye className="h-4 w-4" />,
          color: 'bg-purple-100 text-purple-800',
          label: 'Read'
        };
      case 'failed':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'bg-red-100 text-red-800',
          label: 'Failed'
        };
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          color: 'bg-gray-100 text-gray-800',
          label: 'Unknown'
        };
    }
  };
  
  const statusDetails = getStatusDetails();
  const hasLinkClicks = tracking.clickedLinks && tracking.clickedLinks.length > 0;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Email Tracking</CardTitle>
          <Badge className={statusDetails.color}>
            <span className="flex items-center gap-1">
              {statusDetails.icon}
              {statusDetails.label}
            </span>
          </Badge>
        </div>
        <CardDescription>{tracking.subject}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Sent to: <span className="font-semibold">{tracking.recipient}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Sent at: <span className="font-semibold">
                {format(new Date(tracking.sentAt), "PPp")}
              </span></span>
            </div>
            
            {tracking.readAt && (
              <div className="flex items-center gap-2">
                <MailOpen className="h-4 w-4 text-purple-600" />
                <span className="text-sm">Read at: <span className="font-semibold">
                  {format(new Date(tracking.readAt), "PPp")}
                </span></span>
              </div>
            )}
          </div>
          
          {hasLinkClicks && (
            <div className="pt-3 border-t">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                <MousePointer className="h-4 w-4" />
                Link Activity
              </h3>
              <ul className="space-y-1 text-sm">
                {tracking.clickedLinks?.map((link, index) => (
                  <li key={index} className="flex flex-col pl-6">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="text-left truncate hover:underline text-blue-600">
                          {link.url}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{link.url}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="text-xs text-muted-foreground">
                      Clicked at {format(new Date(link.clickedAt), "PPp")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailTrackingDetails;
