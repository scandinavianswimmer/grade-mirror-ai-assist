
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import CreateClassModal from '@/components/CreateClassModal';
import DashboardStats from '@/components/dashboard/DashboardStats';
import EmptyClassState from '@/components/dashboard/EmptyClassState';
import ClassGrid from '@/components/dashboard/ClassGrid';
import RecentAssignments from '@/components/dashboard/RecentAssignments';
import SortingControls from '@/components/dashboard/SortingControls';

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

        <SortingControls
          sortBy={sortBy}
          onSortChange={setSortBy}
          hasAnimated={hasAnimated}
          showControls={classes.length > 0}
        />

        {loading ? (
          <div className="text-center py-12">
            <div className="text-lg font-medium animate-pulse">Loading classes...</div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Classes Section */}
            <div>
              <h2 className={`text-2xl font-bold text-gray-900 mb-6 transition-all duration-700 delay-300 ${hasAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                Your Classes
              </h2>
              
              {sortedClasses.length === 0 ? (
                <EmptyClassState 
                  onCreateClass={() => setShowCreateModal(true)}
                  hasAnimated={hasAnimated}
                />
              ) : (
                <ClassGrid 
                  classes={sortedClasses}
                  hasAnimated={hasAnimated}
                />
              )}
            </div>

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
