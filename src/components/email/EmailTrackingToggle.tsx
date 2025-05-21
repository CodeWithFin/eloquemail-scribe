// Email tracking toggle component
import React, { useState } from 'react';
import {
  Eye,
  MousePointer
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface TrackingOptions {
  trackOpens: boolean;
  trackClicks: boolean;
}

interface EmailTrackingToggleProps {
  onChange: (options: TrackingOptions) => void;
  defaultValue?: TrackingOptions;
}

const EmailTrackingToggle: React.FC<EmailTrackingToggleProps> = ({ 
  onChange, 
  defaultValue = { 
    trackOpens: false, 
    trackClicks: false 
  }
}) => {
  const [trackingOptions, setTrackingOptions] = useState<TrackingOptions>(defaultValue);

  const handleTrackingChange = (key: keyof TrackingOptions) => (checked: boolean) => {
    const newOptions = {
      ...trackingOptions,
      [key]: checked
    };
    setTrackingOptions(newOptions);
    onChange(newOptions);
  };

  return (
    <div className="flex flex-col gap-2 border rounded-md p-3 bg-muted/30">
      <h3 className="text-sm font-medium">Email Tracking Options</h3>
      
      <div className="flex items-center justify-between space-x-2 mt-1">
        <div className="flex items-center space-x-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="read-receipt" className="text-sm">Read Receipt</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="cursor-help">
                <span className="text-xs text-muted-foreground ml-1">ⓘ</span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">Track when recipients open your email</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Switch
          id="read-receipt"
          checked={trackingOptions.trackOpens}
          onCheckedChange={handleTrackingChange('trackOpens')}
        />
      </div>
      
      <div className="flex items-center justify-between space-x-2">
        <div className="flex items-center space-x-2">
          <MousePointer className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="link-tracking" className="text-sm">Link Tracking</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="cursor-help">
                <span className="text-xs text-muted-foreground ml-1">ⓘ</span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">Track when recipients click links in your email</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Switch
          id="link-tracking"
          checked={trackingOptions.trackClicks}
          onCheckedChange={handleTrackingChange('trackClicks')}
        />
      </div>
    </div>
  );
};

export default EmailTrackingToggle;
