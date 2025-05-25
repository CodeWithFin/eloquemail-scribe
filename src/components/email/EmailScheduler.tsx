// Email scheduling component for the compose screen
import React, { useState, useEffect } from 'react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export interface ScheduleOptions {
  date: Date;
  time: string;
}

interface EmailSchedulerProps {
  onSchedule: (options: ScheduleOptions) => void;
  disabled?: boolean;
  initialScheduledTime?: string;  // ISO date string when editing a scheduled email
}

const EMAIL_TIMES = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"
];

const EmailScheduler: React.FC<EmailSchedulerProps> = ({ 
  onSchedule, 
  disabled = false,
  initialScheduledTime 
}) => {
  const [date, setDate] = useState<Date | undefined>(
    initialScheduledTime ? new Date(initialScheduledTime) : undefined
  );
  const [time, setTime] = useState<string>(
    initialScheduledTime 
      ? format(new Date(initialScheduledTime), 'HH:mm')
      : ""
  );
  const [open, setOpen] = useState(false);

  const handleSchedule = () => {
    if (date && time) {
      // Combine date and time
      const scheduledDateTime = new Date(date);
      const [hours, minutes] = time.split(':').map(Number);
      scheduledDateTime.setHours(hours, minutes, 0, 0);
      
      // Ensure the schedule is not in the past
      if (scheduledDateTime <= new Date()) {
        alert('Cannot schedule an email in the past. Please select a future date and time.');
        return;
      }
      
      onSchedule({ date, time });
      setOpen(false);
    }
  };

  const isScheduleComplete = date && time;

  const currentTime = new Date();
  // Round to the nearest 30 minutes for default selection
  const minutes = currentTime.getMinutes();
  const roundedMinutes = minutes < 30 ? 30 : 0;
  let hours = currentTime.getHours();
  if (minutes >= 30 && roundedMinutes === 0) {
    hours += 1;
  }
  
  // Default time (next 30 min slot)
  const defaultTime = `${hours.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "flex items-center gap-2",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="h-4 w-4" />
          {date && time ? (
            <span>
              {format(date, "MMM d")} at {time}
            </span>
          ) : (
            <span>Schedule</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 pb-0">
          <h3 className="font-medium text-sm mb-2">Schedule Send</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Select when you'd like this email to be sent
          </p>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          disabled={(date) => date < new Date() || date > new Date(new Date().setMonth(new Date().getMonth() + 3))}
          initialFocus
          className="p-3"
        />
        <div className="p-4 pt-2 space-y-2">
          <div className="space-y-1">
            <Label htmlFor="time">Time</Label>
            <Select 
              value={time} 
              onValueChange={(value) => setTime(value)}
            >
              <SelectTrigger id="time" className="w-full">
                <SelectValue placeholder="Select time">
                  {time ? (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{time}</span>
                    </div>
                  ) : (
                    "Select time"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {EMAIL_TIMES.map((timeOption) => (
                  <SelectItem key={timeOption} value={timeOption}>
                    {timeOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="w-full mt-4"
            disabled={!isScheduleComplete}
            onClick={handleSchedule}
          >
            Schedule
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmailScheduler;
