
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, FileText, Download } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { uploadFile } from '@/lib/fileUpload';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';

interface Assignment {
  id: string;
  title: string;
  description: string;
  rubric_url?: string;
  created_at: string;
}

interface Submission {
  id: string;
  student_name: string;
  file_url: string;
  status: string;
  created_at: string;
}

const AssignmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
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

      // Fetch submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', id)
        .order('created_at', { ascending: false });

      if (submissionsError) throw submissionsError;
      setSubmissions(submissionsData || []);
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
        // Upload file
        const uploadResult = await uploadFile(file, 'submissions');
        if (!uploadResult.success) {
          throw new Error(`Failed to upload ${file.name}: ${uploadResult.error}`);
        }

        // Extract student name from filename (remove extension)
        const studentName = file.name.replace(/\.[^/.]+$/, "");

        // Create submission record
        const { error } = await supabase
          .from('submissions')
          .insert({
            assignment_id: assignment.id,
            student_name: studentName,
            file_url: uploadResult.url,
            status: 'pending'
          });

        if (error) throw error;
      });

      await Promise.all(uploadPromises);

      toast({
        title: "Essays uploaded successfully!",
        description: `${selectedFiles.length} essay(s) uploaded and ready for grading.`
      });

      // Reset file input and refresh submissions
      setSelectedFiles(null);
      const fileInput = document.getElementById('essay-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      fetchAssignmentData();
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
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{assignment.title}</h1>
          </div>

          {/* Assignment Details */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Assignment Prompt & Rubric</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Assignment Prompt:</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
              </div>
              
              {assignment.rubric_url && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Grading Rubric:</h3>
                  <a 
                    href={assignment.rubric_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    <Download className="w-4 h-4" />
                    View Rubric
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Essay Upload Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Upload Student Essays for Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="text-lg font-medium text-gray-700 mb-2">
                  Upload Student Essays
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  Upload one or more student essays (PDF or DOCX). GradeMirror will analyze them based on your style and the assignment's rubric.
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
                  <Button variant="outline">
                    Choose Files
                  </Button>
                </label>
                
                {selectedFiles && selectedFiles.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm text-green-600 mb-2">
                      Selected {selectedFiles.length} file(s):
                    </div>
                    <div className="text-xs text-gray-600 max-h-20 overflow-y-auto">
                      {Array.from(selectedFiles).map((file, index) => (
                        <div key={index}>{file.name}</div>
                      ))}
                    </div>
                    <Button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="mt-4"
                    >
                      {uploading ? 'Uploading...' : 'Get Feedback'}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submissions List */}
          <Card>
            <CardHeader>
              <CardTitle>Student Submissions ({submissions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No student submissions yet. Upload essays above to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-medium">{submission.student_name}</div>
                          <div className="text-sm text-gray-500">
                            Uploaded {new Date(submission.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          submission.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : submission.status === 'ai_graded'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {submission.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;
