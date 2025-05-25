// Drag and drop attachment component for ComposeEmail
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileIcon, X, Image, File, Paperclip } from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import { Button } from "@/components/ui/button";

interface AttachmentUploaderProps {
  onAttachmentsChange: (files: File[]) => void;
  attachments: File[];
}

const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({ 
  onAttachmentsChange,
  attachments
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Check for maximum total file size (e.g., 25MB)
    const currentSize = attachments.reduce((total, file) => total + file.size, 0);
    const newSize = acceptedFiles.reduce((total, file) => total + file.size, 0);
    const totalSize = currentSize + newSize;
    
    if (totalSize > 25 * 1024 * 1024) {
      alert('Total attachment size exceeds 25MB. Please reduce file size.');
      return;
    }
    
    onAttachmentsChange([...attachments, ...acceptedFiles]);
  }, [attachments, onAttachmentsChange]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    maxSize: 10 * 1024 * 1024, // 10MB per file
  });
  
  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    onAttachmentsChange(newAttachments);
  };
  
  // Determine if we have images to show as previews
  const hasImages = attachments.some(file => file.type.startsWith('image/'));
  
  return (
    <div className="mt-4 space-y-3">
      {attachments.length > 0 && (
        <div className="space-y-3">
          {/* Image previews */}
          {hasImages && (
            <div className="flex gap-2 flex-wrap">
              {attachments
                .filter(file => file.type.startsWith('image/'))
                .map((file, index) => (
                  <div key={`img-${index}`} className="relative group">
                    <div className="w-20 h-20 border rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(attachments.findIndex(f => f === file))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
            </div>
          )}
          
          {/* File list */}
          <div className="space-y-2">
            {attachments
              .filter(file => !file.type.startsWith('image/'))
              .map((file, index) => (
                <div 
                  key={`file-${index}`} 
                  className="flex items-center justify-between p-2 rounded-md border border-gray-200 dark:border-gray-700 group"
                >
                  <div className="flex items-center space-x-2">
                    <FileIcon size={18} className="text-blue-500" />
                    <div className="text-sm">
                      <div className="font-medium truncate max-w-[200px]">{file.name}</div>
                      <div className="text-xs text-gray-500">{formatBytes(file.size)}</div>
                    </div>
                  </div>
                  <Button
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeAttachment(attachments.findIndex(f => f === file))}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}
      
      {/* Dropzone */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-2">
          <Paperclip size={20} className="text-gray-500" />
          {isDragActive ? (
            <p className="text-sm">Drop files here...</p>
          ) : (
            <p className="text-sm">
              Drag & drop files here, or click to select
              <span className="block text-xs text-gray-500 mt-1">
                Maximum file size: 10MB (25MB total)
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttachmentUploader;
