
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PrivacySettings } from '@/lib/supabase'
import { getPrivacySettings, createPrivacySettings, updatePrivacySettings } from '@/lib/privacyApi'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/hooks/use-toast'

export const usePrivacySettings = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['privacy-settings', user?.id],
    queryFn: () => user ? getPrivacySettings(user.id) : null,
    enabled: !!user
  })

  const createMutation = useMutation({
    mutationFn: createPrivacySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-settings'] })
      toast({
        title: "Privacy settings created",
        description: "Your privacy preferences have been saved."
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create privacy settings.",
        variant: "destructive"
      })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ updates }: { updates: Partial<PrivacySettings> }) => 
      updatePrivacySettings(user!.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-settings'] })
      toast({
        title: "Privacy settings updated",
        description: "Your privacy preferences have been saved."
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update privacy settings.",
        variant: "destructive"
      })
    }
  })

  const saveSettings = (newSettings: Partial<PrivacySettings>) => {
    if (!user) return

    if (settings) {
      updateMutation.mutate({ updates: newSettings })
    } else {
      createMutation.mutate({
        user_id: user.id,
        anonymize_student_names: true,
        // Training on teacher content is OFF by default — requires explicit opt-in (C10).
        allow_training_on_content: false,
        auto_delete_training_data: true,
        ...newSettings
      })
    }
  }

  return {
    settings,
    isLoading,
    saveSettings,
    isSaving: createMutation.isPending || updateMutation.isPending
  }
}
