import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileText, Calendar, Clock, Users, SortAsc, Trash2, MoreVertical, Edit, BookOpen, Sparkles, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { deleteClass, deleteAssignment } from '@/lib/api';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import TrialBanner from '@/components/TrialBanner';
import { loadSampleEssays } from '@/lib/sampleEssaysApi';
import { analytics } from '@/lib/analytics';
import CreateClassModal from '@/components/CreateClassModal';
import EditClassModal from '@/components/EditClassModal';
import OnTheLoopSummary from '@/components/OnTheLoopSummary';
import { fetchOnTheLoopSummary, type OnTheLoopSummary as OnTheLoopSummaryData } from '@/lib/metricsApi';

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
  details_jsonb: { grade: string; size: number; level: string; time: string };
  created_at: string;
}

interface EditableClass {
  id: string;
  class_name: string;
  details_jsonb: { grade: string; size: string; level: string; time: string; students?: string };
}

interface ClassSchedule {
  id: string;
  name: string;
  time: string;
  grade: string;
  level: string;
  size: number;
  assignments: Assignment[];
  tone: number;
}

type SortOption = 'time' | 'size' | 'grade' | 'name';

// Calm, rotating accent tones (no rainbow gradients) — keeps the workspace cohesive.
const TONES = [
  { dot: 'bg-primary', icon: 'bg-primary/10 text-primary', bar: 'border-l-primary' },
  { dot: 'bg-accent', icon: 'bg-accent/15 text-accent-foreground', bar: 'border-l-accent' },
  { dot: 'bg-question', icon: 'bg-question/10 text-question', bar: 'border-l-question' },
  { dot: 'bg-praise', icon: 'bg-praise/10 text-praise', bar: 'border-l-praise' },
];

