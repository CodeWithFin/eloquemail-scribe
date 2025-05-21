import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pen, Trash, Plus, FileText, BookMarked } from 'lucide-react';
import { 
  EmailTemplate, 
  EmailSnippet, 
  getTemplates, 
  getSnippets, 
  createTemplate, 
  createSnippet, 
  updateTemplate, 
  updateSnippet, 
  deleteTemplate, 
  deleteSnippet 
} from '@/services/templates';
import { useToast } from '@/hooks/use-toast';

interface TemplateCardProps {
  template: EmailTemplate;
  onEdit: () => void;
  onDelete: () => void;
  onSelect: () => void;
}

interface SnippetCardProps {
  snippet: EmailSnippet;
  onEdit: () => void;
  onDelete: () => void;
  onSelect: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onEdit, onDelete, onSelect }) => {
  const truncateContent = (content: string, maxLength: number = 100) => {
    return content.length > maxLength 
      ? content.substring(0, maxLength) + '...' 
      : content;
  };

  return (
    <Card className="cursor-pointer hover:border-eloquent-300 transition-colors">
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start">
          <div onClick={onSelect} className="flex-1">
            <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
            <span className="text-xs text-gray-500">{template.category}</span>
          </div>
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onEdit}>
              <Pen className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onDelete}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2" onClick={onSelect}>
        <p className="text-xs text-gray-600 whitespace-pre-line">
          {truncateContent(template.content)}
        </p>
      </CardContent>
    </Card>
  );
};

const SnippetCard: React.FC<SnippetCardProps> = ({ snippet, onEdit, onDelete, onSelect }) => {
  return (
    <Card className="cursor-pointer hover:border-eloquent-300 transition-colors">
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start">
          <div onClick={onSelect} className="flex-1">
            <CardTitle className="text-sm font-medium">{snippet.name}</CardTitle>
          </div>
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onEdit}>
              <Pen className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onDelete}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2" onClick={onSelect}>
        <p className="text-xs text-gray-600 whitespace-pre-line">
          {snippet.content}
        </p>
      </CardContent>
    </Card>
  );
};

