
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload as UploadIcon, FileText, CheckCircle, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

const Upload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [assignmentName, setAssignmentName] = useState('');
  const [course, setCourse] = useState('');
  const [rubric, setRubric] = useState('');
  const [instructions, setInstructions] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const uploadFile = async (file: File, bucket: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: data.publicUrl
    };
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string || '');
      };
      reader.readAsText(file);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadedFile || !user) {
      toast({
        title: "Error",
        description: "Please select a file and ensure you're logged in.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Upload file to Supabase Storage
      const uploadResult = await uploadFile(uploadedFile, 'submissions');
      
      if (!uploadResult.success) {
        throw new Error('Upload failed');
      }

      // Extract text from file
      const extractedText = await extractTextFromFile(uploadedFile);

      // Create assignment record
      const { data: assignment, error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          user_id: user.id,
          title: assignmentName,
          course_name: course,
          due_date: new Date().toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (assignmentError) throw assignmentError;

      // Create submission record
      const { error: submissionError } = await supabase
        .from('submissions')
        .insert({
          assignment_id: assignment.id,
          student_name: 'Student Name', // This would come from the form in a real app
          file_url: uploadResult.url,
          status: 'pending'
        });

      if (submissionError) throw submissionError;

      toast({
        title: "Assignment uploaded successfully!",
        description: "Your submission is ready for AI grading assistance.",
      });

      // Reset form
      setUploadedFile(null);
      setAssignmentName('');
      setCourse('');
      setRubric('');
      setInstructions('');
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload Assignment</h1>
            <p className="text-gray-600">
              Upload student submissions to get AI-powered grading assistance based on your teaching style.
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Assignment Details */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="assignment-name">Assignment Name</Label>
                  <Input 
                    id="assignment-name"
                    value={assignmentName}
                    onChange={(e) => setAssignmentName(e.target.value)}
                    placeholder="e.g., Essay Assignment #3 - Character Analysis"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="course">Course</Label>
                  <Select value={course} onValueChange={setCourse}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="english-101">English 101 - Composition</SelectItem>
                      <SelectItem value="history-201">History 201 - American History</SelectItem>
                      <SelectItem value="literature-301">Literature 301 - Modern Fiction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="rubric">Grading Rubric</Label>
                  <Select value={rubric} onValueChange={setRubric}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select rubric" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="essay-standard">Standard Essay Rubric</SelectItem>
                      <SelectItem value="creative-writing">Creative Writing Rubric</SelectItem>
                      <SelectItem value="research-paper">Research Paper Rubric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <Label>Student Submission</Label>
                <div
                  className={`mt-1 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                      ? "border-blue-400 bg-blue-50" 
                      : uploadedFile 
                      ? "border-green-400 bg-green-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {uploadedFile ? (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span>{uploadedFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <UploadIcon className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">
                        Drag and drop files here, or{" "}
                        <label className="text-blue-600 cursor-pointer hover:underline">
                          browse
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileInput}
                          />
                        </label>
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports PDF, DOC, DOCX, TXT files
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Additional Instructions */}
              <div>
                <Label htmlFor="instructions">Additional Instructions (Optional)</Label>
                <Textarea 
                  id="instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Any specific grading criteria or notes for the AI assistant..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Upload & Generate AI Feedback
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong> After uploading, our AI will analyze the submission using your selected rubric and training data to generate personalized feedback and a suggested grade that matches your teaching style.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Upload;
