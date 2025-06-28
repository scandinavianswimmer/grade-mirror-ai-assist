
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { uploadFile } from '@/lib/fileUpload';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';

const CreateAssignment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });
  const [rubricFile, setRubricFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRubricFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let rubricUrl = '';
      
      // Upload rubric file if provided
      if (rubricFile) {
        const uploadResult = await uploadFile(rubricFile, 'rubrics');
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload rubric');
        }
        rubricUrl = uploadResult.url || '';
      }

      // Create assignment in database
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          rubric_url: rubricUrl,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Assignment created successfully!",
        description: "You can now upload student essays for grading."
      });

      navigate(`/assignment/${data.id}`);
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: "Error creating assignment",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Create a New Assignment</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Assignment Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder='e.g., "Analysis of The Great Gatsby\'s Symbolism"'
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Assignment Prompt & Instructions</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Paste the full assignment prompt and any instructions you gave to your students here."
                    rows={8}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rubric">Grading Rubric (Optional)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <div className="text-sm text-gray-600 mb-2">
                      Upload your grading rubric (PDF or DOCX)
                    </div>
                    <input
                      id="rubric"
                      type="file"
                      accept=".pdf,.docx,.doc"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Label htmlFor="rubric" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm">
                        Choose File
                      </Button>
                    </Label>
                    {rubricFile && (
                      <div className="mt-2 text-sm text-green-600">
                        Selected: {rubricFile.name}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Please upload the grading rubric for this specific assignment. A clear, analytic rubric in PDF or DOCX format works best.
                  </p>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Creating Assignment...' : 'Save Assignment'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateAssignment;
