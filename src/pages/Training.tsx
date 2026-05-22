
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, Brain, FileText, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import TrainingDataManager from "@/components/TrainingDataManager";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { extractTextFromFile } from "@/lib/fileUpload";

const Training = () => {
  const [trainingProgress, setTrainingProgress] = useState(75);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const uploadFile = async (file: File, bucket: string) => {
    if (!user) throw new Error('Not authenticated');
    const fileExt = file.name.split('.').pop();
    // uid-prefixed path so owner-scoped storage RLS allows only the owner (B1/C6).
    const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // Persist the storage PATH (sign on read), never an expiring signed URL.
    return {
      success: true,
      path: filePath
    };
  };

  // Use the shared extraction pipeline (handles pdf/docx/txt) instead of a text-only reader (M44).
  const handleUploadTrainingData = async (fileType: 'assignment' | 'rubric') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.docx,.txt';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !user) return;

      setUploading(true);
      
      try {
        // Upload file
        const uploadResult = await uploadFile(file, 'training-data');
        
        if (!uploadResult.success) {
          throw new Error('Upload failed');
        }

        // Extract text
        const extractedText = await extractTextFromFile(file);

        // Save to training_data table
        const { error } = await supabase
          .from('training_data')
          .insert({
            user_id: user.id,
            data_type: fileType,
            file_url: uploadResult.path,
            processed: false
          });

        if (error) throw error;

        toast({
          title: "Training data uploaded!",
          description: "Your grading examples are being processed to improve AI accuracy.",
        });
        
      } catch (error) {
        console.error('Training upload error:', error);
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive"
        });
      } finally {
        setUploading(false);
      }
    };
    
    input.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">AI Training Center</h1>
            <p className="text-gray-600">
              Upload past grading examples to train the AI to match your unique teaching style and grading preferences.
            </p>
          </div>

          {/* Training Status */}
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Training Status</h2>
              <Badge className="bg-green-100 text-green-800">
                <Brain className="w-3 h-3 mr-1" />
                Ready for Use
              </Badge>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Training Progress</span>
                <span>{trainingProgress}%</span>
              </div>
              <Progress value={trainingProgress} className="h-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="font-semibold">47</p>
                <p className="text-sm text-gray-600">Training Examples</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="font-semibold">92%</p>
                <p className="text-sm text-gray-600">Accuracy Score</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="font-semibold">2 hrs</p>
                <p className="text-sm text-gray-600">Last Updated</p>
              </div>
            </div>
          </Card>

          {/* Upload New Training Data */}
          <Card className="p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Upload Training Data</h3>
            <p className="text-gray-600 mb-4">
              Upload past assignments with your grading, feedback, and rubrics to improve AI accuracy.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                <p className="font-medium mb-2">Student Essays</p>
                <p className="text-sm text-gray-600 mb-4">Upload graded student submissions</p>
                <Button 
                  onClick={() => handleUploadTrainingData('assignment')}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload Essays'
                  )}
                </Button>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                <p className="font-medium mb-2">Grading Rubrics</p>
                <p className="text-sm text-gray-600 mb-4">Upload your custom rubrics</p>
                <Button 
                  variant="outline"
                  onClick={() => handleUploadTrainingData('rubric')}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload Rubrics'
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Training Tips</p>
                  <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                    <li>• Upload at least 20-30 examples for best results</li>
                    <li>• Include a variety of grade levels (A through F)</li>
                    <li>• Ensure feedback examples represent your teaching style</li>
                    <li>• Training typically takes 1-2 hours to complete</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Training Data Manager */}
          <TrainingDataManager />

          {/* Training History */}
          <Card className="p-6 mt-8">
            <h3 className="text-lg font-semibold mb-4">Training History</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Essay Grading Model v2.1</p>
                    <p className="text-sm text-gray-600">Trained on 47 examples • 92% accuracy</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Essay Grading Model v2.0</p>
                    <p className="text-sm text-gray-600">Trained on 32 examples • 87% accuracy</p>
                  </div>
                </div>
                <Badge variant="outline">Previous</Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Initial Training</p>
                    <p className="text-sm text-gray-600">Trained on 15 examples • 78% accuracy</p>
                  </div>
                </div>
                <Badge variant="outline">Archive</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Training;
