
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import CreateClassModal from '@/components/CreateClassModal';
import DashboardStats from '@/components/dashboard/DashboardStats';
import RecentAssignments from '@/components/dashboard/RecentAssignments';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, GraduationCap, Users, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortAsc } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  created_at: string;
  submission_count?: number;
  class_id?: string;
}

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
  assignment_count?: number;
}

type SortOption = 'time' | 'size' | 'grade' | 'name';

// Cache for dashboard data to prevent disappearing items
let dashboardCache: {
  assignments: Assignment[];
  classes: Class[];
  lastFetch: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const Dashboard = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('time');
  const [hasAnimated, setHasAnimated] = useState(false);
  const hasInitiallyLoaded = useRef(false);

  useEffect(() => {
    if (user) {
      // Check if we have fresh cached data first
      const now = Date.now();
      if (dashboardCache && (now - dashboardCache.lastFetch) < CACHE_DURATION) {
        console.log('Loading from cache');
        setAssignments(dashboardCache.assignments);
        setClasses(dashboardCache.classes);
        setLoading(false);
        
        // Trigger animations for first visit
        if (!hasInitiallyLoaded.current) {
          setTimeout(() => setHasAnimated(true), 100);
          hasInitiallyLoaded.current = true;
        }
      } else {
        fetchData();
      }
    }
  }, [user]);

  // Clear animation state when user logs out
  useEffect(() => {
    if (!user) {
      setHasAnimated(false);
      hasInitiallyLoaded.current = false;
      dashboardCache = null;
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching fresh data from database');
      
      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          created_at,
          class_id
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // Get submission counts separately
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

      // Fetch classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (classesError) throw classesError;

      // Type cast and add assignment counts to classes
      const typedClasses = await Promise.all(
        (classesData || []).map(async (cls) => {
          const assignmentCount = assignmentsWithCounts.filter(a => a.class_id === cls.id).length;
          
          return {
            ...cls,
            details_jsonb: cls.details_jsonb as { grade: string; size: number; level: string; time: string; },
            assignment_count: assignmentCount
          };
        })
      );

      // Update state
      setAssignments(assignmentsWithCounts);
      setClasses(typedClasses);

      // Update cache
      dashboardCache = {
        assignments: assignmentsWithCounts,
        classes: typedClasses,
        lastFetch: Date.now()
      };

      // Trigger animations for first visit
      if (!hasInitiallyLoaded.current) {
        setTimeout(() => setHasAnimated(true), 100);
        hasInitiallyLoaded.current = true;
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      
      // Fallback to cache if available
      if (dashboardCache) {
        console.log('Falling back to cached data due to error');
        setAssignments(dashboardCache.assignments);
        setClasses(dashboardCache.classes);
      }
    } finally {
      setLoading(false);
    }
  };

  const sortClasses = (classes: Class[], sortBy: SortOption): Class[] => {
    return [...classes].sort((a, b) => {
      switch (sortBy) {
        case 'time':
          const timeA = new Date(`1970/01/01 ${a.details_jsonb.time}`).getTime();
          const timeB = new Date(`1970/01/01 ${b.details_jsonb.time}`).getTime();
          return timeA - timeB;
        case 'size':
          return a.details_jsonb.size - b.details_jsonb.size;
        case 'grade':
          return a.details_jsonb.grade.localeCompare(b.details_jsonb.grade);
        case 'name':
          return a.class_name.localeCompare(b.class_name);
        default:
          return 0;
      }
    });
  };

  const sortedClasses = sortClasses(classes, sortBy);

  const handleClassCreated = () => {
    // Clear cache to force fresh data fetch
    dashboardCache = null;
    fetchData();
  };

  // Color schemes for different classes
  const colorSchemes = [
    'from-blue-500 to-indigo-600',
    'from-green-500 to-emerald-600',
    'from-purple-500 to-violet-600',
    'from-orange-500 to-red-600',
    'from-teal-500 to-cyan-600',
    'from-pink-500 to-rose-600',
    'from-yellow-500 to-amber-600',
    'from-gray-500 to-slate-600'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className={`flex items-center justify-between mb-8 transition-all duration-700 ${hasAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
            <p className="text-gray-600 mt-1">Manage your classes and assignments</p>
          </div>
          <div className="flex gap-3">
            <Button 
              size="lg" 
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-5 h-5" />
              Create Class
            </Button>
            <Link to="/create-assignment">
              <Button size="lg" className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create Assignment
              </Button>
            </Link>
          </div>
        </div>

        <DashboardStats 
          classes={classes}
          assignments={assignments}
          hasAnimated={hasAnimated}
        />

        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg font-medium animate-pulse">Loading classes...</div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Classes Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold text-gray-900 transition-all duration-700 delay-300 ${hasAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  Your Classes
                </h2>
                
                {/* Sorting Controls */}
                {sortedClasses.length > 0 && (
                  <div className={`flex items-center gap-4 transition-all duration-700 delay-200 ${hasAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="flex items-center gap-2">
                      <SortAsc className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Sort by:</span>
                    </div>
                    <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="time">Class Time</SelectItem>
                        <SelectItem value="size">Class Size</SelectItem>
                        <SelectItem value="grade">Grade Level</SelectItem>
                        <SelectItem value="name">Class Name</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              {sortedClasses.length === 0 ? (
                <Card className={`p-12 text-center transition-all duration-700 delay-400 ${hasAnimated ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}>
                  <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No classes created yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Create your first class to get started with organizing your assignments!
                  </p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Class
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {sortedClasses.map((classItem, index) => (
                    <Card 
                      key={classItem.id} 
                      className={`hover:shadow-xl transition-all duration-500 cursor-pointer group ${hasAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                      style={{ transitionDelay: `${400 + index * 100}ms` }}
                    >
                      <Link to={`/class/${classItem.id}`}>
                        <CardHeader className={`bg-gradient-to-r ${colorSchemes[index % colorSchemes.length]} text-white rounded-t-lg`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                <GraduationCap className="w-8 h-8" />
                              </div>
                              <div>
                                <CardTitle className="text-2xl font-bold">{classItem.class_name}</CardTitle>
                                <div className="flex items-center gap-6 text-white/90 mt-2">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    <span>{classItem.details_jsonb.time}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    <span>{classItem.details_jsonb.size} Students</span>
                                  </div>
                                  <span>•</span>
                                  <span>{classItem.details_jsonb.grade}</span>
                                  <span>•</span>
                                  <span>{classItem.details_jsonb.level}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-4">
                              <div>
                                <div className="text-white/90 text-sm">Assignments</div>
                                <div className="text-2xl font-bold">{classItem.assignment_count || 0}</div>
                              </div>
                              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </CardHeader>
                      </Link>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Separator className="my-8" />

            <RecentAssignments
              assignments={assignments}
              classes={classes}
              hasAnimated={hasAnimated}
            />
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
