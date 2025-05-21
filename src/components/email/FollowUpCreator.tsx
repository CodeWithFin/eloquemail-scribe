// Follow-up creation component
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';

export interface FollowUpDetails {
  emailId: string;
  subject: string; 
  recipient: string;
  dueDate: Date;
  notes?: string;
  priority: 'high' | 'medium' | 'low';
}

interface FollowUpCreatorProps {
  emailId?: string;
  subject?: string;
  recipient?: string;
  onFollowUpCreated: (followUp: FollowUpDetails) => void;
}

const FollowUpCreator: React.FC<FollowUpCreatorProps> = ({
  emailId = '',
  subject = '',
  recipient = '',
  onFollowUpCreated
}) => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [notes, setNotes] = useState<string>('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [localSubject, setLocalSubject] = useState(subject);
  const [localRecipient, setLocalRecipient] = useState(recipient);

  const handleCreateFollowUp = () => {
    if (!date || !localSubject || !localRecipient) {
      return;
    }

    onFollowUpCreated({
      emailId,
      subject: localSubject,
      recipient: localRecipient,
      dueDate: date,
      notes,
      priority
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>Set Follow-Up</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Follow-Up Reminder</DialogTitle>
          <DialogDescription>
            Create a follow-up reminder for this email
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={localSubject}
              onChange={(e) => setLocalSubject(e.target.value)}
              placeholder="Re: Project Update"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="recipient">Recipient</Label>
            <Input
              id="recipient"
              value={localRecipient}
              onChange={(e) => setLocalRecipient(e.target.value)}
              placeholder="recipient@example.com"
            />
          </div>

          <div className="grid gap-2">
            <Label>Follow-Up Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(value: 'high' | 'medium' | 'low') => setPriority(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this follow-up"
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateFollowUp} disabled={!date || !localSubject || !localRecipient}>
            Create Follow-Up
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FollowUpCreator;
