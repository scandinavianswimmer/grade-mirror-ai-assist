
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { updateOnboardingProfile } from '@/lib/onboardingApi';

interface ProfileSetupProps {
  userId: string;
  onComplete: () => void;
}

const ProfileSetup = ({ userId, onComplete }: ProfileSetupProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    school: '',
    gender: '',
    years_experience: 0,
    why_joining: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const profileData = {
        basicInfo: {
          fullName: formData.full_name,
          school: formData.school,
          yearsExperience: formData.years_experience,
        },
        teachingEnvironment: {
          gradeLevel: '',
          subjects: [],
          classSize: ''
        },
        goals: {
          primary: '',
          timeExpectation: ''
        },
        technicalComfort: {
          level: '',
          previousAI: false
        },
        accountSetup: {
          notifications: true,
          privacy: 'standard'
        },
        referral: {
          source: 'other',
          other: formData.why_joining
        }
      };
      
      await updateOnboardingProfile(userId, profileData);
      toast({
        title: "Profile saved!",
        description: "Your profile has been updated successfully."
      });
      onComplete();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="full_name">Full Name *</Label>
          <Input
            id="full_name"
            required
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <Label htmlFor="school">School/Institution *</Label>
          <Input
            id="school"
            required
            value={formData.school}
            onChange={(e) => setFormData({ ...formData, school: e.target.value })}
            placeholder="Enter your school name"
          />
        </div>

        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="non-binary">Non-binary</SelectItem>
              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="years_experience">Years of Teaching Experience *</Label>
          <Input
            id="years_experience"
            type="number"
            min="0"
            max="50"
            required
            value={formData.years_experience}
            onChange={(e) => setFormData({ ...formData, years_experience: parseInt(e.target.value) || 0 })}
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="why_joining">Why are you using Mr Selby? *</Label>
        <Textarea
          id="why_joining"
          required
          value={formData.why_joining}
          onChange={(e) => setFormData({ ...formData, why_joining: e.target.value })}
          placeholder="Tell us about your goals and what you hope to achieve..."
          rows={4}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Saving...' : 'Continue to Next Step'}
      </Button>
    </form>
  );
};

export default ProfileSetup;
