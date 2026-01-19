-- Create user_designs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_designs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    data JSONB NOT NULL,
    design JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_designs ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Create policies (Updated for Anon Server Actions)
DROP POLICY IF EXISTS "Users can view their own design" ON public.user_designs;
DROP POLICY IF EXISTS "Users can insert their own design" ON public.user_designs;
DROP POLICY IF EXISTS "Users can update their own design" ON public.user_designs;

CREATE POLICY "Enable all access for now"
    ON public.user_designs
    FOR ALL
    USING (true)
    WITH CHECK (true);
