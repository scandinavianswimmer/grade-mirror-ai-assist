// The checked-in Supabase-generated snapshot predates the additive V2 migrations that the app
// already uses. Keep the generated file untouched and layer the committed migration additions on
// top so client queries are type-checked against the schema the application expects to deploy.
import type { Database as GeneratedDatabase, Json } from './types';

type GeneratedTables = GeneratedDatabase['public']['Tables'];

type ExtendTable<
  Base extends { Row: object; Insert: object; Update: object },
  RowExtra extends object,
  InsertExtra extends object,
  UpdateExtra extends object,
> = Omit<Base, 'Row' | 'Insert' | 'Update'> & {
  Row: Base['Row'] & RowExtra;
  Insert: Base['Insert'] & InsertExtra;
  Update: Base['Update'] & UpdateExtra;
};

type AgentEventsTable = {
  Row: {
    id: string;
    user_id: string;
    submission_id: string | null;
    job_id: string;
    agent: string;
    status: string;
    model_id: string | null;
    latency_ms: number | null;
    input_tokens: number | null;
    output_tokens: number | null;
    detail: Json;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    submission_id?: string | null;
    job_id: string;
    agent: string;
    status?: string;
    model_id?: string | null;
    latency_ms?: number | null;
    input_tokens?: number | null;
    output_tokens?: number | null;
    detail?: Json;
    created_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    submission_id?: string | null;
    job_id?: string;
    agent?: string;
    status?: string;
    model_id?: string | null;
    latency_ms?: number | null;
    input_tokens?: number | null;
    output_tokens?: number | null;
    detail?: Json;
    created_at?: string;
  };
  Relationships: [];
};

type GradingBatchesTable = {
  Row: {
    id: string;
    user_id: string;
    assignment_id: string | null;
    label: string | null;
    seq: number;
    created_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    assignment_id?: string | null;
    label?: string | null;
    seq?: number;
    created_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    assignment_id?: string | null;
    label?: string | null;
    seq?: number;
    created_at?: string;
  };
  Relationships: [];
};

type SubscriptionsTable = {
  Row: {
    user_id: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    plan: string;
    status: string;
    current_period_end: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    user_id: string;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    plan?: string;
    status?: string;
    current_period_end?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    user_id?: string;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    plan?: string;
    status?: string;
    current_period_end?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};

type TrainingExamplesTable = Omit<GeneratedTables['training_examples'], 'Row' | 'Insert' | 'Update'> & {
  Row: Omit<GeneratedTables['training_examples']['Row'], 'rubric'> & {
    rubric: string | null;
    rubric_text: string | null;
    source: 'upload' | 'reinforcement';
  };
  Insert: Omit<GeneratedTables['training_examples']['Insert'], 'rubric'> & {
    rubric?: string | null;
    rubric_text?: string | null;
    source?: 'upload' | 'reinforcement';
  };
  Update: Omit<GeneratedTables['training_examples']['Update'], 'rubric'> & {
    rubric?: string | null;
    rubric_text?: string | null;
    source?: 'upload' | 'reinforcement';
  };
};

type AppTables = Omit<
  GeneratedTables,
  'annotations' | 'privacy_settings' | 'submissions' | 'training_examples'
> & {
  agent_events: AgentEventsTable;
  grading_batches: GradingBatchesTable;
  subscriptions: SubscriptionsTable;
  annotations: ExtendTable<
    GeneratedTables['annotations'],
    { edit_distance: number | null },
    { edit_distance?: number | null },
    { edit_distance?: number | null }
  >;
  privacy_settings: ExtendTable<
    GeneratedTables['privacy_settings'],
    {
      auto_finalize_enabled: boolean;
      auto_finalize_threshold: number;
      deid_prepass: boolean;
      updated_at: string;
    },
    {
      auto_finalize_enabled?: boolean;
      auto_finalize_threshold?: number;
      deid_prepass?: boolean;
      updated_at?: string;
    },
    {
      auto_finalize_enabled?: boolean;
      auto_finalize_threshold?: number;
      deid_prepass?: boolean;
      updated_at?: string;
    }
  >;
  submissions: ExtendTable<
    GeneratedTables['submissions'],
    {
      auto_finalized_at: string | null;
      batch_id: string | null;
      edit_self_rating: number | null;
      finalized_by: 'ai' | 'teacher' | null;
      student_ref: string | null;
      updated_at: string | null;
      user_id: string | null;
    },
    {
      auto_finalized_at?: string | null;
      batch_id?: string | null;
      edit_self_rating?: number | null;
      finalized_by?: 'ai' | 'teacher' | null;
      student_ref?: string | null;
      updated_at?: string | null;
      user_id?: string | null;
    },
    {
      auto_finalized_at?: string | null;
      batch_id?: string | null;
      edit_self_rating?: number | null;
      finalized_by?: 'ai' | 'teacher' | null;
      student_ref?: string | null;
      updated_at?: string | null;
      user_id?: string | null;
    }
  >;
  training_examples: TrainingExamplesTable;
};

export type AppDatabase = Omit<GeneratedDatabase, 'public'> & {
  public: Omit<GeneratedDatabase['public'], 'Tables'> & { Tables: AppTables };
};

export type AppTableRow<Name extends keyof AppTables> = AppTables[Name]['Row'];
export type AppTableInsert<Name extends keyof AppTables> = AppTables[Name]['Insert'];
export type AppTableUpdate<Name extends keyof AppTables> = AppTables[Name]['Update'];
