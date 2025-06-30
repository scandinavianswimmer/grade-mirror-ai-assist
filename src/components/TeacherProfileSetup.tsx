
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { User, BookOpen, MessageSquare, Target } from 'lucide-react';

interface TeacherProfile {
  teachingStyle: string;
  feedbackPreferences: string;
  gradingPriorities: string;
  tonePreference: string;
  subjectExpertise: string;
}

interface TeacherProfileSetupProps {
  onProfileCreated?: () => void;
  existingProfile?: any;
}

const TeacherProfileSetup = ({ onProfileCreated, existingProfile }: TeacherProfileSetupProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<TeacherProfile>({
    teachingStyle: '',
    feedbackPreferences: '',
    gradingPriorities: '',
    tonePreference: 'constructive',
    subjectExpertise: ''
  });

  useEffect(() => {
    if (existingProfile?.style_profile_json) {
      setProfile(existingProfile.style_profile_json as TeacherProfile);
    }
  }, [existingProfile]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const profileData = {
        user_id: user.id,
        style_profile_json: profile as any, // Cast to any to satisfy Json type
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('teacher_profiles')
        .upsert(profileData, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your teaching profile has been saved successfully!"
      });

      onProfileCreated?.();
    } catch (error) {
      console.error('Error saving teacher profile:', error);
      toast({
        title: "Error",
        description: "Failed to save your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          AI Grading Profile Setup
        </CardTitle>
        <p className="text-sm text-gray-600">
          Help the AI understand your teaching style and grading preferences
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="teachingStyle" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Teaching Style & Philosophy
          </Label>
          <Textarea
            id="teachingStyle"
            placeholder="Describe your teaching approach, values, and educational philosophy..."
            value={profile.teachingStyle}
            onChange={(e) => setProfile({ ...profile, teachingStyle: e.target.value })}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="feedbackPreferences" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Feedback Preferences
          </Label>
          <Textarea
            id="feedbackPreferences"
            placeholder="How do you like to give feedback? What tone and approach do you prefer?"
            value={profile.feedbackPreferences}
            onChange={(e) => setProfile({ ...profile, feedbackPreferences: e.target.value })}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gradingPriorities" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Grading Priorities
          </Label>
          <Textarea
            id="gradingPriorities"
            placeholder="What aspects do you prioritize when grading? (e.g., content, structure, creativity, grammar)"
            value={profile.gradingPriorities}
            onChange={(e) => setProfile({ ...profile, gradingPriorities: e.target.value })}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tonePreference">Tone Preference</Label>
            <select
              id="tonePreference"
              className="w-full p-2 border rounded-md"
              value={profile.tonePreference}
              onChange={(e) => setProfile({ ...profile, tonePreference: e.target.value })}
            >
              <option value="constructive">Constructive</option>
              <option value="encouraging">Encouraging</option>
              <option value="direct">Direct</option>
              <option value="supportive">Supportive</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subjectExpertise">Subject Expertise</Label>
            <Input
              id="subjectExpertise"
              placeholder="e.g., English Literature, History"
              value={profile.subjectExpertise}
              onChange={(e) => setProfile({ ...profile, subjectExpertise: e.target.value })}
            />
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={loading || !profile.teachingStyle}
          className="w-full"
        >
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TeacherProfileSetup;
