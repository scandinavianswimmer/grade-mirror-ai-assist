export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      access_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          resource: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          resource: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          resource?: string
        }
        Relationships: []
      }
      ai_model_health: {
        Row: {
          average_response_time_ms: number | null
          consecutive_failures: number | null
          created_at: string | null
          id: string
          last_failure_at: string | null
          last_success_at: string | null
          model_name: string
          provider: string
          status: string
          total_failures: number | null
          total_requests: number | null
          updated_at: string | null
        }
        Insert: {
          average_response_time_ms?: number | null
          consecutive_failures?: number | null
          created_at?: string | null
          id?: string
          last_failure_at?: string | null
          last_success_at?: string | null
          model_name: string
          provider: string
          status?: string
          total_failures?: number | null
          total_requests?: number | null
          updated_at?: string | null
        }
        Update: {
          average_response_time_ms?: number | null
          consecutive_failures?: number | null
          created_at?: string | null
          id?: string
          last_failure_at?: string | null
          last_success_at?: string | null
          model_name?: string
          provider?: string
          status?: string
          total_failures?: number | null
          total_requests?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_profiles: {
        Row: {
          ai_model_id: string | null
          created_at: string | null
          grading_style_summary: string | null
          id: string
          last_trained: string | null
          user_id: string
        }
        Insert: {
          ai_model_id?: string | null
          created_at?: string | null
          grading_style_summary?: string | null
          id?: string
          last_trained?: string | null
          user_id: string
        }
        Update: {
          ai_model_id?: string | null
          created_at?: string | null
          grading_style_summary?: string | null
          id?: string
          last_trained?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_request_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          fallback_model: string | null
          function_name: string
          id: string
          model_name: string
          provider: string
          request_type: string | null
          response_time_ms: number | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          fallback_model?: string | null
          function_name: string
          id?: string
          model_name: string
          provider: string
          request_type?: string | null
          response_time_ms?: number | null
          status: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          fallback_model?: string | null
          function_name?: string
          id?: string
          model_name?: string
          provider?: string
          request_type?: string | null
          response_time_ms?: number | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      annotation_edits: {
        Row: {
          action: string
          annotation_id: string
          created_at: string
          id: string
          original: Json | null
          revised: Json | null
          user_id: string
        }
        Insert: {
          action: string
          annotation_id: string
          created_at?: string
          id?: string
          original?: Json | null
          revised?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          annotation_id?: string
          created_at?: string
          id?: string
          original?: Json | null
          revised?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "annotation_edits_annotation_id_fkey"
            columns: ["annotation_id"]
            isOneToOne: false
            referencedRelation: "annotations"
            referencedColumns: ["id"]
          },
        ]
      }
      annotations: {
        Row: {
          ai_comment: string | null
          comment: string
          created_at: string
          end_index: number | null
          id: string
          matched: boolean
          quote: string
          start_index: number | null
          status: string
          submission_id: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_comment?: string | null
          comment: string
          created_at?: string
          end_index?: number | null
          id?: string
          matched?: boolean
          quote: string
          start_index?: number | null
          status?: string
          submission_id: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_comment?: string | null
          comment?: string
          created_at?: string
          end_index?: number | null
          id?: string
          matched?: boolean
          quote?: string
          start_index?: number | null
          status?: string
          submission_id?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "annotations_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          canvas_course_id: string | null
          canvas_id: string | null
          class_id: string | null
          course_name: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          instructions: string | null
          prompt_instructions: string | null
          rubric_json: Json | null
          rubric_text: string | null
          rubric_url: string | null
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          canvas_course_id?: string | null
          canvas_id?: string | null
          class_id?: string | null
          course_name?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          prompt_instructions?: string | null
          rubric_json?: Json | null
          rubric_text?: string | null
          rubric_url?: string | null
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          canvas_course_id?: string | null
          canvas_id?: string | null
          class_id?: string | null
          course_name?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          instructions?: string | null
          prompt_instructions?: string | null
          rubric_json?: Json | null
          rubric_text?: string | null
          rubric_url?: string | null
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          class_name: string
          created_at: string
          details_jsonb: Json
          id: string
          user_id: string
        }
        Insert: {
          class_name: string
          created_at?: string
          details_jsonb: Json
          id?: string
          user_id: string
        }
        Update: {
          class_name?: string
          created_at?: string
          details_jsonb?: Json
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      consent_records: {
        Row: {
          created_at: string
          granted: boolean
          id: string
          note: string | null
          scope: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted: boolean
          id?: string
          note?: string | null
          scope: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          id?: string
          note?: string | null
          scope?: string
          user_id?: string
        }
        Relationships: []
      }
      enterprise_contacts: {
        Row: {
          contact_name: string
          created_at: string
          email: string
          id: string
          institution_name: string
          message: string | null
        }
        Insert: {
          contact_name: string
          created_at?: string
          email: string
          id?: string
          institution_name: string
          message?: string | null
        }
        Update: {
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          institution_name?: string
          message?: string | null
        }
        Relationships: []
      }
      grading_examples: {
        Row: {
          file_type: string
          file_url: string
          id: string
          teacher_comments: Json | null
          title: string
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          file_type: string
          file_url: string
          id?: string
          teacher_comments?: Json | null
          title: string
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          file_type?: string
          file_url?: string
          id?: string
          teacher_comments?: Json | null
          title?: string
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grading_examples_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_sessions: {
        Row: {
          confidence_score: number | null
          id: string
          input_data: Json | null
          output_data: Json | null
          status: string | null
          timestamp: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          status?: string | null
          timestamp?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          status?: string | null
          timestamp?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "llm_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lms_credentials: {
        Row: {
          access_token_enc: string | null
          canvas_url: string | null
          created_at: string
          id: string
          platform: string
          refresh_token_enc: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
          vault_secret_id: string | null
        }
        Insert: {
          access_token_enc?: string | null
          canvas_url?: string | null
          created_at?: string
          id?: string
          platform?: string
          refresh_token_enc?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
          vault_secret_id?: string | null
        }
        Update: {
          access_token_enc?: string | null
          canvas_url?: string | null
          created_at?: string
          id?: string
          platform?: string
          refresh_token_enc?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
          vault_secret_id?: string | null
        }
        Relationships: []
      }
      lms_integrations: {
        Row: {
          access_token: string
          auto_push: boolean | null
          auto_sync: boolean | null
          canvas_url: string | null
          created_at: string | null
          id: string
          platform: string
          refresh_token: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          auto_push?: boolean | null
          auto_sync?: boolean | null
          canvas_url?: string | null
          created_at?: string | null
          id?: string
          platform: string
          refresh_token?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          auto_push?: boolean | null
          auto_sync?: boolean | null
          canvas_url?: string | null
          created_at?: string | null
          id?: string
          platform?: string
          refresh_token?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lms_integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      podcast_episodes: {
        Row: {
          audio_url: string | null
          created_at: string
          id: string
          input_notes: string | null
          script: string | null
          status: string
          summary: string | null
          tags: string[] | null
          title: string
          transcript: string | null
          updated_at: string
          user_id: string
          voice_style: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          id?: string
          input_notes?: string | null
          script?: string | null
          status?: string
          summary?: string | null
          tags?: string[] | null
          title: string
          transcript?: string | null
          updated_at?: string
          user_id: string
          voice_style?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          id?: string
          input_notes?: string | null
          script?: string | null
          status?: string
          summary?: string | null
          tags?: string[] | null
          title?: string
          transcript?: string | null
          updated_at?: string
          user_id?: string
          voice_style?: string | null
        }
        Relationships: []
      }
      privacy_settings: {
        Row: {
          allow_training_on_content: boolean | null
          anonymize_student_names: boolean | null
          auto_delete_training_data: boolean | null
          created_at: string | null
          id: string
          retention_days: number | null
          user_id: string
        }
        Insert: {
          allow_training_on_content?: boolean | null
          anonymize_student_names?: boolean | null
          auto_delete_training_data?: boolean | null
          created_at?: string | null
          id?: string
          retention_days?: number | null
          user_id: string
        }
        Update: {
          allow_training_on_content?: boolean | null
          anonymize_student_names?: boolean | null
          auto_delete_training_data?: boolean | null
          created_at?: string | null
          id?: string
          retention_days?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "privacy_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rubric_criteria: {
        Row: {
          created_at: string
          id: string
          level_descriptors: Json
          max_score: number
          name: string
          rubric_id: string
          sort_order: number
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          level_descriptors?: Json
          max_score?: number
          name: string
          rubric_id: string
          sort_order?: number
          user_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          level_descriptors?: Json
          max_score?: number
          name?: string
          rubric_id?: string
          sort_order?: number
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "rubric_criteria_rubric_id_fkey"
            columns: ["rubric_id"]
            isOneToOne: false
            referencedRelation: "rubrics"
            referencedColumns: ["id"]
          },
        ]
      }
      rubrics: {
        Row: {
          assignment_id: string | null
          created_at: string | null
          id: string
          rubric_json: Json
          title: string
          total_points: number | null
          user_id: string
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string | null
          id?: string
          rubric_json: Json
          title: string
          total_points?: number | null
          user_id: string
        }
        Update: {
          assignment_id?: string | null
          created_at?: string | null
          id?: string
          rubric_json?: Json
          title?: string
          total_points?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rubrics_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rubrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_grades: {
        Row: {
          confidence: number | null
          created_at: string
          criteria: Json
          flags: Json
          id: string
          letter: string | null
          model_id: string | null
          overall_max: number | null
          overall_score: number | null
          rubric_snapshot: Json | null
          schema_version: string
          submission_id: string
          summary_feedback: string | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          criteria?: Json
          flags?: Json
          id?: string
          letter?: string | null
          model_id?: string | null
          overall_max?: number | null
          overall_score?: number | null
          rubric_snapshot?: Json | null
          schema_version: string
          submission_id: string
          summary_feedback?: string | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          criteria?: Json
          flags?: Json
          id?: string
          letter?: string | null
          model_id?: string | null
          overall_max?: number | null
          overall_score?: number | null
          rubric_snapshot?: Json | null
          schema_version?: string
          submission_id?: string
          summary_feedback?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_grades_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          ai_feedback: string | null
          ai_grade: string | null
          ai_score: number | null
          assignment_id: string
          canvas_submission_id: string | null
          created_at: string | null
          essay: string | null
          extracted_text: string | null
          extraction_confidence: number | null
          feedback: string | null
          feedback_json: Json | null
          file_path: string | null
          file_url: string | null
          final_score: number | null
          id: string
          inline_comments: Json | null
          processing_status: string | null
          rubric: string | null
          status: string | null
          student_name: string
          submission_storage_path: string | null
          teacher_final_grade: string | null
          teacher_notes: string | null
        }
        Insert: {
          ai_feedback?: string | null
          ai_grade?: string | null
          ai_score?: number | null
          assignment_id: string
          canvas_submission_id?: string | null
          created_at?: string | null
          essay?: string | null
          extracted_text?: string | null
          extraction_confidence?: number | null
          feedback?: string | null
          feedback_json?: Json | null
          file_path?: string | null
          file_url?: string | null
          final_score?: number | null
          id?: string
          inline_comments?: Json | null
          processing_status?: string | null
          rubric?: string | null
          status?: string | null
          student_name: string
          submission_storage_path?: string | null
          teacher_final_grade?: string | null
          teacher_notes?: string | null
        }
        Update: {
          ai_feedback?: string | null
          ai_grade?: string | null
          ai_score?: number | null
          assignment_id?: string
          canvas_submission_id?: string | null
          created_at?: string | null
          essay?: string | null
          extracted_text?: string | null
          extraction_confidence?: number | null
          feedback?: string | null
          feedback_json?: Json | null
          file_path?: string | null
          file_url?: string | null
          final_score?: number | null
          id?: string
          inline_comments?: Json | null
          processing_status?: string | null
          rubric?: string | null
          status?: string | null
          student_name?: string
          submission_storage_path?: string | null
          teacher_final_grade?: string | null
          teacher_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_comments: {
        Row: {
          comment_text: string
          comment_type: string
          created_at: string
          id: string
          submission_id: string
          text_end: number
          text_start: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment_text: string
          comment_type?: string
          created_at?: string
          id?: string
          submission_id: string
          text_end: number
          text_start: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment_text?: string
          comment_type?: string
          created_at?: string
          id?: string
          submission_id?: string
          text_end?: number
          text_start?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_comments_submission_fk"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_edits: {
        Row: {
          action_type: string
          comment_id: string
          comment_text: string | null
          created_at: string
          id: string
          submission_id: string
          user_id: string
        }
        Insert: {
          action_type: string
          comment_id: string
          comment_text?: string | null
          created_at?: string
          id?: string
          submission_id: string
          user_id: string
        }
        Update: {
          action_type?: string
          comment_id?: string
          comment_text?: string | null
          created_at?: string
          id?: string
          submission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_edits_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_edits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_interest: {
        Row: {
          created_at: string
          email: string
          experience_years: string | null
          full_name: string
          grade_level: string
          id: string
          preferred_tools: string[] | null
          role: string
          school: string | null
          subjects: string | null
          why_joining: string | null
        }
        Insert: {
          created_at?: string
          email: string
          experience_years?: string | null
          full_name: string
          grade_level: string
          id?: string
          preferred_tools?: string[] | null
          role: string
          school?: string | null
          subjects?: string | null
          why_joining?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          experience_years?: string | null
          full_name?: string
          grade_level?: string
          id?: string
          preferred_tools?: string[] | null
          role?: string
          school?: string | null
          subjects?: string | null
          why_joining?: string | null
        }
        Relationships: []
      }
      teacher_profiles: {
        Row: {
          created_at: string
          id: string
          style_profile_json: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          style_profile_json: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          style_profile_json?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_style_profiles: {
        Row: {
          style_json: Json
          style_summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          style_json?: Json
          style_summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          style_json?: Json
          style_summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      training_data: {
        Row: {
          created_at: string | null
          data_type: string
          file_url: string
          id: string
          processed: boolean | null
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data_type: string
          file_url: string
          id?: string
          processed?: boolean | null
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data_type?: string
          file_url?: string
          id?: string
          processed?: boolean | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      training_examples: {
        Row: {
          created_at: string | null
          essay: string
          feedback: string | null
          grade: string | null
          id: string
          is_exemplar: boolean | null
          rubric: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          essay: string
          feedback?: string | null
          grade?: string | null
          id?: string
          is_exemplar?: boolean | null
          rubric: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          essay?: string
          feedback?: string | null
          grade?: string | null
          id?: string
          is_exemplar?: boolean | null
          rubric?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_examples_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          gender: string | null
          guided_tour_completed: boolean | null
          id: string
          last_reset_date: string | null
          name: string | null
          onboarding_complete: boolean | null
          plan: string | null
          role: string | null
          school: string | null
          weekly_feedback_count: number | null
          why_joining: string | null
          years_experience: number | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          gender?: string | null
          guided_tour_completed?: boolean | null
          id: string
          last_reset_date?: string | null
          name?: string | null
          onboarding_complete?: boolean | null
          plan?: string | null
          role?: string | null
          school?: string | null
          weekly_feedback_count?: number | null
          why_joining?: string | null
          years_experience?: number | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          gender?: string | null
          guided_tour_completed?: boolean | null
          id?: string
          last_reset_date?: string | null
          name?: string | null
          onboarding_complete?: boolean | null
          plan?: string | null
          role?: string | null
          school?: string | null
          weekly_feedback_count?: number | null
          why_joining?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
