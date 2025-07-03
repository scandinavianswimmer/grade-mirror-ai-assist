export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
          title: string
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          file_type: string
          file_url: string
          id?: string
          title: string
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          file_type?: string
          file_url?: string
          id?: string
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
      privacy_settings: {
        Row: {
          allow_training_on_content: boolean | null
          anonymize_student_names: boolean | null
          auto_delete_training_data: boolean | null
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          allow_training_on_content?: boolean | null
          anonymize_student_names?: boolean | null
          auto_delete_training_data?: boolean | null
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          allow_training_on_content?: boolean | null
          anonymize_student_names?: boolean | null
          auto_delete_training_data?: boolean | null
          created_at?: string | null
          id?: string
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
      rubrics: {
        Row: {
          created_at: string | null
          id: string
          rubric_json: Json
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rubric_json: Json
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rubric_json?: Json
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rubrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          feedback: string | null
          feedback_json: Json | null
          file_url: string | null
          final_score: number | null
          id: string
          inline_comments: Json | null
          processing_status: string | null
          rubric: string | null
          status: string | null
          student_name: string
          submission_storage_path: string | null
        }
        Insert: {
          ai_feedback?: string | null
          ai_grade?: string | null
          ai_score?: number | null
          assignment_id: string
          canvas_submission_id?: string | null
          created_at?: string | null
          essay?: string | null
          feedback?: string | null
          feedback_json?: Json | null
          file_url?: string | null
          final_score?: number | null
          id?: string
          inline_comments?: Json | null
          processing_status?: string | null
          rubric?: string | null
          status?: string | null
          student_name: string
          submission_storage_path?: string | null
        }
        Update: {
          ai_feedback?: string | null
          ai_grade?: string | null
          ai_score?: number | null
          assignment_id?: string
          canvas_submission_id?: string | null
          created_at?: string | null
          essay?: string | null
          feedback?: string | null
          feedback_json?: Json | null
          file_url?: string | null
          final_score?: number | null
          id?: string
          inline_comments?: Json | null
          processing_status?: string | null
          rubric?: string | null
          status?: string | null
          student_name?: string
          submission_storage_path?: string | null
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
      training_data: {
        Row: {
          created_at: string | null
          data_type: string
          file_url: string
          id: string
          processed: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data_type: string
          file_url: string
          id?: string
          processed?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data_type?: string
          file_url?: string
          id?: string
          processed?: boolean | null
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
          rubric: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          essay: string
          feedback?: string | null
          grade?: string | null
          id?: string
          rubric: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          essay?: string
          feedback?: string | null
          grade?: string | null
          id?: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
