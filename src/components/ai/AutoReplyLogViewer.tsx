import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  MessagesSquare, 
  Clock, 
  BarChart, 
  AlertCircle, 
  Trash2, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import loggingService from '@/services/ai/loggingService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const AutoReplyLogViewer: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [logs, setLogs] = useState<any[]>([]);
  const [requireAttentionLogs, setRequireAttentionLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Load logs on initial render
  useEffect(() => {
    refreshData();
  }, []);
  
  const refreshData = () => {
    setIsRefreshing(true);
    
    try {
      // Get all logs
      const allLogs = loggingService.getAllLogs();
      setLogs(allLogs);
      
      // Get logs requiring attention
      const attentionLogs = loggingService.getLogsRequiringAttention();
      setRequireAttentionLogs(attentionLogs);
      
      // Get stats
      const qualityStats = loggingService.getQualityStats();
      setStats(qualityStats);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast({
        title: "Error loading logs",
        description: "Failed to load auto-reply logs",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const handleDeleteLog = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      loggingService.deleteLog(id);
      toast({
        title: "Log deleted",
        description: "The log entry has been removed"
      });
      refreshData();
    } catch (error) {
      console.error('Error deleting log:', error);
      toast({
        title: "Error deleting log",
        description: "Failed to delete the log entry",
        variant: "destructive"
      });
    }
  };
  
  const handleClearAllLogs = () => {
    try {
      loggingService.clearAllLogs();
      toast({
        title: "Logs cleared",
        description: "All log entries have been removed"
      });
      refreshData();
    } catch (error) {
      console.error('Error clearing logs:', error);
      toast({
        title: "Error clearing logs",
        description: "Failed to clear log entries",
        variant: "destructive"
      });
    }
  };
  
  const handleToggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };
  
  const handleShowDetails = (log: any) => {
    setSelectedLog(log);
    setShowDetailDialog(true);
  };
  
  const handleFeedback = (id: string, rating: number) => {
    try {
      loggingService.addFeedbackToLog(id, rating);
      toast({
        title: "Feedback recorded",
        description: "Thank you for your feedback"
      });
      refreshData();
    } catch (error) {
      console.error('Error adding feedback:', error);
      toast({
        title: "Error recording feedback",
        description: "Failed to save your feedback",
        variant: "destructive"
      });
    }
  };
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  const activeTabLogs = activeTab === 'attention' ? requireAttentionLogs : logs;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">📊 Auto-Reply Quality Review</CardTitle>
        <CardDescription>
          Monitor and evaluate auto-generated email replies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MessagesSquare className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm font-medium">Total Replies</span>
                  </div>
                  <span className="text-xl font-bold">{stats.totalReplies}</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {stats.usedReplies} used ({Math.round((stats.usedReplies / Math.max(stats.totalReplies, 1)) * 100)}%)
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                    <span className="text-sm font-medium">Human Review</span>
                  </div>
                  <span className="text-xl font-bold">{stats.humanReviewRequired}</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {Math.round((stats.humanReviewRequired / Math.max(stats.totalReplies, 1)) * 100)}% needed review
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="text-sm font-medium">Avg. Rating</span>
                  </div>
                  <span className="text-xl font-bold">{stats.averageRating.toFixed(1)}</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Confidence: {Math.round(stats.averageConfidence * 100)}%
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Replies</TabsTrigger>
              <TabsTrigger value="attention">
                Needs Attention
                {requireAttentionLogs.length > 0 && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    {requireAttentionLogs.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Refresh
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearAllLogs}
              disabled={logs.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
        </div>
        
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Date</TableHead>
                <TableHead>Email Subject</TableHead>
                <TableHead className="w-[120px]">Intent</TableHead>
                <TableHead className="w-[100px]">Confidence</TableHead>
                <TableHead className="w-[80px]">Used</TableHead>
                <TableHead className="w-[100px]">Rating</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeTabLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                    No log entries found
                  </TableCell>
                </TableRow>
              ) : (
                activeTabLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <TableRow 
                      className={`cursor-pointer ${expandedLogId === log.id ? 'bg-muted/50' : ''}`}
                      onClick={() => handleToggleExpand(log.id)}
                    >
                      <TableCell>{formatDate(log.timestamp)}</TableCell>
                      <TableCell className="font-medium">
                        {log.emailSubject || 'No subject'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {log.analysis.intent.charAt(0).toUpperCase() + log.analysis.intent.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                            <div 
                              className="h-2.5 rounded-full" 
                              style={{ 
                                width: `${Math.round(log.generatedReply.metadata.confidence * 100)}%`,
                                backgroundColor: 
                                  log.generatedReply.metadata.confidence > 0.7 ? 'rgb(34, 197, 94)' : 
                                  log.generatedReply.metadata.confidence > 0.5 ? 'rgb(234, 179, 8)' : 
                                  'rgb(239, 68, 68)'
                              }}
                            ></div>
                          </div>
                          <span className="text-xs">
                            {Math.round(log.generatedReply.metadata.confidence * 100)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.wasUsed ? (
                          <Badge className="bg-green-500">Yes</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.userFeedback?.rating ? (
                          <div className="flex items-center">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < log.userFeedback.rating
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFeedback(log.id, 5);
                              }}
                            >
                              <ThumbsUp className="h-4 w-4 text-gray-500 hover:text-green-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFeedback(log.id, 1);
                              }}
                            >
                              <ThumbsDown className="h-4 w-4 text-gray-500 hover:text-red-500" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowDetails(log);
                            }}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:bg-red-50"
                            onClick={(e) => handleDeleteLog(log.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {expandedLogId === log.id ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {expandedLogId === log.id && (
                      <TableRow className="bg-muted/20">
                        <TableCell colSpan={7} className="p-4">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium mb-1">Generated Reply:</h4>
                              <div className="bg-white dark:bg-gray-800 border rounded-md p-3 text-sm whitespace-pre-wrap">
                                {log.generatedReply.text}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium mb-1">Email Analysis:</h4>
                                <div className="space-y-1 text-xs">
                                  <div><strong>Intent:</strong> {log.analysis.intent}</div>
                                  <div><strong>Urgency:</strong> {log.analysis.urgency}</div>
                                  <div><strong>Questions:</strong> {log.analysis.questions.length}</div>
                                  <div><strong>Action Items:</strong> {log.analysis.actionItems.length}</div>
                                  <div><strong>Sentiment:</strong> {log.analysis.sentiment.tone}</div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium mb-1">Reply Details:</h4>
                                <div className="space-y-1 text-xs">
                                  <div>
                                    <strong>Human Review:</strong> 
                                    {log.generatedReply.metadata.requiresHumanReview ? 'Yes' : 'No'}
                                  </div>
                                  {log.generatedReply.metadata.reviewReason && (
                                    <div>
                                      <strong>Reason:</strong> {log.generatedReply.metadata.reviewReason}
                                    </div>
                                  )}
                                  <div>
                                    <strong>Used:</strong> {log.wasUsed ? 'Yes' : 'No'}
                                  </div>
                                  {log.wasUsed && (
                                    <>
                                      <div>
                                        <strong>Edited:</strong> {log.wasEdited ? 'Yes' : 'No'}
                                      </div>
                                      <div>
                                        <strong>Time to Use:</strong> {Math.round(log.timeTaken / 1000)}s
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleShowDetails(log)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              View Full Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      {/* Detailed View Dialog */}
      {selectedLog && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reply Details</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Original Email</h3>
                  <div className="border rounded-md p-3 text-sm whitespace-pre-wrap h-[200px] overflow-y-auto">
                    {selectedLog.emailContent}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Generated Reply</h3>
                  <div className="border rounded-md p-3 text-sm whitespace-pre-wrap h-[200px] overflow-y-auto">
                    {selectedLog.generatedReply.text}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Metadata</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-xs">
                      <div><strong>Date:</strong> {formatDate(selectedLog.timestamp)}</div>
                      <div><strong>Subject:</strong> {selectedLog.emailSubject || 'No subject'}</div>
                      <div><strong>Sender:</strong> {selectedLog.emailSender || 'Unknown'}</div>
                      <div>
                        <strong>Confidence:</strong> {Math.round(selectedLog.generatedReply.metadata.confidence * 100)}%
                      </div>
                      <div>
                        <strong>Human Review:</strong> {selectedLog.generatedReply.metadata.requiresHumanReview ? 'Yes' : 'No'}
                      </div>
                      {selectedLog.generatedReply.metadata.reviewReason && (
                        <div><strong>Reason:</strong> {selectedLog.generatedReply.metadata.reviewReason}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Content Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-xs">
                      <div><strong>Intent:</strong> {selectedLog.analysis.intent}</div>
                      <div><strong>Urgency:</strong> {selectedLog.analysis.urgency}</div>
                      <div><strong>Sentiment:</strong> {selectedLog.analysis.sentiment.tone}</div>
                      <div><strong>Formality:</strong> {selectedLog.analysis.formality || 'Unknown'}</div>
                      <div><strong>Questions:</strong> {selectedLog.analysis.questions.length}</div>
                      <div><strong>Action Items:</strong> {selectedLog.analysis.actionItems.length}</div>
                      <div><strong>Deadlines:</strong> {selectedLog.analysis.deadlines.length}</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Usage Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-xs">
                      <div><strong>Used:</strong> {selectedLog.wasUsed ? 'Yes' : 'No'}</div>
                      {selectedLog.wasUsed && (
                        <>
                          <div><strong>Edited:</strong> {selectedLog.wasEdited ? 'Yes' : 'No'}</div>
                          <div><strong>Time to Use:</strong> {Math.round(selectedLog.timeTaken / 1000)} seconds</div>
                        </>
                      )}
                      <div className="pt-2">
                        <strong>Rating:</strong>
                        {selectedLog.userFeedback?.rating ? (
                          <div className="flex items-center mt-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < selectedLog.userFeedback.rating
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="ml-1">Not rated</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {selectedLog.analysis.questions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Questions Detected</h3>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {selectedLog.analysis.questions.map((q: string, i: number) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedLog.analysis.actionItems.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Action Items Detected</h3>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {selectedLog.analysis.actionItems.map((a: string, i: number) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

export default AutoReplyLogViewer;
