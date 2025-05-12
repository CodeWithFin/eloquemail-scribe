import React, { useState, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";

interface EditorProps {
  initialValue?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const Editor: React.FC<EditorProps> = ({
  initialValue = '',
  onChange,
  placeholder = 'Start typing...',
  minHeight = '200px'
}) => {
  const [value, setValue] = useState(initialValue);
  
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange(newValue);
  };
  
  return (
    <Textarea
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      style={{ minHeight }}
      className="resize-y"
    />
  );
};

export default Editor; 