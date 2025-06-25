import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, File, X, FileText, Image, FileSpreadsheet } from "lucide-react";
import type { FileAttachment } from "@/types/assessment";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFilesChange: (files: FileAttachment[]) => void;
  existingFiles?: FileAttachment[];
  maxFiles?: number;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
}

export function FileUpload({
  onFilesChange,
  existingFiles = [],
  maxFiles = 5,
  acceptedTypes = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".jpg", ".jpeg", ".png"],
  maxSize = 10
}: FileUploadProps) {
  const [files, setFiles] = useState<FileAttachment[]>(existingFiles);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.includes("image")) return <Image className="h-4 w-4" />;
    if (type.includes("spreadsheet") || type.includes("excel")) return <FileSpreadsheet className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileSelect = (selectedFiles: FileList) => {
    const newFiles: FileAttachment[] = [];
    
    Array.from(selectedFiles).forEach((file) => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSize}MB.`);
        return;
      }

      // Check if we're at max files
      if (files.length + newFiles.length >= maxFiles) {
        alert(`Maximum of ${maxFiles} files allowed.`);
        return;
      }

      const attachment: FileAttachment = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      };

      newFiles.push(attachment);
    });

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="space-y-4">
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          dragOver
            ? "border-indigo-500 bg-indigo-50"
            : "border-slate-300 hover:border-slate-400"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 px-4">
          <Upload className="h-8 w-8 text-slate-400 mb-2" />
          <p className="text-sm text-slate-600 text-center mb-2">
            <span className="font-medium">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-slate-500 text-center">
            {acceptedTypes.join(", ")} up to {maxSize}MB each
          </p>
          <p className="text-xs text-slate-500 text-center mt-1">
            Maximum {maxFiles} files
          </p>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(",")}
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
        className="hidden"
      />

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-700">Attached Files</h4>
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                {getFileIcon(file.type)}
                <div>
                  <p className="text-sm font-medium text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.id);
                }}
                className="text-slate-500 hover:text-rose-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 