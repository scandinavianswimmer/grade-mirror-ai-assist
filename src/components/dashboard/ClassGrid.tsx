
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, GraduationCap, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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

interface ClassGridProps {
  classes: Class[];
  hasAnimated: boolean;
}

const ClassGrid = ({ classes, hasAnimated }: ClassGridProps) => {
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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {classes.map((classItem, index) => (
        <Card 
          key={classItem.id} 
          className={`hover:shadow-xl transition-all duration-500 cursor-pointer group ${hasAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: `${400 + index * 100}ms` }}
        >
          <Link to={`/class/${classItem.id}`}>
            <CardHeader className={`bg-gradient-to-r ${colorSchemes[index % colorSchemes.length]} text-white rounded-t-lg`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">{classItem.class_name}</CardTitle>
                    <div className="flex items-center gap-2 text-white/90 mt-1">
                      <Clock className="w-4 h-4" />
                      <span>{classItem.details_jsonb.time}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Grade Level:</span>
                  <span className="font-medium">{classItem.details_jsonb.grade}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Class Size:</span>
                  <span className="font-medium">{classItem.details_jsonb.size} students</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Level:</span>
                  <span className="font-medium">{classItem.details_jsonb.level}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Assignments:</span>
                  <span className="font-medium">{classItem.assignment_count || 0}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-500">
                  Created {new Date(classItem.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Link>
        </Card>
      ))}
    </div>
  );
};

export default ClassGrid;
