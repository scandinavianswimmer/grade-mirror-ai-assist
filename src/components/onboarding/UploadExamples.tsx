
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
  const [comments, setComments] = useState<{[key: string]: string}>({});

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
      const example = await uploadGradingExample(userId, file, title.trim());
      await loadExamples();
      setTitle('');
      // Initialize comments for the new example
      setComments(prev => ({
        ...prev,
        [example.id]: ''
      }));
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

  // Check if we have at least 10 examples and all have comments before allowing to continue
  const canContinue = examples.length >= 10 && examples.every(example => 
    comments[example.id] && comments[example.id].trim().length > 0
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-gray-600 mb-4">
          Upload 10 examples of your graded work to help our AI learn your grading style.
          These should include your comments and feedback. Please add a comment explaining your grading approach for each example.
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
            Uploaded Examples ({examples.length}/10)
          </h3>
          <div className="space-y-4">
            {examples.map((example) => (
              <Card key={example.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">{example.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(example.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Your grading approach for this example:
                  </label>
                  <textarea
                    value={comments[example.id] || ''}
                    onChange={(e) => setComments(prev => ({
                      ...prev,
                      [example.id]: e.target.value
                    }))}
                    placeholder="Explain your grading criteria, what you focused on, why you gave this grade, etc."
                    className="w-full p-3 border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-1 flex-wrap mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                examples.length >= i ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-600">
          {examples.length < 10 
            ? `${10 - examples.length} more examples needed` 
            : canContinue 
              ? 'Ready to continue!' 
              : 'Add comments to all examples to continue'
          }
        </p>
      </div>

      <Button 
        onClick={onComplete} 
        disabled={!canContinue} 
        className="w-full"
      >
        {canContinue ? 'Continue to AI Training' : 
          examples.length < 10 
            ? `Upload ${10 - examples.length} more example${10 - examples.length === 1 ? '' : 's'}`
            : 'Add comments to all examples to continue'
        }
      </Button>
    </div>
  );
};

export default UploadExamples;
