
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertCircle, Link, RefreshCw, Download, Upload } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";

const LMSIntegration = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [autoPush, setAutoPush] = useState(false);
  const { toast } = useToast();

  const handleConnect = () => {
    toast({
      title: "Connecting to Canvas...",
      description: "You'll be redirected to Canvas for authentication.",
    });
  };

  const handleSync = () => {
    toast({
      title: "Syncing assignments...",
      description: "Fetching latest assignments and submissions from Canvas.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">LMS Integration</h1>
            <p className="text-gray-600">
              Connect your Learning Management System to automatically sync assignments and push graded feedback.
            </p>
          </div>

          {/* Connection Status */}
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Canvas LMS</h2>
              {isConnected ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Not Connected
                </Badge>
              )}
            </div>

            {isConnected ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Download className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="font-semibold">15</p>
                    <p className="text-sm text-gray-600">Assignments Synced</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Upload className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="font-semibold">8</p>
                    <p className="text-sm text-gray-600">Grades Pushed</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <RefreshCw className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <p className="font-semibold">5 min</p>
                    <p className="text-sm text-gray-600">Last Sync</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleSync} className="flex-1">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync Now
                  </Button>
                  <Button variant="outline" onClick={() => setIsConnected(false)}>
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Link className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-6">
                  Connect your Canvas account to automatically sync assignments and grades.
                </p>
                <Button onClick={handleConnect} size="lg">
                  <Link className="w-4 h-4 mr-2" />
                  Connect to Canvas
                </Button>
              </div>
            )}
          </Card>

          {/* Sync Settings */}
          <Card className="p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Sync Settings</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-sync" className="text-base font-medium">
                    Auto-sync assignments
                  </Label>
                  <p className="text-sm text-gray-600">
                    Automatically fetch new assignments and submissions every hour
                  </p>
                </div>
                <Switch
                  id="auto-sync"
                  checked={autoSync}
                  onCheckedChange={setAutoSync}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-push" className="text-base font-medium">
                    Auto-push approved grades
                  </Label>
                  <p className="text-sm text-gray-600">
                    Automatically send finalized grades and feedback to Canvas
                  </p>
                </div>
                <Switch
                  id="auto-push"
                  checked={autoPush}
                  onCheckedChange={setAutoPush}
                />
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Sync Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Essay Assignment #3 - Grade Posted</p>
                    <p className="text-sm text-gray-600">Pushed 8 grades to Canvas • 2 minutes ago</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">Success</Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Research Paper Assignment - Synced</p>
                    <p className="text-sm text-gray-600">Fetched 12 new submissions • 1 hour ago</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Synced</Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Weekly Discussion Posts - Synced</p>
                    <p className="text-sm text-gray-600">Fetched 25 new posts • 3 hours ago</p>
                  </div>
                </div>
                <Badge variant="outline">Completed</Badge>
              </div>
            </div>
          </Card>

          {/* Help Section */}
          <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
            <p className="text-blue-800 text-sm mb-4">
              Having trouble connecting to Canvas? Check our integration guide or contact support.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                Integration Guide
              </Button>
              <Button variant="outline" size="sm">
                Contact Support
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LMSIntegration;
