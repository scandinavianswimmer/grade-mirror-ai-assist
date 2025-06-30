
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileSelect: (file: File, content: string) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  placeholder?: string;
  showTextExtraction?: boolean;
}

const FileUpload = ({ 
  onFileSelect, 
  acceptedTypes = ['.txt', '.docx', '.pdf'], 
  maxSize = 5,
  placeholder = "Upload essay or document...",
  showTextExtraction = false
}: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = async (file: File) => {
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Please select a file smaller than ${maxSize}MB`,
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      toast({
        title: "Invalid file type",
        description: `Please select a file with one of these extensions: ${acceptedTypes.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    setProcessing(true);

    // Read file content
    try {
      const content = await readFileContent(file);
      setExtractedText(content);
      onFileSelect(file, content);
      
      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been processed`
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error reading file",
        description: "Please try again or use a different file format",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      // Handle different file types
      if (file.type === 'text/plain') {
        reader.readAsText(file);
      } else if (file.type === 'application/json') {
        reader.readAsText(file);
      } else {
        // For PDF/DOCX, return placeholder for now
        // In production, you'd use libraries like pdf-parse or mammoth
        resolve(`[File "${file.name}" uploaded successfully. Full text extraction requires server-side processing.]`);
      }
    });
  };

  const removeFile = () => {
    setSelectedFile(null);
    setExtractedText('');
  };

  return (
    <Card className={`p-6 border-2 border-dashed transition-colors ${
      isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
    }`}>
      {selectedFile ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {processing ? (
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                )}
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  {processing && " • Processing..."}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={removeFile}
              disabled={processing}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {showTextExtraction && extractedText && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-700 mb-2">Extracted Text Preview:</p>
              <p className="text-xs text-gray-600 line-clamp-3">
                {extractedText.substring(0, 200)}...
              </p>
            </div>
          )}
        </div>
      ) : (
        <div
          className="text-center"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">{placeholder}</p>
          <p className="text-gray-500 mb-4">
            Drag and drop your file here, or click to browse
          </p>
          <input
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button asChild className="cursor-pointer">
              <span>Choose File</span>
            </Button>
          </label>
          <p className="text-xs text-gray-400 mt-2">
            Supported formats: {acceptedTypes.join(', ')} (max {maxSize}MB)
          </p>
        </div>
      )}
    </Card>
  );
};

export default FileUpload;
