
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, Brain, FileText, Star, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/components/AuthProvider';
import { getUserLimits, getSubmissions, getTrainingExamples, UserLimits, FreemiumSubmission, TrainingExample } from '@/lib/freemiumApi';
import { useToast } from '@/hooks/use-toast';

const FreemiumDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [limits, setLimits] = useState<UserLimits | null>(null);
  const [submissions, setSubmissions] = useState<FreemiumSubmission[]>([]);
  const [trainingExamples, setTrainingExamples] = useState<TrainingExample[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('FreemiumDashboard: Auth state changed', { user: !!user, authLoading });
    
    if (authLoading) {
      return; // Still loading auth state
    }
    
    if (!user) {
      console.log('FreemiumDashboard: No user, showing demo data');
      // Show demo/placeholder data for non-authenticated users
      setLimits({
        trainingExamplesCount: 0,
        weeklyFeedbackCount: 0,
        maxTrainingExamples: 5,
        maxWeeklyFeedback: 10,
        plan: 'freemium'
      });
      setSubmissions([]);
      setTrainingExamples([]);
      setLoading(false);
      return;
    }

    loadDashboardData();
  }, [user, authLoading]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    console.log('FreemiumDashboard: Loading data for user', user.id);
    
    try {
      const [limitsData, submissionsData, trainingData] = await Promise.all([
        getUserLimits(user.id),
        getSubmissions(user.id),
        getTrainingExamples(user.id)
      ]);

      console.log('FreemiumDashboard: Data loaded', { 
        limits: limitsData, 
        submissions: submissionsData.length, 
        training: trainingData.length 
      });

      setLimits(limitsData);
      setSubmissions(submissionsData.slice(0, 5));
      setTrainingExamples(trainingData);
    } catch (error) {
      console.error('Dashboard error:', error);
      toast({
        title: "Error loading dashboard",
        description: "Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while auth is loading
  if (authLoading) {
    console.log('FreemiumDashboard: Auth loading...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-lg font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  // Show loading spinner while dashboard data is loading
  if (loading) {
    console.log('FreemiumDashboard: Dashboard loading...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-lg font-medium">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  console.log('FreemiumDashboard: Rendering dashboard', { user: !!user, limits });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to <span className="text-blue-600">GradeMirror</span>
            </h1>
            <p className="text-gray-600">
              Your AI-powered grading assistant. Upload training examples and start generating personalized feedback.
            </p>
            {!user && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">
                  <Link to="/auth" className="font-medium underline">Sign in</Link> to start using GradeMirror with your personal training data.
                </p>
              </div>
            )}
          </div>

          {/* Freemium Limits Card */}
          {limits && (
            <Card className="p-6 mb-8 border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Freemium Plan Status</h2>
                <Badge className="bg-blue-100 text-blue-800">
                  <Star className="w-3 h-3 mr-1" />
                  Free Plan
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Training Examples</span>
                    <span>{limits.trainingExamplesCount}/{limits.maxTrainingExamples}</span>
                  </div>
                  <Progress value={(limits.trainingExamplesCount / limits.maxTrainingExamples) * 100} className="h-2 mb-2" />
                  <p className="text-xs text-gray-600">Upload past graded work to improve AI accuracy</p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Weekly AI Feedback</span>
                    <span>{limits.weeklyFeedbackCount}/{limits.maxWeeklyFeedback}</span>
                  </div>
                  <Progress value={(limits.weeklyFeedbackCount / limits.maxWeeklyFeedback) * 100} className="h-2 mb-2" />
                  <p className="text-xs text-gray-600">Generate AI feedback for student essays</p>
                </div>
              </div>

              {(limits.trainingExamplesCount >= limits.maxTrainingExamples || limits.weeklyFeedbackCount >= limits.maxWeeklyFeedback) && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Limit Reached</p>
                    <p className="text-sm text-yellow-700">
                      Upgrade to continue using GradeMirror with unlimited training examples and feedback generation.
                    </p>
                    <Button className="mt-2" size="sm">Upgrade Plan</Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Upload Training Data</h3>
                <p className="text-gray-600 mb-4">Upload past graded essays to train the AI</p>
                <Link to={user ? "/upload-training" : "/auth"}>
                  <Button className="w-full" disabled={!user || (limits?.trainingExamplesCount >= (limits?.maxTrainingExamples || 5))}>
                    {user ? "Upload Examples" : "Sign In to Upload"}
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Grade New Essay</h3>
                <p className="text-gray-600 mb-4">Upload student essay for AI feedback</p>
                <Link to={user ? "/submit-assignment" : "/auth"}>
                  <Button className="w-full" disabled={!user || (limits?.weeklyFeedbackCount >= (limits?.maxWeeklyFeedback || 10))}>
                    {user ? "Grade Essay" : "Sign In to Grade"}
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">AI Training Status</h3>
                <p className="text-gray-600 mb-4">View your AI model training progress</p>
                <Link to={user ? "/training" : "/auth"}>
                  <Button variant="outline" className="w-full">
                    {user ? "View Training" : "Sign In to View"}
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent AI Feedback</h3>
              {user ? (
                submissions.length > 0 ? (
                  <div className="space-y-3">
                    {submissions.map((submission) => (
                      <div key={submission.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-sm">Student Essay</p>
                        <p className="text-xs text-gray-600 truncate">{submission.essay.substring(0, 100)}...</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-500">
                            {new Date(submission.created_at).toLocaleDateString()}
                          </span>
                          {submission.ai_grade && (
                            <Badge variant="outline">{submission.ai_grade}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No feedback generated yet</p>
                )
              ) : (
                <p className="text-gray-500 text-center py-4">Sign in to see your recent feedback</p>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Training Examples</h3>
              {user ? (
                trainingExamples.length > 0 ? (
                  <div className="space-y-3">
                    {trainingExamples.slice(0, 5).map((example) => (
                      <div key={example.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-sm">Training Example</p>
                        <p className="text-xs text-gray-600 truncate">{example.essay.substring(0, 80)}...</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-gray-500">
                            {new Date(example.created_at).toLocaleDateString()}
                          </span>
                          {example.grade && (
                            <Badge variant="outline">{example.grade}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No training examples uploaded</p>
                )
              ) : (
                <p className="text-gray-500 text-center py-4">Sign in to upload training examples</p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreemiumDashboard;
