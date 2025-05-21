import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { 
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { 
  searchCommands, 
  getCommands, 
  executeCommand, 
  registerShortcut, 
  handleKeyDown,
  type Command as CommandType
} from '@/services/commandPalette';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface CommandPaletteHandle {
  open: () => void;
  close: () => void;
}

// Default sections for the command palette
const commandSections = [
  "Navigation",
  "Email",
  "Templates",
  "AI Tools",
  "Settings",
  "View",
] as const;

type CommandSection = typeof commandSections[number];

const CommandPalette = forwardRef<CommandPaletteHandle>((_, ref) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [commands, setCommands] = useState<CommandType[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Register command palette shortcut (Ctrl+K or Cmd+K)
    registerShortcut('ctrl+k', 'command.palette.open');
    registerShortcut('meta+k', 'command.palette.open');

    // Set up global keyboard shortcut listener
    const keyDownHandler = (e: KeyboardEvent) => {
      handleKeyDown(e);
    };
    
    window.addEventListener('keydown', keyDownHandler);
    return () => {
      window.removeEventListener('keydown', keyDownHandler);
    };
  }, []);

  useEffect(() => {
    // Update commands when search query changes
    setCommands(search ? searchCommands(search) : getCommands());
  }, [search]);

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    close: () => setOpen(false)
  }));

  // Group commands by section
  const groupedCommands = commands.reduce<Record<string, CommandType[]>>((acc, command) => {
    if (!acc[command.section]) {
      acc[command.section] = [];
    }
    acc[command.section].push(command);
    return acc;
  }, {});

  const handleSelect = (command: CommandType) => {
    executeCommand(command.id);
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <CommandInput
          placeholder="Type a command or search..."
          className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          value={search}
          onValueChange={setSearch}
        />
      </div>
      <CommandList className="max-h-[300px] overflow-y-auto">
        <CommandEmpty>No results found.</CommandEmpty>
        
        {Object.entries(groupedCommands).map(([section, sectionCommands], index) => (
          <React.Fragment key={section}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={section}>
              {sectionCommands.map(command => (
                <CommandItem
                  key={command.id}
                  onSelect={() => handleSelect(command)}
                  className="cursor-pointer"
                >
                  {command.icon && <span className="mr-2">{command.icon}</span>}
                  {command.title}
                  {command.shortcut && (
                    <CommandShortcut>{command.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  );
});

CommandPalette.displayName = "CommandPalette";

export default CommandPalette;
