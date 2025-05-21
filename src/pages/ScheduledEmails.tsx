// Page for managing scheduled emails
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '../components/layout/Header';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent, 
  DialogDescription,
  DialogFooter, 
  DialogHeader,
  DialogTitle,
  DialogClose 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScheduledEmail, getScheduledEmails, cancelScheduledEmail } from '@/services/email/scheduleService';
import { format } from 'date-fns';
import { Calendar, Clock, Edit, Trash2, User } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const ScheduledEmails: React.FC = () => {
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<ScheduledEmail | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Load scheduled emails
    loadScheduledEmails();
  }, []);

  const loadScheduledEmails = () => {
    const emails = getScheduledEmails();
    setScheduledEmails(emails);
  };

  const handleCancelEmail = (emailId: string) => {
    const success = cancelScheduledEmail(emailId);
    if (success) {
      toast({
        title: "Email canceled",
        description: "The scheduled email has been canceled.",
      });
      loadScheduledEmails();
      if (detailsOpen) {
        setDetailsOpen(false);
      }
    } else {
      toast({
        title: "Error",
        description: "Failed to cancel the scheduled email.",
        variant: "destructive"
      });
    }
  };

  const handleEditEmail = (emailId: string) => {
    // In a real implementation, this would redirect to the compose screen with the email loaded
    toast({
      title: "Feature coming soon",
      description: "Email editing will be available in a future update.",
    });
  };

  const showEmailDetails = (email: ScheduledEmail) => {
    setSelectedEmail(email);
    setDetailsOpen(true);
  };

  // Format the date and time for display
  const formatScheduledDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return format(date, "MMM d, yyyy 'at' h:mm a");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Helmet>
        <title>Scheduled Emails | Email Buddy</title>
      </Helmet>
      <Header />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Scheduled Emails</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Manage emails scheduled to be sent later
              </p>
            </div>
            <Button onClick={() => navigate('/compose')}>
              New Email
            </Button>
          </div>

          {scheduledEmails.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>To</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduledEmails.map((email) => (
                    <TableRow 
                      key={email.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => showEmailDetails(email)}
                    >
                      <TableCell className="font-medium truncate max-w-[180px]">
                        {email.to.join(", ")}
                      </TableCell>
                      <TableCell className="truncate max-w-[300px]">{email.subject}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          {formatScheduledDateTime(email.scheduledTime)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={email.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEmail(email.id);
                            }}
                            disabled={email.status !== 'pending'}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelEmail(email.id);
                            }}
                            disabled={email.status !== 'pending'}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Cancel</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Scheduled Emails</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                You haven't scheduled any emails yet.
              </p>
              <Button className="mt-4" onClick={() => navigate('/compose')}>
                Compose New Email
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Email Details Dialog */}
      {selectedEmail && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedEmail.subject}</DialogTitle>
              <DialogDescription>
                {selectedEmail.status === 'pending' 
                  ? `Scheduled for ${formatScheduledDateTime(selectedEmail.scheduledTime)}`
                  : selectedEmail.status === 'sent'
                    ? `Sent on ${formatScheduledDateTime(selectedEmail.scheduledTime)}`
                    : `Failed to send on ${formatScheduledDateTime(selectedEmail.scheduledTime)}`
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
                  <User className="h-4 w-4 mr-2" />
                  <span>To:</span>
                </div>
                <div className="text-sm pl-6">{selectedEmail.to.join(", ")}</div>
              </div>
              
              {selectedEmail.cc && selectedEmail.cc.length > 0 && (
                <div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <span className="ml-6">CC:</span>
                  </div>
                  <div className="text-sm pl-6">{selectedEmail.cc.join(", ")}</div>
                </div>
              )}
              
              {selectedEmail.bcc && selectedEmail.bcc.length > 0 && (
                <div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
                    <span className="ml-6">BCC:</span>
                  </div>
                  <div className="text-sm pl-6">{selectedEmail.bcc.join(", ")}</div>
                </div>
              )}
              
              <div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Schedule:</span>
                </div>
                <div className="text-sm pl-6">{formatScheduledDateTime(selectedEmail.scheduledTime)}</div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                {/* Use a sanitized version in a real app to prevent XSS */}
                <div 
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                />
              </div>
            </div>
            
            <DialogFooter>
              <div className="w-full flex justify-between">
                <Button 
                  variant="destructive"
                  onClick={() => handleCancelEmail(selectedEmail.id)}
                  disabled={selectedEmail.status !== 'pending'}
                >
                  Cancel Scheduled Email
                </Button>
                <DialogClose asChild>
                  <Button variant="secondary">Close</Button>
                </DialogClose>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Status badge component
const StatusBadge: React.FC<{ status: 'pending' | 'sent' | 'failed' }> = ({ status }) => {
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
  let label = "";
  
  switch (status) {
    case "pending":
      variant = "outline";
      label = "Pending";
      break;
    case "sent":
      variant = "default";
      label = "Sent";
      break;
    case "failed":
      variant = "destructive";
      label = "Failed";
      break;
  }
  
  return <Badge variant={variant}>{label}</Badge>;
};

export default ScheduledEmails;
