
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Calendar, Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import CreateClassModal from '@/components/CreateClassModal';

interface Assignment {
  id: string;
  title: string;
  description: string;
  created_at: string;
  submission_count?: number;
}

interface Class {
  id: string;
  class_name: string;
  details_jsonb: {
    grade: string;
    size: number;
    level: string;
  };
  created_at: string;
}

interface ClassSchedule {
  id: string;
  name: string;
  time: string;
  grade: string;
  level: string;
  size: number;
  assignments: Assignment[];
}

const Dashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
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

      if (assignmentsError) throw assignmentsError;

      const assignmentsWithCount = assignmentsData?.map(assignment => ({
        ...assignment,
        submission_count: assignment.submissions?.[0]?.count || 0
      })) || [];

      setAssignments(assignmentsWithCount);

      // Fetch classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (classesError) throw classesError;

      // Type cast the data to ensure compatibility
      const typedClasses = classesData?.map(cls => ({
        ...cls,
        details_jsonb: cls.details_jsonb as { grade: string; size: number; level: string; }
      })) || [];

      setClasses(typedClasses);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group assignments by class (for now, we'll put all assignments in the first class or create a default)
  const classSchedules: ClassSchedule[] = classes.length > 0 
    ? classes.map(cls => ({
        id: cls.id,
        name: cls.class_name,
        time: "9:00 AM", // Default time for now
        grade: cls.details_jsonb.grade,
        level: cls.details_jsonb.level,
        size: cls.details_jsonb.size,
        assignments: assignments // For now, show all assignments in each class
      }))
    : assignments.length > 0 
    ? [{
        id: 'default',
        name: "English",
        time: "9:00 AM",
        grade: "10th Grade",
        level: "Standard",
        size: 25,
        assignments: assignments
      }]
    : [];

  const handleClassCreated = () => {
    fetchData(); // Refetch data when a new class is created
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Classes Dashboard</h1>
          <div className="flex gap-3">
            <Button 
              size="lg" 
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-5 h-5" />
              Create New Class
            </Button>
            <Link to="/create-assignment">
              <Button size="lg" className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create New Assignment
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg font-medium">Loading classes...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {classSchedules.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                  No classes created yet
                </h2>
                <p className="text-gray-600 mb-6">
                  Create your first class to get started with organizing your assignments!
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Class
                </Button>
              </Card>
            ) : (
              classSchedules.map((classSchedule) => (
                <div key={classSchedule.id} className="space-y-4">
                  {/* Class Header */}
                  <Card className="bg-white shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-bold">{classSchedule.name}</CardTitle>
                            <div className="flex items-center gap-4 text-blue-100 mt-1">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{classSchedule.time}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{classSchedule.size} Students</span>
                              </div>
                              <span>•</span>
                              <span>{classSchedule.grade}</span>
                              <span>•</span>
                              <span>{classSchedule.level}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Assignments for this Class */}
                  {classSchedule.assignments.length === 0 ? (
                    <Card className="p-8 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        No assignments yet for {classSchedule.name}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Create your first assignment for this class!
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
                      <h3 className="text-lg font-semibold text-gray-800">
                        Assignments for {classSchedule.name}
                      </h3>
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
              ))
            )}
          </div>
        )}

        <CreateClassModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onClassCreated={handleClassCreated}
        />
      </div>
    </div>
  );
};

export default Dashboard;
