
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

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

interface RecentAssignmentsProps {
  assignments: Assignment[];
  classes: Class[];
  hasAnimated: boolean;
}

const RecentAssignments = ({ assignments, classes, hasAnimated }: RecentAssignmentsProps) => {
  // Get recent assignments across all classes for the summary section
  const recentAssignments = assignments
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  if (recentAssignments.length === 0) {
    return null;
  }

  return (
    <div className={`transition-all duration-700 delay-500 ${hasAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Assignments</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recentAssignments.map((assignment) => {
          const assignmentClass = classes.find(c => c.id === assignment.class_id);
          return (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-1 line-clamp-1">{assignment.title}</h4>
                {assignmentClass && (
                  <p className="text-sm text-blue-600 mb-2">{assignmentClass.class_name}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{new Date(assignment.created_at).toLocaleDateString()}</span>
                  <span>{assignment.submission_count} submissions</span>
                </div>
                <Link to={`/assignment/${assignment.id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    View Assignment
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default RecentAssignments;
