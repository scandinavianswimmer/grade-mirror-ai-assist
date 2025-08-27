-- Update the handle_new_user function to create a personal storage bucket
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Insert user profile
    INSERT INTO public.users (id, email, name, role)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', 'teacher');
    
    -- Create default privacy settings
    INSERT INTO public.privacy_settings (user_id, anonymize_student_names, allow_training_on_content, auto_delete_training_data)
    VALUES (NEW.id, TRUE, TRUE, TRUE);
    
    -- Create personal storage bucket for user
    INSERT INTO storage.buckets (id, name, public)
    VALUES (
        'user-' || NEW.id::text,
        'user-' || NEW.id::text,
        false
    );
    
    RETURN NEW;
END;
$$;

-- Create RLS policy for user buckets - users can only access their own bucket
CREATE POLICY "Users can access their own bucket objects" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'user-' || auth.uid()::text);

-- Create policy for inserting into user buckets
CREATE POLICY "Users can upload to their own bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'user-' || auth.uid()::text);