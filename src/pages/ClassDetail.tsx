import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Calendar, Clock, Users, ArrowLeft, Eye, GraduationCap } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

interface Assignment {
  id: string;
  title: string;
  description: string;
  created_at: string;
  due_date?: string;
  status: string;
  submission_count?: number;
}

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
  created_at: string;
}

const ClassDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [classData, setClassData] = useState<Class | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && id) {
      fetchClassData();
    }
  }, [user, id]);

  const fetchClassData = async () => {
    if (!user || !id) return;

    try {
      // Fetch class details
      const { data: rawClassData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (classError) {
        if (classError.code === 'PGRST116') {
          toast({
            title: "Class not found",
            description: "The class you're looking for doesn't exist or you don't have access to it.",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }
        throw classError;
      }

      // Cast the raw data to our expected Class type
      const classData: Class = {
        ...rawClassData,
        details_jsonb: rawClassData.details_jsonb as Class['details_jsonb']
      };

      setClassData(classData);

      // Fetch assignments for this class
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('class_id', id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Get submission counts for each assignment
      const assignmentsWithCounts = await Promise.all(
        (assignmentsData || []).map(async (assignment) => {
          const { count } = await supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .eq('assignment_id', assignment.id);

          return {
            ...assignment,
            submission_count: count || 0
          };
        })
      );

      setAssignments(assignmentsWithCounts);
    } catch (error) {
      console.error('Error fetching class data:', error);
      toast({
        title: "Error loading class",
        description: "Failed to load class details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (assignment: Assignment) => {
    const now = new Date();
    const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
    
    if (assignment.status === 'draft') {
      return <Badge variant="secondary">Draft</Badge>;
    }
    
    if (dueDate && dueDate < now) {
      return <Badge variant="destructive">Past Due</Badge>;
    }
    
    if (dueDate && dueDate > now) {
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 3) {
        return <Badge variant="outline" className="border-orange-500 text-orange-600">Due Soon</Badge>;
      }
    }
    
    return <Badge variant="default">Active</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-lg font-medium animate-pulse">Loading class details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="text-lg font-medium text-red-600">Class not found</div>
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
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Class Header Card */}
        <Card className="mb-8 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">{classData.class_name}</CardTitle>
                  <div className="flex items-center gap-6 text-white/90 mt-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      <span>{classData.details_jsonb.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      <span>{classData.details_jsonb.size} Students</span>
                    </div>
                    <span>•</span>
                    <span>{classData.details_jsonb.grade}</span>
                    <span>•</span>
                    <span>{classData.details_jsonb.level}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white/90 text-sm">Created</div>
                <div>{new Date(classData.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Assignments Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Assignments ({assignments.length})
          </h2>
          <Link to={`/create-assignment?classId=${classData.id}`}>
            <Button className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create Assignment
            </Button>
          </Link>
        </div>

        {assignments.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No assignments yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first assignment for {classData.class_name} to get started!
            </p>
            <Link to={`/create-assignment?classId=${classData.id}`}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create First Assignment
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold line-clamp-2 flex-1">
                      {assignment.title}
                    </CardTitle>
                    {getStatusBadge(assignment)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {assignment.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Created: {new Date(assignment.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {assignment.due_date && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <FileText className="w-4 h-4" />
                      {assignment.submission_count} submissions
                    </div>
                  </div>

                  <Link to={`/assignment/${assignment.id}`}>
                    <Button variant="outline" className="w-full hover:bg-blue-50 transition-colors">
                      <Eye className="w-4 h-4 mr-2" />
                      View Assignment
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassDetail;
