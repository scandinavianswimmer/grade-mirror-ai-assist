import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import DataManagement from '@/components/DataManagement';
import { usePrivacySettings } from '@/hooks/usePrivacySettings';
import { User, School, Calendar, Mail, Save, Edit3, X, Shield, Lock, Database, AlertTriangle, Settings } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  full_name: string;
  school: string;
  years_experience: number;
  onboarding_complete: boolean;
  plan: string;
  role: string;
  created_at: string;
}

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [dataRetention, setDataRetention] = useState("30");
  // Learned grading style the teacher can inspect and reset (M52).
  const [styleSummary, setStyleSummary] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    name: '',
    school: '',
    years_experience: 0,
  });

  // Privacy settings hook
  const { settings: privacySettings, isLoading: privacyLoading, saveSettings, isSaving } = usePrivacySettings();

  // Reflect the persisted retention choice (H32).
  useEffect(() => {
    if (privacySettings) {
      setDataRetention(privacySettings.retention_days == null ? 'forever' : String(privacySettings.retention_days));
    }
  }, [privacySettings]);

  const handleRetentionChange = (value: string) => {
    setDataRetention(value);
    saveSettings({ retention_days: value === 'forever' ? null : parseInt(value, 10) });
  };

  // Load the teacher's learned grading style so they can inspect it (M52).
  useEffect(() => {
    if (!user) return;
    supabase
      .from('ai_profiles')
      .select('grading_style_summary')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setStyleSummary(data?.grading_style_summary ?? null));
  }, [user]);

  const handleResetStyle = async () => {
    if (!user) return;
    await supabase.from('ai_profiles').delete().eq('user_id', user.id);
    setStyleSummary(null);
    toast.success('Learned style reset', {
      description: 'Mr Selby will rebuild your style from new exemplars.',
    });
  };

  const fetchUserProfile = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
        return;
      }

      const userProfile = {
        ...data,
        email: user.email || data.email || ''
      };

      setProfile(userProfile);
      setFormData({
        full_name: userProfile.full_name || '',
        name: userProfile.name || '',
        school: userProfile.school || '',
        years_experience: userProfile.years_experience || 0,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [fetchUserProfile, user]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name,
          name: formData.name,
          school: formData.school,
          years_experience: Number(formData.years_experience),
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile');
        return;
      }

      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        full_name: formData.full_name,
        name: formData.name,
        school: formData.school,
        years_experience: Number(formData.years_experience),
      } : null);

      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      full_name: profile?.full_name || '',
      name: profile?.name || '',
      school: profile?.school || '',
      years_experience: profile?.years_experience || 0,
    });
    setEditing(false);
  };

  const handlePrivacySettingChange = (key: string, value: boolean) => {
    saveSettings({ [key]: value });
  };

  const getInitials = (name: string, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getPlanColor = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'pro':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getExperienceLabel = (years: number) => {
    if (years === 0) return 'New Teacher';
    if (years === 1) return '1 Year';
    if (years < 5) return `${years} Years`;
    if (years < 10) return `${years} Years (Experienced)`;
    return `${years}+ Years (Veteran)`;
  };

  if (loading || privacyLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-lg font-medium animate-pulse">Loading profile...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Profile Not Found</h2>
              <p className="text-gray-600">Unable to load your profile information.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <Navbar />
      
      <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600 mt-1">Manage your account information, privacy settings, and preferences</p>
            </div>
            {!editing ? (
              <Button 
                onClick={() => setEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile Information
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Privacy & Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Overview */}
                <Card className="lg:col-span-1">
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <Avatar className="h-24 w-24">
                        <AvatarFallback className="bg-blue-600 text-white text-2xl">
                          {getInitials(profile.full_name || profile.name || '', profile.email)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <CardTitle className="text-xl">
                      {profile.full_name || profile.name || 'Teacher'}
                    </CardTitle>
                    <p className="text-gray-600">{profile.email}</p>
                    <div className="flex justify-center mt-3">
                      <Badge className={getPlanColor(profile.plan)}>
                        {profile.plan?.charAt(0).toUpperCase() + profile.plan?.slice(1) || 'Free'} Plan
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <School className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">School</p>
                        <p className="text-sm text-gray-600">{profile.school || 'Not specified'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Experience</p>
                        <p className="text-sm text-gray-600">
                          {getExperienceLabel(profile.years_experience || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Role</p>
                        <p className="text-sm text-gray-600">{profile.role || 'Teacher'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">Member Since</p>
                        <p className="text-sm text-gray-600">
                          {new Date(profile.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Profile Details */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <p className="text-sm text-gray-600">
                      {editing ? 'Update your profile information below' : 'Your current profile information'}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        {editing ? (
                          <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => handleInputChange('full_name', e.target.value)}
                            placeholder="Enter your full name"
                          />
                        ) : (
                          <p className="text-sm text-gray-700 p-2 bg-gray-50 rounded">
                            {profile.full_name || 'Not specified'}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="name">Display Name</Label>
                        {editing ? (
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Enter your display name"
                          />
                        ) : (
                          <p className="text-sm text-gray-700 p-2 bg-gray-50 rounded">
                            {profile.name || 'Not specified'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <p className="text-sm text-gray-700 p-2 bg-gray-50 rounded">
                        {profile.email}
                      </p>
                      <p className="text-xs text-gray-500">Email cannot be changed from this page</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="school">School/Institution</Label>
                      {editing ? (
                        <Input
                          id="school"
                          value={formData.school}
                          onChange={(e) => handleInputChange('school', e.target.value)}
                          placeholder="Enter your school or institution name"
                        />
                      ) : (
                        <p className="text-sm text-gray-700 p-2 bg-gray-50 rounded">
                          {profile.school || 'Not specified'}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="years_experience">Years of Teaching Experience</Label>
                      {editing ? (
                        <Select 
                          value={formData.years_experience?.toString()} 
                          onValueChange={(value) => handleInputChange('years_experience', parseInt(value))}
                        >
                          <SelectTrigger id="years_experience">
                            <SelectValue placeholder="Select years of experience" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">New Teacher (0 years)</SelectItem>
                            <SelectItem value="1">1 Year</SelectItem>
                            <SelectItem value="2">2 Years</SelectItem>
                            <SelectItem value="3">3 Years</SelectItem>
                            <SelectItem value="4">4 Years</SelectItem>
                            <SelectItem value="5">5 Years</SelectItem>
                            <SelectItem value="6">6 Years</SelectItem>
                            <SelectItem value="7">7 Years</SelectItem>
                            <SelectItem value="8">8 Years</SelectItem>
                            <SelectItem value="9">9 Years</SelectItem>
                            <SelectItem value="10">10+ Years</SelectItem>
                            <SelectItem value="15">15+ Years</SelectItem>
                            <SelectItem value="20">20+ Years</SelectItem>
                            <SelectItem value="25">25+ Years</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-gray-700 p-2 bg-gray-50 rounded">
                          {getExperienceLabel(profile.years_experience || 0)}
                        </p>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Account Status</Label>
                      <div className="flex items-center gap-4">
                        <Badge variant={profile.onboarding_complete ? "default" : "secondary"}>
                          {profile.onboarding_complete ? "Setup Complete" : "Setup Pending"}
                        </Badge>
                        <Badge className={getPlanColor(profile.plan)}>
                          {profile.plan?.charAt(0).toUpperCase() + profile.plan?.slice(1) || 'Free'} Plan
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6">
              {/* Privacy Overview */}
              <Card className="p-6 bg-green-50 border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl font-semibold text-green-900">Your Privacy Controls</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-green-600" />
                    <span>Encrypted in transit &amp; at rest</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Access restricted to your account</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-green-600" />
                    <span>You control retention &amp; deletion</span>
                  </div>
                </div>
              </Card>

              {/* Grading Automation — Auto-finalize (On-the-Loop) */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-1">Grading Automation</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Mr Selby always drafts a grade for you to review — that's the default, and you stay in
                  control. Auto-finalize is <span className="font-medium">off until you turn it on</span>.
                  Once enabled, the clearest high-confidence, on-topic grades publish for you while you
                  stay On-the-Loop: low-confidence, off-topic, or integrity-flagged essays still come
                  to your review queue, always.
                </p>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-finalize" className="text-base font-medium">
                        Auto-finalize high-confidence grades (opt-in)
                      </Label>
                      <p className="text-sm text-gray-600">
                        Off by default. Turn this on to let Mr Selby publish confident, rubric-aligned
                        grades without manual approval. You stay On-the-Loop: low-confidence or
                        off-topic essays, and anything with an integrity flag (possible AI-generated,
                        off-topic, prompt injection), always come to you regardless of this setting.
                      </p>
                    </div>
                    <Switch
                      id="auto-finalize"
                      checked={privacySettings?.auto_finalize_enabled ?? false}
                      onCheckedChange={(checked) => handlePrivacySettingChange('auto_finalize_enabled', checked)}
                      disabled={isSaving}
                    />
                  </div>

                  <div>
                    <Label htmlFor="auto-finalize-threshold" className="text-base font-medium">
                      Confidence threshold
                    </Label>
                    <p className="text-sm text-gray-600 mb-2">
                      How sure Mr Selby must be before it finalizes on its own. Higher = more essays routed
                      to your review.
                    </p>
                    <Select
                      value={String(privacySettings?.auto_finalize_threshold ?? 0.85)}
                      onValueChange={(value) => saveSettings({ auto_finalize_threshold: parseFloat(value) })}
                      disabled={isSaving || !(privacySettings?.auto_finalize_enabled ?? false)}
                    >
                      <SelectTrigger id="auto-finalize-threshold" className="w-full max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="0.75">75% — More automation</SelectItem>
                        <SelectItem value="0.85">85% — Balanced (recommended)</SelectItem>
                        <SelectItem value="0.95">95% — Cautious</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              {/* Data Handling Settings */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Data Handling</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="anonymize" className="text-base font-medium">
                        Mask Student Names
                      </Label>
                      <p className="text-sm text-gray-600">
                        Replace student names with anonymous IDs in lists and exports. (This masks the
                        display name only — it does not redact names that appear inside essay text.)
                      </p>
                    </div>
                    <Switch
                      id="anonymize"
                      checked={privacySettings?.anonymize_student_names ?? true}
                      onCheckedChange={(checked) => handlePrivacySettingChange('anonymize_student_names', checked)}
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
                      checked={privacySettings?.allow_training_on_content ?? false}
                      onCheckedChange={(checked) => handlePrivacySettingChange('allow_training_on_content', checked)}
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
                      checked={privacySettings?.auto_delete_training_data ?? true}
                      onCheckedChange={(checked) => handlePrivacySettingChange('auto_delete_training_data', checked)}
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
                    <Select value={dataRetention} onValueChange={handleRetentionChange}>
                      <SelectTrigger id="retention" className="w-full max-w-xs">
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

              {/* Learned grading style — inspect & reset (M52) */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Your AI Grading Style</h3>
                  {styleSummary && (
                    <Button variant="outline" size="sm" onClick={handleResetStyle}>Reset learned style</Button>
                  )}
                </div>
                {styleSummary ? (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{styleSummary}</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    Mr Selby hasn't learned a style yet. Upload graded exemplars (with your feedback) to teach it your voice.
                  </p>
                )}
              </Card>

              {/* AI provider disclosure (M53) */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-2">AI Provider</h3>
                <p className="text-sm text-gray-700">
                  Grading and feedback are generated using <strong>Google Gemini</strong>, a third-party AI
                  subprocessor. Submission text you grade is sent to Google for processing. You can disable
                  style personalization above; see Google's terms for how they handle API data.
                </p>
              </Card>

              {/* Data Management Component */}
              <DataManagement />

              {/* Privacy practices */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Privacy Practices</h3>
                <div className="space-y-4 text-sm">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">How we handle student data</h4>
                    <p className="text-blue-800">
                      Submissions are stored in your account, encrypted in transit and at rest, with access
                      restricted by authentication. We practice data minimization and give you controls to
                      export and delete your data. Grading uses a third-party AI provider — see the Data
                      Handling settings above to control whether your content is used to personalize grading.
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-lg">
                    <h4 className="font-medium text-amber-900 mb-2">Regulatory note</h4>
                    <p className="text-amber-800">
                      Mr Selby is not certified compliant with FERPA, GDPR, or similar regulations. Compliance for
                      your use depends on your institution's policies and agreements. Review Mr Selby with your
                      school or district before processing student records.
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Profile;
