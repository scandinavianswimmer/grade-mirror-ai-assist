
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getTeacherProfile } from '@/lib/submissionApi';

export const useTeacherProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const profileData = await getTeacherProfile(user.id);
        setProfile(profileData);
        setHasProfile(!!profileData);
      } catch (error) {
        console.error('Error fetching teacher profile:', error);
        setHasProfile(false);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const refetchProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const profileData = await getTeacherProfile(user.id);
      setProfile(profileData);
      setHasProfile(!!profileData);
    } catch (error) {
      console.error('Error refetching teacher profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    hasProfile,
    loading,
    refetchProfile
  };
};
