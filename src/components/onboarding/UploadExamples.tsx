
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Trash2 } from 'lucide-react';
import { uploadGradingExample, getGradingExamples, GradingExample } from '@/lib/onboardingApi';

interface UploadExamplesProps {
  userId: string;
  onComplete: () => void;
}

const UploadExamples = ({ userId, onComplete }: UploadExamplesProps) => {
  const { toast } = useToast();
  const [examples, setExamples] = useState<GradingExample[]>([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');

  useEffect(() => {
    loadExamples();
  }, [userId]);

  const loadExamples = async () => {
    try {
      const data = await getGradingExamples(userId);
      setExamples(data);
    } catch (error) {
      console.error('Error loading examples:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !title.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a title and select a file.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await uploadGradingExample(userId, file, title.trim());
      await loadExamples();
      setTitle('');
      toast({
        title: "File uploaded!",
        description: "Your grading example has been saved."
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Please try again with a different file.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canContinue = examples.length >= 3;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-gray-600 mb-4">
          Upload at least 3 examples of your previously graded work. This helps train the AI to match your grading style.
        </p>
        <p className="text-sm text-gray-500">
          Accepted formats: PDF, DOC, DOCX, images (JPG, PNG)
        </p>
      </div>

      {/* Upload Form */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Example Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 'History Essay - Student A'"
            />
          </div>

          <div>
            <Label htmlFor="file">Upload File</Label>
            <div className="mt-2">
              <Input
                id="file"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={loading || !title.trim()}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Uploaded Examples */}
      {examples.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Uploaded Examples ({examples.length})
          </h3>
          <div className="grid gap-3">
            {examples.map((example) => (
              <Card key={example.id} className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium">{example.title}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(example.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className={`w-3 h-3 rounded-full ${examples.length >= 1 ? 'bg-green-500' : 'bg-gray-300'}`} />
          <div className={`w-3 h-3 rounded-full ${examples.length >= 2 ? 'bg-green-500' : 'bg-gray-300'}`} />
          <div className={`w-3 h-3 rounded-full ${examples.length >= 3 ? 'bg-green-500' : 'bg-gray-300'}`} />
        </div>
        <p className="text-sm text-gray-600">
          {examples.length < 3 ? `${3 - examples.length} more examples needed` : 'Ready to continue!'}
        </p>
      </div>

      <Button 
        onClick={onComplete} 
        disabled={!canContinue} 
        className="w-full"
      >
        {canContinue ? 'Continue to AI Training' : `Upload ${3 - examples.length} More Examples`}
      </Button>
    </div>
  );
};

export default UploadExamples;
