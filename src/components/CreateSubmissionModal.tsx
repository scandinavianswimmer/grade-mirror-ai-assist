
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload } from 'lucide-react';

interface CreateSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { studentName: string; essay: string }, file: File | null) => void;
  isLoading: boolean;
}

const CreateSubmissionModal = ({ isOpen, onClose, onSubmit, isLoading }: CreateSubmissionModalProps) => {
  const [studentName, setStudentName] = useState('');
  const [essay, setEssay] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;
    
    onSubmit({ studentName, essay }, file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const resetForm = () => {
    setStudentName('');
    setEssay('');
    setFile(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Submission</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="studentName">Student Name *</Label>
            <Input
              id="studentName"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter student name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Upload File (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.docx,.txt"
                className="flex-1"
              />
              <Upload className="w-4 h-4" />
            </div>
            {file && (
              <p className="text-sm text-gray-600">Selected: {file.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="essay">Essay Text {!file && '*'}</Label>
            <Textarea
              id="essay"
              value={essay}
              onChange={(e) => setEssay(e.target.value)}
              placeholder={file ? "Text will be extracted from uploaded file" : "Enter essay text"}
              rows={8}
              required={!file}
              disabled={!!file}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !studentName.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Submission'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSubmissionModal;
