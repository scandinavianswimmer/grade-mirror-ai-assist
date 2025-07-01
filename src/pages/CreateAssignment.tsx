import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ArrowLeft, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { createAssignment } from '@/lib/assignmentApi';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import type { Tables } from '@/integrations/supabase/types';

type ClassData = Tables<'classes'>;

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [dueDate, setDueDate] = useState<Date>();
  const [rubricText, setRubricText] = useState('');
  const [promptInstructions, setPromptInstructions] = useState('Please grade this assignment according to the provided rubric. Focus on clarity, accuracy, and depth of analysis.');
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);

  useEffect(() => {
    if (user) {
      fetchClasses();
    }
  }, [user]);

  useEffect(() => {
    // Pre-select class if classId is provided in URL params
    const classId = searchParams.get('classId');
    if (classId) {
      setSelectedClassId(classId);
    }
  }, [searchParams]);

  const fetchClasses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', user.id)
        .order('class_name');

      if (error) throw error;

      // Cast the raw data to our expected Class type
      const classesData: Class[] = (data || []).map(rawClass => ({
        ...rawClass,
        details_jsonb: rawClass.details_jsonb as Class['details_jsonb']
      }));

      setClasses(classesData);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast({
        title: "Error",
        description: "Failed to load classes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !selectedClassId) {
      toast({
        title: "Required fields missing",
        description: "Please fill in the title and select a class.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const assignmentData = {
        title,
        description,
        class_id: selectedClassId,
        due_date: dueDate?.toISOString(),
        rubric_text: rubricText || undefined,
        prompt_instructions: promptInstructions,
      };

      const assignment = await createAssignment(assignmentData);
      
      toast({
        title: "Assignment created!",
        description: `"${title}" has been created successfully.`,
      });

      // Navigate to the assignment detail page
      navigate(`/assignment/${assignment.id}`);
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: "Error creating assignment",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Assignment</h1>
            <p className="text-gray-600">Set up a new assignment for your students</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Assignment Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Assignment Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter assignment title"
                    required
                  />
                </div>

                {/* Class Selection */}
                <div className="space-y-2">
                  <Label htmlFor="class">Select Class *</Label>
                  {loadingClasses ? (
                    <div className="text-sm text-gray-500">Loading classes...</div>
                  ) : (
                    <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            <div className="flex items-center gap-2">
                              <span>{cls.class_name}</span>
                              <span className="text-sm text-gray-500">
                                ({cls.details_jsonb.grade} • {cls.details_jsonb.time})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {selectedClass && (
                    <div className="p-3 bg-blue-50 rounded-lg text-sm">
                      <div className="font-medium text-blue-900">{selectedClass.class_name}</div>
                      <div className="text-blue-700">
                        {selectedClass.details_jsonb.grade} • {selectedClass.details_jsonb.level} • {selectedClass.details_jsonb.size} students
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the assignment requirements, expectations, and any special instructions..."
                    rows={4}
                  />
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label>Due Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Rubric */}
                <div className="space-y-2">
                  <Label htmlFor="rubric">Grading Rubric (Optional)</Label>
                  <Textarea
                    id="rubric"
                    value={rubricText}
                    onChange={(e) => setRubricText(e.target.value)}
                    placeholder="Enter your grading criteria, point values, and expectations..."
                    rows={6}
                  />
                  <p className="text-sm text-gray-600">
                    This rubric will guide the AI when providing grading feedback.
                  </p>
                </div>

                {/* AI Prompt Instructions */}
                <div className="space-y-2">
                  <Label htmlFor="prompt">AI Grading Instructions</Label>
                  <Textarea
                    id="prompt"
                    value={promptInstructions}
                    onChange={(e) => setPromptInstructions(e.target.value)}
                    placeholder="Customize how the AI should approach grading this assignment..."
                    rows={3}
                  />
                  <p className="text-sm text-gray-600">
                    These instructions will be used to customize the AI's grading approach for this specific assignment.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !title || !selectedClassId}
                    className="flex-1"
                  >
                    {loading ? 'Creating...' : 'Create Assignment'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateAssignment;
