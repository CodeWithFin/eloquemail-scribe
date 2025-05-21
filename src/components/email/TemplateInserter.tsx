import React, { useState, useEffect, useRef } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FileText, BookMarked } from 'lucide-react';
import { 
  EmailTemplate, 
  EmailSnippet, 
  getTemplates, 
  getSnippets,
  applyTemplateVariables
} from '@/services/templates';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface TemplateInserterProps {
  onInsert: (content: string) => void;
}

const TemplateInserter: React.FC<TemplateInserterProps> = ({ onInsert }) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [snippets, setSnippets] = useState<EmailSnippet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    loadTemplatesAndSnippets();
    
    // Add keyboard shortcut to open templates
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadTemplatesAndSnippets = () => {
    setTemplates(getTemplates());
    setSnippets(getSnippets());
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSnippets = snippets.filter(snippet =>
    snippet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    snippet.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectTemplate = (template: EmailTemplate) => {
    // Extract variables from the template content
    const variableRegex = /{([^}]+)}/g;
    const matches = [...template.content.matchAll(variableRegex)];
    const variables: Record<string, string> = {};
    
    matches.forEach(match => {
      const variable = match[1];
      if (!variables[variable]) {
        variables[variable] = '';
      }
    });
    
    setSelectedTemplate(template);
    setTemplateVariables(variables);
    setShowDialog(true);
    setIsOpen(false); // Close the popover
  };

  const handleSelectSnippet = (snippet: EmailSnippet) => {
    onInsert(snippet.content);
    setIsOpen(false); // Close the popover
    
    toast({
      title: "Snippet inserted",
      description: `Inserted snippet: ${snippet.name}`
    });
  };

  const handleInsertTemplate = () => {
    if (!selectedTemplate) return;
    
    const content = applyTemplateVariables(selectedTemplate.content, templateVariables);
    onInsert(content);
    setShowDialog(false);
    
    toast({
      title: "Template inserted",
      description: `Inserted template: ${selectedTemplate.name}`
    });
  };

  const handleVariableChange = (variable: string, value: string) => {
    setTemplateVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            size="sm"
            className="text-xs"
            title="Insert Template (Ctrl+T)"
          >
            <FileText size={14} className="mr-1" />
            Templates
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2">
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates & snippets..."
                className="pl-8"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            
            <Tabs defaultValue="templates">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="templates" className="text-xs py-1">
                  <FileText className="h-3 w-3 mr-1" />
                  Templates
                </TabsTrigger>
                <TabsTrigger value="snippets" className="text-xs py-1">
                  <BookMarked className="h-3 w-3 mr-1" />
                  Snippets
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="templates" className="mt-2">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-1">
                    {filteredTemplates.length > 0 ? (
                      filteredTemplates.map(template => (
                        <div
                          key={template.id}
                          onClick={() => handleSelectTemplate(template)}
                          className="flex flex-col p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{template.name}</span>
                            <span className="text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full">
                              {template.category}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                            {template.content}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-gray-500">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-70" />
                        <p className="text-sm">No templates found</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="snippets" className="mt-2">
                <ScrollArea className="h-[300px]">
                  <div className="space-y-1">
                    {filteredSnippets.length > 0 ? (
                      filteredSnippets.map(snippet => (
                        <div
                          key={snippet.id}
                          onClick={() => handleSelectSnippet(snippet)}
                          className="flex flex-col p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <span className="font-medium text-sm">{snippet.name}</span>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                            {snippet.content}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-gray-500">
                        <BookMarked className="h-8 w-8 mx-auto mb-2 opacity-70" />
                        <p className="text-sm">No snippets found</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
            
            <div className="pt-2 text-xs text-gray-500 border-t">
              <p>Select a template or snippet to insert it into your email.</p>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Customize Template</DialogTitle>
            <DialogDescription>
              Fill in the variables for your template
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {Object.keys(templateVariables).map((variable) => (
              <div key={variable} className="grid gap-2">
                <Label htmlFor={variable}>{variable}</Label>
                <Input
                  id={variable}
                  value={templateVariables[variable]}
                  onChange={(e) => handleVariableChange(variable, e.target.value)}
                  placeholder={`Enter ${variable}`}
                />
              </div>
            ))}
            
            {Object.keys(templateVariables).length === 0 && (
              <div className="text-sm text-gray-500">
                This template has no variables to customize.
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleInsertTemplate}>
              Insert Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TemplateInserter;
