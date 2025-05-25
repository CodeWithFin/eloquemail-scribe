// Smart recipient selector with suggestions and contact integration
import React, { useState, useEffect, useRef } from 'react';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { X } from 'lucide-react';

// Sample contact data - in a real app, this would come from a service
const DUMMY_CONTACTS = [
  { email: 'alice@example.com', name: 'Alice Johnson', avatar: '/placeholder.svg', frequentlyUsed: true },
  { email: 'bob@example.com', name: 'Bob Smith', avatar: '/placeholder.svg', frequentlyUsed: true },
  { email: 'charlie@example.com', name: 'Charlie Brown', avatar: '/placeholder.svg', frequentlyUsed: false },
  { email: 'david@example.com', name: 'David Miller', avatar: '/placeholder.svg', frequentlyUsed: false },
  { email: 'emma@example.com', name: 'Emma Wilson', avatar: '/placeholder.svg', frequentlyUsed: true },
  { email: 'frank@example.com', name: 'Frank Thomas', avatar: '/placeholder.svg', frequentlyUsed: false },
  { email: 'grace@example.com', name: 'Grace Lee', avatar: '/placeholder.svg', frequentlyUsed: false },
  { email: 'henry@example.com', name: 'Henry Carter', avatar: '/placeholder.svg', frequentlyUsed: false },
];

interface RecipientSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  className?: string;
}

interface Contact {
  email: string;
  name: string;
  avatar: string;
  frequentlyUsed: boolean;
}

const RecipientSelector: React.FC<RecipientSelectorProps> = ({ 
  value, 
  onChange, 
  placeholder = "Enter email addresses...",
  label,
  className = ""
}) => {
  const [inputValue, setInputValue] = useState('');
  const [recipients, setRecipients] = useState<Contact[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Parse initial value into recipients
  useEffect(() => {
    const emails = value.split(',').filter(email => email.trim() !== '');
    const newRecipients = emails.map(email => {
      const trimmedEmail = email.trim();
      // Try to find contact with matching email
      const contact = DUMMY_CONTACTS.find(c => c.email.toLowerCase() === trimmedEmail.toLowerCase());
      if (contact) {
        return contact;
      }
      // Create a new contact object if not found
      return {
        email: trimmedEmail,
        name: '',
        avatar: '',
        frequentlyUsed: false
      };
    });
    
    setRecipients(newRecipients);
  }, []);
  
  // Update filteredContacts when input changes
  useEffect(() => {
    if (!inputValue.trim()) {
      // Show frequently used contacts when no input
      setFilteredContacts(DUMMY_CONTACTS.filter(contact => 
        contact.frequentlyUsed && 
        !recipients.some(r => r.email === contact.email)
      ));
      return;
    }
    
    const filtered = DUMMY_CONTACTS.filter(contact => {
      // Don't show contacts that are already selected
      if (recipients.some(r => r.email === contact.email)) {
        return false;
      }
      
      // Filter based on name or email containing input value
      return (
        contact.name.toLowerCase().includes(inputValue.toLowerCase()) ||
        contact.email.toLowerCase().includes(inputValue.toLowerCase())
      );
    });
    
    setFilteredContacts(filtered);
  }, [inputValue, recipients]);
  
  // Update parent value when recipients change
  useEffect(() => {
    const emailString = recipients.map(r => r.email).join(', ');
    onChange(emailString);
  }, [recipients, onChange]);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle adding recipient on comma or Enter
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      
      if (inputValue.trim()) {
        addRecipient(inputValue);
      }
    }
    
    // Handle removing last recipient on backspace if input is empty
    if (e.key === 'Backspace' && !inputValue && recipients.length > 0) {
      setRecipients(prev => prev.slice(0, -1));
    }
  };
  
  const addRecipient = (input: string) => {
    // Remove any commas that might have been entered
    const emails = input.split(',').map(e => e.trim()).filter(e => e !== '');
    
    emails.forEach(email => {
      // Check if it's already in recipients
      if (recipients.some(r => r.email.toLowerCase() === email.toLowerCase())) {
        return;
      }
      
      // Check if it matches a contact
      const existingContact = DUMMY_CONTACTS.find(
        c => c.email.toLowerCase() === email.toLowerCase()
      );
      
      if (existingContact) {
        setRecipients(prev => [...prev, existingContact]);
      } else {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(email)) {
          setRecipients(prev => [
            ...prev, 
            { email, name: '', avatar: '', frequentlyUsed: false }
          ]);
        }
      }
    });
    
    setInputValue('');
  };
  
  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r.email !== email));
  };
  
  const selectContact = (contact: Contact) => {
    if (!recipients.some(r => r.email === contact.email)) {
      setRecipients([...recipients, contact]);
    }
    setInputValue('');
    setIsOpen(false);
    inputRef.current?.focus();
  };
  
  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-1">
        <label className="block text-sm font-medium">{label}:</label>
      </div>
      
      <div className="flex flex-wrap items-center gap-1 p-2 border rounded-md focus-within:ring-1 focus-within:ring-gray-400 dark:focus-within:ring-gray-600">
        {recipients.map((recipient, index) => (
          <Badge 
            key={index} 
            variant="secondary"
            className="h-6 px-2 flex items-center gap-1"
          >
            {recipient.name || recipient.email}
            <button 
              type="button" 
              onClick={() => removeRecipient(recipient.email)}
              className="rounded-full hover:bg-gray-300/30"
            >
              <X size={14} />
            </button>
          </Badge>
        ))}
        
        <div className="relative flex-1 min-w-[150px]">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => {
              // Delay closing to allow clicking on items
              setTimeout(() => setIsOpen(false), 200);
              // Add recipient if there's text when blurring
              if (inputValue.trim()) {
                addRecipient(inputValue);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={recipients.length === 0 ? placeholder : ''}
            className="w-full border-0 focus:ring-0 focus:outline-none p-0 bg-transparent min-w-[150px]"
          />
          
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-background shadow-md rounded-md overflow-hidden border">
              <Command>
                <CommandInput placeholder="Search contacts..." value={inputValue} onValueChange={setInputValue} />
                <CommandList>
                  {filteredContacts.length === 0 && inputValue.trim() !== '' && (
                    <CommandEmpty>
                      Press Enter to add "{inputValue}"
                    </CommandEmpty>
                  )}
                  
                  {filteredContacts.length > 0 && (
                    <CommandGroup>
                      {filteredContacts.map((contact) => (
                        <CommandItem
                          key={contact.email}
                          onSelect={() => selectContact(contact)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={contact.avatar} alt={contact.name} />
                            <AvatarFallback>
                              {contact.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 truncate">
                            <div className="font-medium">{contact.name}</div>
                            <div className="text-xs text-gray-500">{contact.email}</div>
                          </div>
                          {contact.frequentlyUsed && (
                            <Badge variant="outline" className="ml-auto">Frequent</Badge>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipientSelector;
