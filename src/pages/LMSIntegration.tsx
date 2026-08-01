
import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckCircle, AlertCircle, Link, RefreshCw, Download, Upload, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import type { AppTableUpdate } from "@/integrations/supabase/app-database";
import { generateCanvasAuthUrl, disconnectCanvas } from "@/lib/canvasOAuth";
import { syncCanvasAssignments, getCanvasClient } from "@/lib/canvasApi";

const LMSIntegration = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [autoPush, setAutoPush] = useState(false);
  const [canvasUrl, setCanvasUrl] = useState("https://canvas.instructure.com");
  const [loading, setLoading] = useState(false);
  const [syncStats, setSyncStats] = useState({
    assignmentsCount: 0,
    gradesCount: 0,
    lastSync: null as string | null
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const checkConnectionStatus = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('lms_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'canvas')
      .eq('status', 'connected')
      .single();

    setIsConnected(!!data);
    if (data?.canvas_url) {
      setCanvasUrl(data.canvas_url);
    }
  }, [user]);

  const loadSyncStats = useCallback(async () => {
    if (!user) return;

    // Get assignments count
    const { count: assignmentsCount } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('canvas_id', 'is', null);

    // Get pushed grades count
    const { count: gradesCount } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pushed_to_lms');

    // Get last sync time (most recent assignment creation)
    const { data: lastAssignment } = await supabase
      .from('assignments')
      .select('created_at')
      .eq('user_id', user.id)
      .not('canvas_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    setSyncStats({
      assignmentsCount: assignmentsCount || 0,
      gradesCount: gradesCount || 0,
      lastSync: lastAssignment?.created_at || null
    });
  }, [user]);

  useEffect(() => {
    checkConnectionStatus();
    loadSyncStats();
  }, [checkConnectionStatus, loadSyncStats]);

  const handleConnect = () => {
    if (!canvasUrl.trim()) {
      toast({
        title: "Canvas URL required",
        description: "Please enter your Canvas instance URL",
        variant: "destructive"
      });
      return;
    }

    const authUrl = generateCanvasAuthUrl(canvasUrl);
    window.location.href = authUrl;
  };

  const handleDisconnect = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await disconnectCanvas(user.id);
      setIsConnected(false);
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from Canvas",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect from Canvas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const assignments = await syncCanvasAssignments(user.id);
      await loadSyncStats();
      toast({
        title: "Sync completed",
        description: `Synced ${assignments.length} assignments from Canvas`,
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Failed to sync with Canvas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSyncSettings = async (setting: 'auto_sync' | 'auto_push', value: boolean) => {
    if (!user) return;

    const updates: AppTableUpdate<'lms_integrations'> = setting === 'auto_sync'
      ? { auto_sync: value }
      : { auto_push: value };

    await supabase
      .from('lms_integrations')
      .update(updates)
      .eq('user_id', user.id)
      .eq('platform', 'canvas');
  };

  const formatLastSync = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
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
                    <p className="font-semibold">{syncStats.assignmentsCount}</p>
                    <p className="text-sm text-gray-600">Assignments Synced</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Upload className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="font-semibold">{syncStats.gradesCount}</p>
                    <p className="text-sm text-gray-600">Grades Pushed</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <RefreshCw className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <p className="font-semibold">{formatLastSync(syncStats.lastSync)}</p>
                    <p className="text-sm text-gray-600">Last Sync</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleSync} disabled={loading} className="flex-1">
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Syncing...' : 'Sync Now'}
                  </Button>
                  <Button variant="outline" onClick={handleDisconnect} disabled={loading}>
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <Link className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-6">
                    Connect your Canvas account to automatically sync assignments and grades.
                  </p>
                </div>
                
                <div className="max-w-md mx-auto">
                  <Label htmlFor="canvas-url">Canvas Instance URL</Label>
                  <Input
                    id="canvas-url"
                    type="url"
                    placeholder="https://yourschool.instructure.com"
                    value={canvasUrl}
                    onChange={(e) => setCanvasUrl(e.target.value)}
                    className="mb-4"
                  />
                  <Button onClick={handleConnect} size="lg" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Connect to Canvas
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Sync Settings */}
          {isConnected && (
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
                    onCheckedChange={(checked) => {
                      setAutoSync(checked);
                      updateSyncSettings('auto_sync', checked);
                    }}
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
                    onCheckedChange={(checked) => {
                      setAutoPush(checked);
                      updateSyncSettings('auto_push', checked);
                    }}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Recent Activity */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Sync Activity</h3>
            <div className="space-y-4">
              {syncStats.assignmentsCount > 0 ? (
                <>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium">Assignments Synced Successfully</p>
                        <p className="text-sm text-gray-600">
                          Synchronized {syncStats.assignmentsCount} assignments from Canvas
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Success</Badge>
                  </div>
                  
                  {syncStats.gradesCount > 0 && (
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Upload className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium">Grades Pushed to Canvas</p>
                          <p className="text-sm text-gray-600">
                            Successfully pushed {syncStats.gradesCount} grades and feedback
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No sync activity yet. Connect to Canvas and sync your assignments to get started.</p>
                </div>
              )}
            </div>
          </Card>

          {/* Help Section */}
          <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
            <p className="text-blue-800 text-sm mb-4">
              Having trouble connecting to Canvas? Make sure you have the correct Canvas URL and administrator permissions.
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
