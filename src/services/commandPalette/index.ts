// Command Registry for the Command Palette

export interface Command {
  id: string;
  title: string;
  shortcut?: string;
  section: string;
  keywords?: string[];
  perform: () => void;
  icon?: React.ReactNode;
}

// Global registry of all available commands
let commands: Command[] = [];

// Register a command in the registry
export const registerCommand = (command: Command): void => {
  // Check if command with same ID already exists and replace it
  const existingIndex = commands.findIndex(cmd => cmd.id === command.id);
  if (existingIndex !== -1) {
    commands[existingIndex] = command;
  } else {
    commands.push(command);
  }
};

// Register multiple commands at once
export const registerCommands = (cmds: Command[]): void => {
  cmds.forEach(cmd => registerCommand(cmd));
};

// Unregister a command by its ID
export const unregisterCommand = (id: string): void => {
  commands = commands.filter(cmd => cmd.id !== id);
};

// Get all registered commands, optionally filtered by section
export const getCommands = (section?: string): Command[] => {
  if (section) {
    return commands.filter(cmd => cmd.section === section);
  }
  return commands;
};

// Search for commands by title or keywords
export const searchCommands = (query: string): Command[] => {
  if (!query) return commands;
  
  const lowerQuery = query.toLowerCase();
  return commands.filter(cmd => 
    cmd.title.toLowerCase().includes(lowerQuery) || 
    cmd.id.toLowerCase().includes(lowerQuery) ||
    cmd.section.toLowerCase().includes(lowerQuery) ||
    cmd.keywords?.some(k => k.toLowerCase().includes(lowerQuery))
  );
};

// Execute a command by its ID
export const executeCommand = (id: string): boolean => {
  const command = commands.find(cmd => cmd.id === id);
  if (command) {
    command.perform();
    return true;
  }
  return false;
};

// Map of keyboard shortcuts to command IDs
let shortcuts: Record<string, string> = {};

// Register a keyboard shortcut
export const registerShortcut = (shortcut: string, commandId: string): void => {
  shortcuts[shortcut] = commandId;
};

// Get the command ID associated with a shortcut
export const getCommandForShortcut = (shortcut: string): string | undefined => {
  return shortcuts[shortcut];
};

// Handle keyboard events to execute commands
export const handleKeyDown = (event: KeyboardEvent): boolean => {
  // Build shortcut string (e.g., "ctrl+shift+p")
  const keys: string[] = [];
  if (event.ctrlKey) keys.push('ctrl');
  if (event.metaKey) keys.push('meta');
  if (event.altKey) keys.push('alt');
  if (event.shiftKey) keys.push('shift');
  if (event.key !== 'Control' && 
      event.key !== 'Meta' && 
      event.key !== 'Alt' && 
      event.key !== 'Shift') {
    keys.push(event.key.toLowerCase());
  }
  
  const shortcut = keys.join('+');
  const commandId = shortcuts[shortcut];
  
  if (commandId) {
    event.preventDefault();
    return executeCommand(commandId);
  }
  
  return false;
};
