
-- Add class_id column to assignments table to link assignments to classes
ALTER TABLE public.assignments 
ADD COLUMN class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

-- Create an index for better query performance
CREATE INDEX idx_assignments_class_id ON public.assignments(class_id);
