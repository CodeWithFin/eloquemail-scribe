import React from 'react';
import { format } from 'date-fns';
import { ScheduledEmail } from '@/services/scheduling/types';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ScheduledEmailCardProps {
  email: ScheduledEmail;
  onDelete: (id: string) => void;
  onEdit: (email: ScheduledEmail) => void;
}

const ScheduledEmailCard: React.FC<ScheduledEmailCardProps> = ({ email, onDelete, onEdit }) => {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium">{email.email.subject || '(No subject)'}</h3>
            <p className="text-sm text-gray-500">To: {email.email.to}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(email)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(email.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <Clock className="h-4 w-4 mr-2" />
          Scheduled for: {format(new Date(email.scheduledTime), 'PPp')}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          {email.email.body}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduledEmailCard;
