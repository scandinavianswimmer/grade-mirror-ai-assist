
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Brain, Link, BarChart3, Shield, BookOpen } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import Navbar from "@/components/Navbar";
import StatsCard from "@/components/StatsCard";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to <span className="text-blue-600">aiTA</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your AI-powered grading assistant that learns your unique teaching style and helps you provide consistent, personalized feedback to students.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatsCard
            title="Active Assignments"
            value="3"
            icon={BookOpen}
            color="blue"
          />
          <StatsCard
            title="Pending Reviews"
            value="12"
            icon={BarChart3}
            color="orange"
          />
          <StatsCard
            title="AI Training Status"
            value="Ready"
            icon={Brain}
            color="green"
          />
          <StatsCard
            title="LMS Connected"
            value="Canvas"
            icon={Link}
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Upload Assignment</h3>
              <p className="text-gray-600 mb-4">Upload student submissions and get AI-powered grading assistance</p>
              <RouterLink to="/upload">
                <Button className="w-full">Upload Now</Button>
              </RouterLink>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <Brain className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Train AI Model</h3>
              <p className="text-gray-600 mb-4">Upload past grading examples to improve AI accuracy</p>
              <RouterLink to="/training">
                <Button variant="outline" className="w-full">Train AI</Button>
              </RouterLink>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <Link className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Connect LMS</h3>
              <p className="text-gray-600 mb-4">Integrate with Canvas to sync assignments and grades</p>
              <RouterLink to="/lms">
                <Button variant="outline" className="w-full">Connect</Button>
              </RouterLink>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Essay Assignment #3 - English 101</p>
                <p className="text-sm text-gray-600">12 submissions awaiting review</p>
              </div>
              <RouterLink to="/grading/preview">
                <Button size="sm">Review</Button>
              </RouterLink>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Research Paper - History 201</p>
                <p className="text-sm text-gray-600">AI training completed</p>
              </div>
              <Button size="sm" variant="outline">View</Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Canvas Integration</p>
                <p className="text-sm text-gray-600">Successfully synced 5 assignments</p>
              </div>
              <Button size="sm" variant="outline">Manage</Button>
            </div>
          </div>
        </Card>

        {/* Privacy Notice */}
        <Card className="mt-8 p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-blue-800">
                <strong>Your privacy controls:</strong> Student data is encrypted in transit and at rest and access is restricted to your account. You control retention and deletion.
                <RouterLink to="/privacy" className="underline ml-1">Review privacy settings</RouterLink>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;
