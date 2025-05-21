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
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  getFollowUps, 
  deleteFollowUp, 
  updateFollowUpStatus,
  updateFollowUpDueDate,
  type FollowUp
} from '@/services/email/followUpService';
import { format } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  CheckCircle, 
  Clock, 
  Edit, 
  Trash2, 
  User, 
  AlertCircle,
  AlertTriangle,
  Mail
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const FollowUpsPage = () => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Load follow-ups
    loadFollowUps();
  }, []);

  const loadFollowUps = () => {
    const allFollowUps = getFollowUps();
    setFollowUps(allFollowUps);
  };

  const handleCompleteFollowUp = (followUpId: string) => {
    const updated = updateFollowUpStatus(followUpId, 'completed');
    if (updated) {
      toast({
        title: "Follow-up completed",
        description: "The follow-up has been marked as completed"
      });
      loadFollowUps();
      if (detailsOpen) {
        setDetailsOpen(false);
      }
    } else {
      toast({
        title: "Error",
        description: "Failed to update the follow-up status",
        variant: "destructive"
      });
    }
  };

  const handleDeleteFollowUp = (followUpId: string) => {
    const success = deleteFollowUp(followUpId);
    if (success) {
      toast({
        title: "Follow-up deleted",
        description: "The follow-up has been deleted"
      });
      loadFollowUps();
      if (detailsOpen) {
        setDetailsOpen(false);
      }
    } else {
      toast({
        title: "Error",
        description: "Failed to delete the follow-up",
        variant: "destructive"
      });
    }
  };

  const handleSnoozeFollowUp = (followUpId: string, newDate: Date) => {
    const updated = updateFollowUpDueDate(followUpId, newDate.toISOString());
    if (updated) {
      updateFollowUpStatus(followUpId, 'snoozed');
      toast({
        title: "Follow-up snoozed",
        description: `The follow-up has been snoozed until ${format(newDate, "MMM d, yyyy")}`
      });
      loadFollowUps();
    } else {
      toast({
        title: "Error",
        description: "Failed to snooze the follow-up",
        variant: "destructive"
      });
    }
  };

  const showFollowUpDetails = (followUp: FollowUp) => {
    setSelectedFollowUp(followUp);
    setDetailsOpen(true);
  };

  const handleComposeReply = (followUp: FollowUp) => {
    // Navigate to compose screen with pre-filled values
    navigate('/compose', {
      state: {
        to: followUp.recipient,
        subject: `Re: ${followUp.subject}`,
        body: `Following up on: ${followUp.subject}\n\n${followUp.notes || ''}`
      }
    });
  };

  // Format the date for display
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return format(date, "MMM d, yyyy");
  };

  // Check if a follow-up is overdue
  const isOverdue = (followUp: FollowUp): boolean => {
    return new Date(followUp.dueDate) < new Date() && followUp.status === 'pending';
  };

  // Get badge color based on priority
  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge>Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
    }
  };

  // Get status badge
  const getStatusBadge = (followUp: FollowUp) => {
    if (isOverdue(followUp)) {
      return <Badge variant="destructive">Overdue</Badge>;
    }

    switch (followUp.status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Completed</Badge>;
      case 'snoozed':
        return <Badge variant="secondary">Snoozed</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Helmet>
        <title>Follow-Ups | Email Buddy</title>
      </Helmet>
      <Header />
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Follow-Ups</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Track and manage email follow-ups
              </p>
            </div>
            <Button onClick={() => navigate('/compose')}>
              New Email
            </Button>
          </div>

          {followUps.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {followUps.map((followUp) => (
                    <TableRow 
                      key={followUp.id}
                      className={cn(
                        "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700",
                        isOverdue(followUp) && "bg-red-50 dark:bg-red-900/10"
                      )}
                      onClick={() => showFollowUpDetails(followUp)}
                    >
                      <TableCell className="font-medium">
                        {followUp.recipient}
                      </TableCell>
                      <TableCell>{followUp.subject}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                          {formatDate(followUp.dueDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(followUp.priority)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(followUp)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleComposeReply(followUp);
                            }}
                          >
                            <Mail className="h-4 w-4" />
                            <span className="sr-only">Reply</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteFollowUp(followUp.id);
                            }}
                            disabled={followUp.status === 'completed'}
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span className="sr-only">Complete</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFollowUp(followUp.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
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
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Follow-Ups</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                You haven't set any follow-up reminders yet.
              </p>
              <Button className="mt-4" onClick={() => navigate('/compose')}>
                Compose New Email
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Follow-Up Details Dialog */}
      {selectedFollowUp && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedFollowUp.subject}</DialogTitle>
              <DialogDescription>
                Follow-up {isOverdue(selectedFollowUp) ? 'was due' : 'is due'} on {formatDate(selectedFollowUp.dueDate)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Recipient:</span>
                </div>
                <span className="text-sm">{selectedFollowUp.recipient}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Due Date:</span>
                </div>
                <span className="text-sm">{formatDate(selectedFollowUp.dueDate)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Priority:</span>
                </div>
                <span className="text-sm">{getPriorityBadge(selectedFollowUp.priority)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Status:</span>
                </div>
                <span className="text-sm">{getStatusBadge(selectedFollowUp)}</span>
              </div>
              
              {selectedFollowUp.notes && (
                <div className="pt-2">
                  <span className="text-sm font-medium">Notes:</span>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm">
                    {selectedFollowUp.notes}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="flex justify-between">
              <div className="space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => handleDeleteFollowUp(selectedFollowUp.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      <Clock className="h-4 w-4 mr-2" />
                      Snooze
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={new Date(selectedFollowUp.dueDate)}
                      onSelect={(date) => {
                        if (date) {
                          handleSnoozeFollowUp(selectedFollowUp.id, date);
                          setDetailsOpen(false);
                        }
                      }}
                      initialFocus
                      disabled={(date) => 
                        date < new Date(new Date().setDate(new Date().getDate() - 1))
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-x-2">
                {selectedFollowUp.status !== 'completed' && (
                  <Button 
                    variant="default"
                    onClick={() => handleCompleteFollowUp(selectedFollowUp.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Complete
                  </Button>
                )}
                
                <Button 
                  onClick={() => handleComposeReply(selectedFollowUp)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Reply
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default FollowUpsPage;
