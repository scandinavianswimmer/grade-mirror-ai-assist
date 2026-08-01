
import { useState, useEffect, useCallback } from 'react';
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [limits, setLimits] = useState<UserLimits | null>(null);
  const [submissions, setSubmissions] = useState<FreemiumSubmission[]>([]);
  const [trainingExamples, setTrainingExamples] = useState<TrainingExample[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    
    try {
      const [limitsData, submissionsData, trainingData] = await Promise.all([
        getUserLimits(user.id),
        getSubmissions(user.id),
        getTrainingExamples(user.id)
      ]);

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
  }, [toast, user]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [loadDashboardData, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-lg font-medium">Loading dashboard...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to <span className="text-blue-600">aiTA</span>
            </h1>
            <p className="text-gray-600">
              Your AI-powered grading assistant. Upload training examples and start generating personalized feedback.
            </p>
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
                      Upgrade to continue using aiTA with unlimited training examples and feedback generation.
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
                <Link to="/upload-training">
                  <Button className="w-full" disabled={limits?.trainingExamplesCount >= (limits?.maxTrainingExamples || 5)}>
                    Upload Examples
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
                <Link to="/submit-assignment">
                  <Button className="w-full" disabled={limits?.weeklyFeedbackCount >= (limits?.maxWeeklyFeedback || 10)}>
                    Grade Essay
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
                <Link to="/training">
                  <Button variant="outline" className="w-full">
                    View Training
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent AI Feedback</h3>
              {submissions.length > 0 ? (
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
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Training Examples</h3>
              {trainingExamples.length > 0 ? (
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
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FreemiumDashboard;
