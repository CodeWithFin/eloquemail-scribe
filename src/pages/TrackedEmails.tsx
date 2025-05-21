// Page for viewing all tracked emails
import React, { useState, useEffect } from 'react';
import { 
  getTrackedEmails, 
  EmailTracking 
} from '@/services/email/trackingService';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  Clock,
  Eye,
  Send,
  AlertCircle,
  MousePointer
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import EmailTrackingDetails from '@/components/email/EmailTrackingDetails';

const TrackedEmails: React.FC = () => {
  const [trackedEmails, setTrackedEmails] = useState<EmailTracking[]>([]);
  const [selectedTracking, setSelectedTracking] = useState<EmailTracking | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Load all tracked emails
  useEffect(() => {
    const tracked = getTrackedEmails();
    setTrackedEmails(tracked);
  }, []);

  // Get filtered emails based on search term
  const filteredEmails = searchTerm
    ? trackedEmails.filter(email => 
        email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.recipient.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : trackedEmails;

  // Helper for tracking status icons
  const getStatusIcon = (status: EmailTracking['status']) => {
    switch (status) {
      case 'sent':
        return <Send className="h-4 w-4 text-blue-600" />;
      case 'delivered':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'read':
        return <Eye className="h-4 w-4 text-purple-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Email Tracking</h1>
        <div className="w-64">
          <Input
            type="text"
            placeholder="Search emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredEmails.length > 0 ? (
        <div className="border rounded-md">
          <Table>
            <TableCaption>A list of your tracked emails</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Read At</TableHead>
                <TableHead className="text-center">Link Clicks</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmails.map((email) => (
                <TableRow key={email.id}>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      {getStatusIcon(email.status)}
                      {email.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{email.subject}</TableCell>
                  <TableCell>{email.recipient}</TableCell>
                  <TableCell>{format(new Date(email.sentAt), "PP")}</TableCell>
                  <TableCell>
                    {email.readAt ? format(new Date(email.readAt), "PP") : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {email.clickedLinks && email.clickedLinks.length > 0 ? (
                      <Badge variant="secondary">
                        <MousePointer className="h-3 w-3 mr-1" />
                        {email.clickedLinks.length}
                      </Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedTracking(email)}
                        >
                          Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Email Tracking Details</DialogTitle>
                          <DialogDescription>
                            View detailed tracking information for this email.
                          </DialogDescription>
                        </DialogHeader>
                        {selectedTracking && (
                          <EmailTrackingDetails tracking={selectedTracking} />
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-10 border rounded-md bg-muted/50">
          <p className="text-muted-foreground">No tracked emails found</p>
        </div>
      )}
    </div>
  );
};

export default TrackedEmails;
