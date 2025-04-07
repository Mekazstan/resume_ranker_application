
import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  id: string;
  label: string;
  accept: string;
  multiple: boolean;
  onFilesSelected: (files: File[]) => void;
  className?: string;
}

export const FileUpload = ({
  id,
  label,
  accept,
  multiple,
  onFilesSelected,
  className,
}: FileUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelected(Array.from(files));
    }
  };

  // Extract accepted file types for display
  const acceptedTypes = accept
    .split(",")
    .map((type) => type.replace(".", "").toUpperCase())
    .join(", ");

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={handleButtonClick}>
        <Upload className="h-10 w-10 text-gray-400 mb-2" />
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-gray-500 mt-1">
          {multiple ? "Drag & drop multiple files or click to browse" : "Drag & drop a file or click to browse"}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Accepted file types: {acceptedTypes}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        id={id}
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
        aria-label={label}
      />
    </div>
  );
};
