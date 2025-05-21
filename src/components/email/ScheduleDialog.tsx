import React, { useState } from 'react';
import { addDays, format, parse, isValid, isBefore } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Clock, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface ScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (scheduledTime: string) => void;
}

const ScheduleDialog: React.FC<ScheduleDialogProps> = ({ isOpen, onClose, onSchedule }) => {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [time, setTime] = useState('09:00');

  const handleSchedule = () => {
    if (!date) {
      toast({
        title: "Date required",
        description: "Please select a date",
        variant: "destructive"
      });
      return;
    }

    const scheduledTime = parse(time, 'HH:mm', date);
    
    if (!isValid(scheduledTime)) {
      toast({
        title: "Invalid time",
        description: "Please enter a valid time",
        variant: "destructive"
      });
      return;
    }

    if (isBefore(scheduledTime, new Date())) {
      toast({
        title: "Invalid time",
        description: "Scheduled time must be in the future",
        variant: "destructive"
      });
      return;
    }

    onSchedule(scheduledTime.toISOString());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Schedule Email
          </DialogTitle>
          <DialogDescription>
            Choose when you want this email to be sent
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Date</Label>
            <div className="mt-1">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) => isBefore(date, new Date())}
                initialFocus
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1"
            />
          </div>
          
          {date && (
            <p className="text-sm text-gray-500">
              Email will be sent on {format(date, 'PPPP')} at {time}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSchedule}>
            <CalendarIcon className="h-4 w-4 mr-2" />
            Schedule Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleDialog;
