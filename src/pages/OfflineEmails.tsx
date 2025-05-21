import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  CloudOff, 
  MailOpen, 
  FileClock, 
  Send,
  Trash2,
  Edit,
  RefreshCw,
  Wifi,
  AlertCircle
} from 'lucide-react';
import { 
  getOfflineEmails, 
  getOfflineEmailsByStatus,
  deleteOfflineEmail, 
  updateOfflineEmail,
  processPendingOfflineEmails,
  isOnline,
  OfflineEmail
} from '@/services/email/offlineService';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { format, parseISO } from 'date-fns';
import ComposeEmailOffline from '@/components/email/ComposeEmail.offline';

const OfflineEmails: React.FC = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [emails, setEmails] = useState<OfflineEmail[]>([]);
  const [isComposing, setIsComposing] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(isOnline());
  const [syncing, setSyncing] = useState(false);
  const navigate = useNavigate();

  // Load emails based on the active tab
  useEffect(() => {
    loadEmails();
  }, [activeTab]);

  // Check network status
  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadEmails = () => {
    let filteredEmails: OfflineEmail[];
    
    if (activeTab === 'all') {
      filteredEmails = getOfflineEmails();
    } else {
      filteredEmails = getOfflineEmailsByStatus(activeTab as OfflineEmail['status']);
    }
    
    // Filter by search query if present
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredEmails = filteredEmails.filter(
        email => 
          email.subject.toLowerCase().includes(query) || 
          email.to.some(recipient => recipient.toLowerCase().includes(query)) ||
          email.body.toLowerCase().includes(query)
      );
    }
    
    // Sort by creation date (newest first)
    filteredEmails.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    setEmails(filteredEmails);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this email?')) {
      deleteOfflineEmail(id);
      toast({
        title: "Email deleted",
        description: "The email has been removed from offline storage"
      });
      loadEmails();
    }
  };

  const handleEdit = (email: OfflineEmail) => {
    navigate('/compose', { 
      state: { 
        initialTo: email.to.join(', '),
        initialSubject: email.subject,
        initialBody: email.body,
        offline: true,
        editingId: email.id
      } 
    });
  };

  const handleSendNow = (email: OfflineEmail) => {
    if (!networkStatus) {
      toast({
        title: "You're offline",
        description: "Can't send emails while offline",
        variant: "destructive"
      });
      return;
    }
    
    updateOfflineEmail(email.id, { status: 'pending' });
    toast({
      title: "Email queued",
      description: "Email marked for sending"
    });
    loadEmails();
  };

  const handleSync = async () => {
    if (!networkStatus) {
      toast({
        title: "You're offline",
        description: "Can't sync emails while offline",
        variant: "destructive"
      });
      return;
    }

    setSyncing(true);
    // This would normally call your email service's send method
    const results = await processPendingOfflineEmails(
      async (email) => {
        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Sending email:', email);
        return true; // Simulating success
      }
    );
    
    const successCount = results.success.length;
    const failCount = results.failed.length;
    
    if (successCount > 0) {
      toast({
        title: "Emails sent",
        description: `Successfully sent ${successCount} email${successCount !== 1 ? 's' : ''}`
      });
    }
    
    if (failCount > 0) {
      toast({
        title: "Some emails failed to send",
        description: `${failCount} email${failCount !== 1 ? 's' : ''} couldn't be sent and will be retried later`,
        variant: "destructive"
      });
    }
    
    setSyncing(false);
    loadEmails();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadEmails();
  };

  return (
    <div className="container py-8">
      {isComposing ? (
        <ComposeEmailOffline onCancel={() => setIsComposing(false)} />
      ) : (
        <>
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Offline Emails</h1>
              <p className="text-muted-foreground mt-1">
                Manage emails saved for offline use and sending
              </p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => setIsComposing(true)}>
                <Plus className="mr-2 h-4 w-4" /> New Email
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSync} 
                disabled={!networkStatus || syncing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync Now"}
              </Button>
            </div>
          </div>
          
          {!networkStatus && (
            <Alert className="mb-6">
              <CloudOff className="h-4 w-4" />
              <AlertTitle>Offline Mode</AlertTitle>
              <AlertDescription>
                You're currently offline. Your emails will be saved locally and sent when you're back online.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Your Offline Emails</span>
                <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                  networkStatus 
                    ? "bg-green-100 text-green-800" 
                    : "bg-amber-100 text-amber-800"
                }`}>
                  {networkStatus ? (
                    <>
                      <Wifi className="h-3 w-3" />
                      Online
                    </>
                  ) : (
                    <>
                      <CloudOff className="h-3 w-3" />
                      Offline
                    </>
                  )}
                </span>
              </CardTitle>
              <CardDescription>
                View and manage emails saved for offline access
              </CardDescription>
              <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center space-x-2 mt-2">
                <Input
                  type="text"
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="pending" className="flex items-center">
                    <FileClock className="mr-2 h-4 w-4" /> 
                    Pending
                  </TabsTrigger>
                  <TabsTrigger value="draft" className="flex items-center">
                    <MailOpen className="mr-2 h-4 w-4" /> 
                    Drafts
                  </TabsTrigger>
                  <TabsTrigger value="sent" className="flex items-center">
                    <Send className="mr-2 h-4 w-4" /> 
                    Sent
                  </TabsTrigger>
                  <TabsTrigger value="all" className="flex items-center">
                    All
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value={activeTab}>
                  <Table>
                    <TableCaption>
                      {emails.length === 0 ? (
                        <div className="text-center py-8">
                          <CloudOff className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                          <p>No {activeTab !== 'all' ? activeTab : ''} emails found</p>
                        </div>
                      ) : (
                        `Showing ${emails.length} ${activeTab !== 'all' ? activeTab : ''} emails`
                      )}
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">To</TableHead>
                        <TableHead className="w-[300px]">Subject</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emails.map((email) => (
                        <TableRow key={email.id}>
                          <TableCell className="font-medium truncate" title={email.to.join(', ')}>
                            {email.to.join(', ')}
                          </TableCell>
                          <TableCell className="truncate" title={email.subject}>
                            {email.subject || "(No subject)"}
                          </TableCell>
                          <TableCell>
                            {format(parseISO(email.createdAt), 'MMM d, yyyy h:mm a')}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={email.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {email.status === 'draft' && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleSendNow(email)}
                                  disabled={!networkStatus}
                                  title={!networkStatus ? "You're offline" : "Send now"}
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleEdit(email)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleDelete(email.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

// Status badge component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-800";
  let icon = null;
  let label = status;

  switch (status) {
    case 'pending':
      bgColor = "bg-amber-100";
      textColor = "text-amber-800";
      icon = <FileClock className="h-3 w-3 mr-1" />;
      label = "Pending";
      break;
    case 'sent':
      bgColor = "bg-green-100";
      textColor = "text-green-800";
      icon = <Send className="h-3 w-3 mr-1" />;
      label = "Sent";
      break;
    case 'draft':
      bgColor = "bg-blue-100";
      textColor = "text-blue-800";
      icon = <MailOpen className="h-3 w-3 mr-1" />;
      label = "Draft";
      break;
  }

  return (
    <span className={`px-2 py-1 text-xs rounded-full flex items-center w-fit ${bgColor} ${textColor}`}>
      {icon}
      {label}
    </span>
  );
};

export default OfflineEmails;