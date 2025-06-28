
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Shield, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadStepProps {
  onComplete: () => void;
  onBack: () => void;
  styleData: any;
  userId: string;
}

const UploadStep = ({ onComplete, onBack, styleData, userId }: UploadStepProps) => {
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== files.length) {
      toast({
        title: "File type error",
        description: "Please upload PDF files only.",
        variant: "destructive"
      });
      return;
    }

    setUploadedFiles(prev => [...prev, ...pdfFiles].slice(0, 5));
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleFinish = async () => {
    if (uploadedFiles.length < 3) {
      toast({
        title: "More files needed",
        description: "Please upload at least 3 examples to continue.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Here you would typically upload files and create the teacher profile
      // For now, we'll simulate this process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Profile created!",
        description: "Your personalized grading assistant is ready to use."
      });
      
      onComplete();
    } catch (error) {
      toast({
        title: "Setup failed",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Show Us How You Grade</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Please upload 3-5 examples of past student essays that you have personally graded and commented on. 
          This is the most important step for teaching the AI to mirror your style.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <Card className="p-6 border-dashed border-2 border-gray-300 hover:border-blue-400 transition-colors">
            <div className="text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-lg font-medium text-blue-600 hover:text-blue-700">
                  Click to upload files
                </span>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </Label>
              <p className="text-sm text-gray-500 mt-2">
                Select multiple PDF files (up to 5)
              </p>
            </div>
          </Card>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">
                Uploaded Files ({uploadedFiles.length}/5)
              </h4>
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="flex-1 text-sm font-medium truncate">{file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <div
                key={num}
                className={`w-3 h-3 rounded-full ${
                  uploadedFiles.length >= num ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
            ))}
            <span className="text-sm text-gray-600 ml-2">
              {uploadedFiles.length < 3 
                ? `${3 - uploadedFiles.length} more required`
                : `${uploadedFiles.length}/5 uploaded`
              }
            </span>
          </div>
        </div>

        {/* Guidelines */}
        <div className="space-y-6">
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Upload Guidelines
            </h4>
            <div className="space-y-3 text-sm text-blue-800">
              <div>
                <strong>File Type:</strong> Please upload PDF files only.
              </div>
              <div>
                <strong>Best Results:</strong> For the most accurate learning, please use documents with digital comments (e.g., from Microsoft Word's Track Changes saved as a PDF, or comments added in Adobe Acrobat).
              </div>
              <div>
                <strong>Quantity:</strong> Upload 3-5 examples for optimal AI training.
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-green-50 border-green-200">
            <h4 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Security
            </h4>
            <div className="space-y-2 text-sm text-green-800">
              <p>All student information will be handled with the strictest confidentiality and used solely for creating your personalized grading profile.</p>
              <p>Your data is encrypted and never shared with other teachers or third parties.</p>
            </div>
          </Card>

          {uploadedFiles.length > 0 && (
            <Card className="p-6 bg-yellow-50 border-yellow-200">
              <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Next Steps
              </h4>
              <p className="text-sm text-yellow-800">
                Once you finish, our AI will analyze your grading patterns and create your personalized assistant. This usually takes a few minutes.
              </p>
            </Card>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleFinish} 
          disabled={uploadedFiles.length < 3 || loading}
          className="px-8"
        >
          {loading ? 'Building Your Profile...' : 'Finish & Build My Profile'}
        </Button>
      </div>
    </div>
  );
};

export default UploadStep;