let dashboardCache: { assignments: Assignment[]; classes: Class[]; lastFetch: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000;

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSample, setLoadingSample] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [classToEdit, setClassToEdit] = useState<EditableClass | null>(null);
  const createClassTriggerRef = useRef<HTMLButtonElement>(null);
  const editClassTriggerRef = useRef<HTMLElement | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('time');
  const [hasAnimated, setHasAnimated] = useState(false);
  const [onTheLoop, setOnTheLoop] = useState<OnTheLoopSummaryData | null>(null);
  const [onTheLoopLoading, setOnTheLoopLoading] = useState(true);
  const hasInitiallyLoaded = useRef(false);

  useEffect(() => {
    if (!user) {
      setHasAnimated(false);
      hasInitiallyLoaded.current = false;
      dashboardCache = null;
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`id, title, description, created_at, class_id`)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (assignmentsError) throw assignmentsError;

      // Single query for all submission counts instead of one-per-assignment (M42 N+1).
      const ids = (assignmentsData || []).map((a) => a.id);
      const counts: Record<string, number> = {};
      if (ids.length > 0) {
        const { data: subs } = await supabase
          .from('submissions')
          .select('assignment_id')
          .in('assignment_id', ids);
        for (const s of subs || []) {
          counts[s.assignment_id] = (counts[s.assignment_id] || 0) + 1;
        }
      }
      const assignmentsWithCounts = (assignmentsData || []).map((assignment) => ({
        ...assignment,
        submission_count: counts[assignment.id] || 0,
      }));

      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (classesError) throw classesError;

      const typedClasses =
        classesData?.map((cls) => ({
          ...cls,
          details_jsonb: cls.details_jsonb as { grade: string; size: number; level: string; time: string },
        })) || [];

      setAssignments(assignmentsWithCounts);
      setClasses(typedClasses);
      dashboardCache = { assignments: assignmentsWithCounts, classes: typedClasses, lastFetch: Date.now() };

      if (!hasInitiallyLoaded.current) {
        setTimeout(() => setHasAnimated(true), 100);
        hasInitiallyLoaded.current = true;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (dashboardCache) {
        setAssignments(dashboardCache.assignments);
        setClasses(dashboardCache.classes);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // Show cache instantly for a snappy paint, but ALWAYS refetch so cross-page mutations
      // (e.g. a new assignment created elsewhere) can't leave the dashboard stale (M41).
      if (dashboardCache) {
        setAssignments(dashboardCache.assignments);
        setClasses(dashboardCache.classes);
        setLoading(false);
        if (!hasInitiallyLoaded.current) {
          setTimeout(() => setHasAnimated(true), 100);
          hasInitiallyLoaded.current = true;
        }
      }
      fetchData();
      // Best-effort On-the-Loop throughput — degrades to hidden if it can't load (never blocks
      // the dashboard, and column-tolerant for lagging cloud schemas).
      setOnTheLoopLoading(true);
      fetchOnTheLoopSummary()
        .then(setOnTheLoop)
        .catch(() => setOnTheLoop(null))
        .finally(() => setOnTheLoopLoading(false));
    }
  }, [fetchData, user]);

  const sortClasses = (list: Class[], by: SortOption): Class[] =>
    [...list].sort((a, b) => {
      switch (by) {
        case 'time':
          return new Date(`1970/01/01 ${a.details_jsonb.time}`).getTime() - new Date(`1970/01/01 ${b.details_jsonb.time}`).getTime();
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

  const sortedClasses = sortClasses(classes, sortBy);

  const classSchedules: ClassSchedule[] = sortedClasses.map((cls, index) => ({
    id: cls.id,
    name: cls.class_name,
    time: cls.details_jsonb.time,
    grade: cls.details_jsonb.grade,
    level: cls.details_jsonb.level,
    size: cls.details_jsonb.size,
    assignments: assignments.filter((a) => a.class_id === cls.id),
    tone: index % TONES.length,
  }));

  // Always surface unassigned assignments in their own bucket — never hide them when
  // the teacher also has classes (M43).
  const unassignedAssignments = assignments.filter((a) => !a.class_id);
  const finalClassSchedules = [
    ...classSchedules,
    ...(unassignedAssignments.length > 0
      ? [{ id: 'default', name: 'Unassigned', time: 'N/A', grade: 'N/A', level: 'N/A', size: 0, assignments: unassignedAssignments, tone: classSchedules.length % TONES.length }]
      : []),
  ];

  const handleClassCreated = () => { dashboardCache = null; fetchData(); };
  const handleClassUpdated = () => { dashboardCache = null; fetchData(); setShowEditModal(false); setClassToEdit(null); };

  const handleEditClass = (classData: Class) => {
    setClassToEdit({
      id: classData.id,
      class_name: classData.class_name,
      details_jsonb: { ...classData.details_jsonb, size: classData.details_jsonb.size.toString() },
    });
    setShowEditModal(true);
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    try {
      await deleteClass(classId);
      toast({ title: 'Class deleted', description: `${className} has been deleted.` });
      dashboardCache = null; fetchData();
    } catch (error) {
      console.error('Error deleting class:', error);
      toast({ title: 'Error deleting class', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const handleDeleteAssignment = async (assignmentId: string, assignmentTitle: string) => {
    try {
      await deleteAssignment(assignmentId);
      toast({ title: 'Assignment deleted', description: `${assignmentTitle} has been deleted.` });
      dashboardCache = null; fetchData();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast({ title: 'Error deleting assignment', description: 'Please try again.', variant: 'destructive' });
    }
  };

  // Synthetic onboarding: load one original assignment + 5 role-labeled responses, then take the
  // teacher to the assignment. The observed live policy — not this copy — determines disposition.
  const handleLoadSamples = async () => {
    if (!user) return;
    setLoadingSample(true);
    analytics.capture('submission_uploaded', { source: 'sample_onboarding' });
    try {
      const { assignmentId, created } = await loadSampleEssays(user.id);
      toast({
        title: created ? 'Synthetic demo loaded' : 'Opening your synthetic demo',
        description: created
          ? 'Five original, role-labeled responses are ready. Grade them, then verify each result before review.'
          : 'You already have the synthetic assignment — taking you to it.',
      });
      dashboardCache = null;
      navigate(`/assignment/${assignmentId}`);
    } catch (err) {
      console.error('Error loading sample essays:', err);
      toast({
        title: 'Could not load samples',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingSample(false);
    }
  };

  const reveal = (extra = '') => `transition-all duration-700 ${extra} ${hasAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`;

  return (
    <div className="min-h-screen">
      <Navbar />

      <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-10" data-tour="dashboard-overview">
        <TrialBanner />
        <div className={`mb-8 flex flex-wrap items-end justify-between gap-4 ${reveal()}`}>
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Your workspace</p>
            <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-foreground">Classes &amp; assignments</h1>
          </div>
          <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
            <Button ref={createClassTriggerRef} size="lg" variant="outline" className="w-full gap-2" onClick={() => setShowCreateModal(true)} data-tour="create-class">
              <Plus className="h-5 w-5" /> New class
            </Button>
            <Link to="/create-assignment" className="w-full">
              <Button size="lg" className="w-full gap-2" data-tour="create-assignment">
                <Plus className="h-5 w-5" /> New assignment
              </Button>
            </Link>
          </div>
        </div>

        {(onTheLoopLoading || (onTheLoop && onTheLoop.graded > 0)) && (
          <OnTheLoopSummary
            summary={onTheLoop}
            loading={onTheLoopLoading && !onTheLoop}
            className={`mb-8 ${reveal('delay-75')}`}
          />
        )}

        {classes.length > 0 && (
          <div className={`mb-6 flex items-center gap-3 ${reveal('delay-100')}`}>
            <SortAsc className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Sort by</span>
            <Select value={sortBy} onValueChange={(v: SortOption) => setSortBy(v)}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="time">Class time</SelectItem>
                <SelectItem value="size">Class size</SelectItem>
                <SelectItem value="grade">Grade level</SelectItem>
                <SelectItem value="name">Class name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading classes">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="mb-3 h-6 w-1/2" />
                <Skeleton className="mb-2 h-4 w-2/3" />
                <Skeleton className="mb-4 h-4 w-1/3" />
                <Skeleton className="h-20 w-full" />
              </Card>
            ))}
          </div>
        ) : finalClassSchedules.length === 0 ? (
          <Card className={`p-12 text-center shadow-sm ${reveal('delay-200')}`}>
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen className="h-8 w-8" />
            </div>
            <h2 className="font-display text-2xl font-semibold">Start your first class</h2>
            <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
              The fastest way to see Mr Selby work is our clearly labeled synthetic set — original copy,
              no real student data, and no upload. Or
              group your assignments by class and grade real student work in your voice.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button className="gap-2" onClick={handleLoadSamples} disabled={loadingSample}>
                {loadingSample
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Loading…</>
                  : <><Sparkles className="h-4 w-4" /> Try the synthetic demo</>}
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4" /> Create a class
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-8">
            {finalClassSchedules.map((cs, index) => {
              const tone = TONES[cs.tone];
              return (
                <section key={cs.id} className={reveal()} style={{ transitionDelay: `${150 + index * 90}ms` }}>
                  {/* Class header */}
                  <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className={`grid h-12 w-12 place-items-center rounded-xl ${tone.icon}`}>
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="font-display text-xl font-semibold leading-tight">{cs.name}</h2>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {cs.time !== 'N/A' && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{cs.time}</span>}
                          {cs.size > 0 && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{cs.size} students</span>}
                          {cs.grade !== 'N/A' && <span>{cs.grade}</span>}
                          {cs.level !== 'N/A' && <span>· {cs.level}</span>}
                        </div>
                      </div>
                    </div>
                    {cs.id !== 'default' && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Edit ${cs.name}`}
                          onClick={(event) => {
                            editClassTriggerRef.current = event.currentTarget;
                            handleEditClass(classes.find((c) => c.id === cs.id)!);
                          }}
                          data-tour="edit-class"
                        >
                          <Edit aria-hidden="true" className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-destructive focus:text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete class
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete class</AlertDialogTitle>
                              <AlertDialogDescription>
                                Delete “{cs.name}”? This also deletes all of its assignments and can’t be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteClass(cs.id, cs.name)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>

                  {/* Assignments */}
                  {cs.assignments.length === 0 ? (
                    <Card className="mt-4 border-dashed p-8 text-center">
                      <p className="text-muted-foreground">No assignments yet for {cs.name}.</p>
                      <Link to="/create-assignment">
                        <Button variant="outline" className="mt-4 gap-2"><Plus className="h-4 w-4" /> Add assignment</Button>
                      </Link>
                    </Card>
                  ) : (
                    <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {cs.assignments.map((assignment) => (
                        <Card key={assignment.id} className={`group border-l-4 ${tone.bar} transition-all hover:shadow-md`}>
                          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <CardTitle className="line-clamp-2 font-display text-lg font-semibold">{assignment.title}</CardTitle>
                            <AlertDialog>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="-mr-2 -mt-1 h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" /> Delete assignment
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete assignment</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Delete “{assignment.title}”? This deletes all of its submissions and can’t be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteAssignment(assignment.id, assignment.title)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </CardHeader>
                          <CardContent>
                            <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{assignment.description}</p>
                            <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(assignment.created_at).toLocaleDateString()}</span>
                              <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{assignment.submission_count} submissions</span>
                            </div>
                            <Link to={`/assignment/${assignment.id}`}>
                              <Button variant="outline" className="w-full">Open assignment</Button>
                            </Link>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        <CreateClassModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onClassCreated={handleClassCreated} returnFocusRef={createClassTriggerRef} />
        <EditClassModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} onClassUpdated={handleClassUpdated} classData={classToEdit} returnFocusRef={editClassTriggerRef} />
      </main>
    </div>
  );
};

export default Dashboard;
