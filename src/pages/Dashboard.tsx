
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Calendar, Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';

interface Assignment {
  id: string;
  title: string;
  description: string;
  created_at: string;
  submission_count?: number;
}

interface ClassSchedule {
  name: string;
  time: string;
  assignments: Assignment[];
}

const Dashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          created_at,
          submissions(count)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const assignmentsWithCount = data?.map(assignment => ({
        ...assignment,
        submission_count: assignment.submissions?.[0]?.count || 0
      })) || [];

      setAssignments(assignmentsWithCount);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group assignments by class (for now, we'll put all assignments in English class)
  const classSchedule: ClassSchedule = {
    name: "English",
    time: "9:00 AM",
    assignments: assignments
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Class Dashboard</h1>
          <Link to="/create-assignment">
            <Button size="lg" className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Assignment
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg font-medium">Loading class schedule...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Class Header */}
            <Card className="bg-white shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">{classSchedule.name} Class</CardTitle>
                      <div className="flex items-center gap-4 text-blue-100 mt-1">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{classSchedule.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{classSchedule.assignments.length} Assignments</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Assignments Grid */}
            {classSchedule.assignments.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                  No assignments yet for {classSchedule.name} class
                </h2>
                <p className="text-gray-600 mb-6">
                  Create your first assignment to get started!
                </p>
                <Link to="/create-assignment">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Assignment
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Assignments for {classSchedule.name} Class
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {classSchedule.assignments.map((assignment) => (
                    <Card key={assignment.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold line-clamp-2">
                          {assignment.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {assignment.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(assignment.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {assignment.submission_count} submissions
                          </div>
                        </div>

                        <Link to={`/assignment/${assignment.id}`}>
                          <Button variant="outline" className="w-full">
                            View Assignment
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