interface TemplateManagerProps {
  onSelectTemplate: (template: EmailTemplate) => void;
  onSelectSnippet: (snippet: EmailSnippet) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ 
  onSelectTemplate, 
  onSelectSnippet 
}) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [snippets, setSnippets] = useState<EmailSnippet[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [dialogType, setDialogType] = useState<'template' | 'snippet'>('template');
  
  // Form state
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Business');

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTemplates(getTemplates());
    setSnippets(getSnippets());
  };

  const handleNewTemplate = () => {
    setDialogType('template');
    setEditMode(false);
    resetForm();
    setShowDialog(true);
  };

  const handleNewSnippet = () => {
    setDialogType('snippet');
    setEditMode(false);
    resetForm();
    setShowDialog(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setDialogType('template');
    setEditMode(true);
    setCurrentId(template.id);
    setName(template.name);
    setContent(template.content);
    setCategory(template.category);
    setShowDialog(true);
  };

  const handleEditSnippet = (snippet: EmailSnippet) => {
    setDialogType('snippet');
    setEditMode(true);
    setCurrentId(snippet.id);
    setName(snippet.name);
    setContent(snippet.content);
    setShowDialog(true);
  };

  const handleDeleteTemplate = (id: string) => {
    deleteTemplate(id);
    setTemplates(getTemplates());
    toast({
      title: "Template deleted",
      description: "The template has been deleted successfully."
    });
  };

  const handleDeleteSnippet = (id: string) => {
    deleteSnippet(id);
    setSnippets(getSnippets());
    toast({
      title: "Snippet deleted",
      description: "The snippet has been deleted successfully."
    });
  };

  const resetForm = () => {
    setCurrentId(null);
    setName('');
    setContent('');
    setCategory('Business');
  };

  const handleSave = () => {
    if (!name.trim() || !content.trim()) {
      toast({
        title: "Required fields",
        description: "Please fill out all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (dialogType === 'template') {
        if (editMode && currentId) {
          updateTemplate(currentId, { name, content, category });
        } else {
          createTemplate({ name, content, category });
        }
        setTemplates(getTemplates());
      } else {
        if (editMode && currentId) {
          updateSnippet(currentId, { name, content });
        } else {
          createSnippet({ name, content });
        }
        setSnippets(getSnippets());
      }

      toast({
        title: `${dialogType === 'template' ? 'Template' : 'Snippet'} ${editMode ? 'updated' : 'created'}`,
        description: `${dialogType === 'template' ? 'Template' : 'Snippet'} has been ${editMode ? 'updated' : 'created'} successfully.`
      });
      
      setShowDialog(false);
      resetForm();
    } catch (error) {
      toast({
        title: "An error occurred",
        description: error instanceof Error ? error.message : "Failed to save.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Tabs defaultValue="templates">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="snippets" className="flex items-center">
            <BookMarked className="h-4 w-4 mr-2" />
            Snippets
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium">Email Templates</h3>
            <Button onClick={handleNewTemplate} size="sm" className="flex items-center">
              <Plus className="h-4 w-4 mr-1" />
              New Template
            </Button>
          </div>
          
          <ScrollArea className="h-[400px] pr-4">
            <div className="grid grid-cols-1 gap-4">
              {templates.map(template => (
                <TemplateCard 
                  key={template.id}
                  template={template}
                  onEdit={() => handleEditTemplate(template)}
                  onDelete={() => handleDeleteTemplate(template.id)}
                  onSelect={() => onSelectTemplate(template)}
                />
              ))}
              {templates.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500 text-center">
                  <FileText className="h-8 w-8 mb-2 opacity-70" />
                  <p className="text-sm">No templates yet</p>
                  <p className="text-xs">Create a template to get started</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="snippets" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium">Email Snippets</h3>
            <Button onClick={handleNewSnippet} size="sm" className="flex items-center">
              <Plus className="h-4 w-4 mr-1" />
              New Snippet
            </Button>
          </div>
          
          <ScrollArea className="h-[400px] pr-4">
            <div className="grid grid-cols-1 gap-4">
              {snippets.map(snippet => (
                <SnippetCard 
                  key={snippet.id}
                  snippet={snippet}
                  onEdit={() => handleEditSnippet(snippet)}
                  onDelete={() => handleDeleteSnippet(snippet.id)}
                  onSelect={() => onSelectSnippet(snippet)}
                />
              ))}
              {snippets.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500 text-center">
                  <BookMarked className="h-8 w-8 mb-2 opacity-70" />
                  <p className="text-sm">No snippets yet</p>
                  <p className="text-xs">Create a snippet to get started</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editMode ? `Edit ${dialogType === 'template' ? 'Template' : 'Snippet'}` : `Create ${dialogType === 'template' ? 'Template' : 'Snippet'}`}
            </DialogTitle>
            <DialogDescription>
              {dialogType === 'template' 
                ? "Create reusable email templates with placeholders for personalization." 
                : "Create reusable text snippets for quick insertion."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`${dialogType === 'template' ? 'Template' : 'Snippet'} name`}
              />
            </div>
            
            {dialogType === 'template' && (
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={category} 
                  onValueChange={setCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Personal">Personal</SelectItem>
                    <SelectItem value="Follow-up">Follow-up</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="content">
                Content 
                {dialogType === 'template' && (
                  <span className="text-xs text-gray-500 ml-1">
                    (Use {"{variable}"} for placeholders)
                  </span>
                )}
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={dialogType === 'template' 
                  ? "Dear {name},\n\nThank you for your email.\n\nBest regards,\n{your_name}"
                  : "Write your reusable snippet here..."
                }
                className="min-h-[150px] resize-y"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TemplateManager;
