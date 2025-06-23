
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Lock, Database, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import DataManagement from "@/components/DataManagement";
import { usePrivacySettings } from "@/hooks/usePrivacySettings";

const PrivacySettings = () => {
  const { settings, isLoading, saveSettings, isSaving } = usePrivacySettings();
  const [dataRetention, setDataRetention] = useState("30");

  const handleSettingChange = (key: string, value: boolean) => {
    saveSettings({ [key]: value });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading privacy settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Settings</h1>
            <p className="text-gray-600">
              Manage your data privacy preferences and ensure FERPA/GDPR compliance for your educational content.
            </p>
          </div>

          {/* Privacy Overview */}
          <Card className="p-6 mb-8 bg-green-50 border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-green-900">Privacy Protection Active</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-green-600" />
                <span>End-to-end encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span>FERPA compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-green-600" />
                <span>GDPR compliant</span>
              </div>
            </div>
          </Card>

          {/* Data Handling Settings */}
          <Card className="p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Data Handling</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="anonymize" className="text-base font-medium">
                    Anonymize Student Data
                  </Label>
                  <p className="text-sm text-gray-600">
                    Remove personally identifiable information from uploaded submissions
                  </p>
                </div>
                <Switch
                  id="anonymize"
                  checked={settings?.anonymize_student_names ?? true}
                  onCheckedChange={(checked) => handleSettingChange('anonymize_student_names', checked)}
                  disabled={isSaving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ai-training" className="text-base font-medium">
                    Allow AI Training with Your Content
                  </Label>
                  <p className="text-sm text-gray-600">
                    Use your grading examples to improve AI model accuracy
                  </p>
                </div>
                <Switch
                  id="ai-training"
                  checked={settings?.allow_training_on_content ?? true}
                  onCheckedChange={(checked) => handleSettingChange('allow_training_on_content', checked)}
                  disabled={isSaving}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-delete" className="text-base font-medium">
                    Auto-delete Unfinalized Grades
                  </Label>
                  <p className="text-sm text-gray-600">
                    Automatically remove AI-generated content that hasn't been approved
                  </p>
                </div>
                <Switch
                  id="auto-delete"
                  checked={settings?.auto_delete_training_data ?? true}
                  onCheckedChange={(checked) => handleSettingChange('auto_delete_training_data', checked)}
                  disabled={isSaving}
                />
              </div>

              <div>
                <Label htmlFor="retention" className="text-base font-medium">
                  Data Retention Period
                </Label>
                <p className="text-sm text-gray-600 mb-2">
                  How long to keep uploaded files and grading data
                </p>
                <Select value={dataRetention} onValueChange={setDataRetention}>
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="365">1 year</SelectItem>
                    <SelectItem value="forever">Keep forever</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Data Management Component */}
          <DataManagement />

          {/* Compliance Information */}
          <Card className="p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Compliance & Legal</h3>
            <div className="space-y-4 text-sm">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">FERPA Compliance</h4>
                <p className="text-blue-800">
                  GradeMirror is designed to comply with the Family Educational Rights and Privacy Act (FERPA). 
                  Student data is encrypted, access is restricted, and you maintain full control over your educational records.
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">GDPR Compliance</h4>
                <p className="text-green-800">
                  We follow General Data Protection Regulation (GDPR) principles including data minimization, 
                  purpose limitation, and your right to access, rectify, and delete your personal data.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
