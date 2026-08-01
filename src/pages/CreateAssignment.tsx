
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';

interface Class {
  id: string;
  class_name: string;
  details_jsonb: {
    grade: string;
    size: number;
    level: string;
    time: string;
  };
}

const CreateAssignment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    rubric: '',
    classId: ''
  });
  // Explicit choice: grade against a rubric, or deliberately grade holistically (H20).
  const [noRubric, setNoRubric] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      const { data: classesData, error } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', user?.id)
        .order('class_name', { ascending: true });

      if (error) throw error;

      const typedClasses = classesData?.map(cls => ({
        ...cls,
        details_jsonb: cls.details_jsonb as { grade: string; size: number; level: string; time: string; }
      })) || [];

      setClasses(typedClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchClasses();
    }
  }, [fetchClasses, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClassSelect = (value: string) => {
    setFormData(prev => ({ ...prev, classId: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Rubric-centric product: require a rubric unless the teacher explicitly chooses
    // holistic grading (H20).
    if (!formData.rubric.trim() && !noRubric) {
      toast({
        title: 'Add a rubric',
        description: 'Enter a grading rubric, or check "Grade holistically" to grade without one.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Create assignment in database
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          rubric_text: formData.rubric,
          class_id: formData.classId || null,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

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
                    placeholder="e.g., Analysis of The Great Gatsby's Symbolism"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="classId">Assign to Class (Optional)</Label>
                  <Select value={formData.classId} onValueChange={handleClassSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class (leave blank for unassigned)" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.class_name} - {cls.details_jsonb.time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Choose a class to organize this assignment under. You can leave this blank if you prefer.
                  </p>
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
                  <Label htmlFor="rubric">Grading Rubric</Label>
                  <Textarea
                    id="rubric"
                    name="rubric"
                    value={formData.rubric}
                    onChange={handleInputChange}
                    placeholder="Enter your grading rubric here. Include criteria, point values, and expectations for different performance levels."
                    rows={6}
                    disabled={noRubric}
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={noRubric}
                      onChange={(e) => setNoRubric(e.target.checked)}
                      className="h-4 w-4"
                    />
                    Grade holistically without a rubric (not recommended — rubric-aligned grading is more reliable)
                  </label>
                  <p className="text-xs text-gray-500">
                    A clear, analytic rubric with specific criteria and performance levels produces the most reliable, consistent grading.
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
