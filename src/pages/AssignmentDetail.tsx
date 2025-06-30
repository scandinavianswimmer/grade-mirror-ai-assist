
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, Download } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { uploadFile } from '@/lib/fileUpload';
import { useToast } from '@/hooks/use-toast';
import { createSubmissionWithFile } from '@/lib/submissionApi';
import Navbar from '@/components/Navbar';
import SubmissionsList from '@/components/SubmissionsList';

interface Assignment {
  id: string;
  title: string;
  description: string;
  rubric_url?: string;
  rubric_text?: string;
  created_at: string;
}

const AssignmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  useEffect(() => {
    if (id && user) {
      fetchAssignmentData();
    }
  }, [id, user]);

  const fetchAssignmentData = async () => {
    try {
      // Fetch assignment details
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (assignmentError) throw assignmentError;
      setAssignment(assignmentData);
    } catch (error) {
      console.error('Error fetching assignment data:', error);
      toast({
        title: "Error loading assignment",
        description: "Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!selectedFiles || !assignment || !user) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(selectedFiles).map(async (file) => {
        // Extract student name from filename (remove extension)
        const studentName = file.name.replace(/\.[^/.]+$/, "");

        // Create submission with enhanced file processing
        await createSubmissionWithFile({
          assignmentId: assignment.id,
          studentName,
          file
        });
      });

      await Promise.all(uploadPromises);

      toast({
        title: "Essays uploaded successfully!",
        description: `${selectedFiles.length} essay(s) uploaded and ready for grading.`
      });

      // Reset file input
      setSelectedFiles(null);
      const fileInput = document.getElementById('essay-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Error uploading essays:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-lg font-medium">Loading assignment...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-lg font-medium text-red-600">Assignment not found</div>
            <Link to="/dashboard">
              <Button className="mt-4">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{assignment.title}</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Assignment Details & Upload */}
            <div className="lg:col-span-1 space-y-6">
              {/* Assignment Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Assignment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Assignment Prompt:</h3>
                    <p className="text-gray-700 whitespace-pre-wrap text-sm">{assignment.description}</p>
                  </div>
                  
                  {assignment.rubric_text && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Grading Rubric:</h3>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                        {assignment.rubric_text}
                      </div>
                    </div>
                  )}

                  {assignment.rubric_url && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Rubric File:</h3>
                      <a 
                        href={assignment.rubric_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        View Rubric
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload Student Essays</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Upload Student Essays
                    </div>
                    <div className="text-xs text-gray-600 mb-4">
                      PDF or DOCX files. File names will be used as student names.
                    </div>
                    <input
                      id="essay-upload"
                      type="file"
                      accept=".pdf,.docx,.doc"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="essay-upload" className="cursor-pointer">
                      <Button variant="outline" size="sm">
                        Choose Files
                      </Button>
                    </label>
                    
                    {selectedFiles && selectedFiles.length > 0 && (
                      <div className="mt-4">
                        <div className="text-xs text-green-600 mb-2">
                          Selected {selectedFiles.length} file(s)
                        </div>
                        <Button
                          onClick={handleUpload}
                          disabled={uploading}
                          size="sm"
                        >
                          {uploading ? 'Uploading...' : 'Upload & Process'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Submissions */}
            <div className="lg:col-span-2">
              <SubmissionsList assignmentId={assignment.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;
