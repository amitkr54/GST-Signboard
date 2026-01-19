-- Create the app_settings table to store global application configurations
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default value for referral scheme (enabled by default)
INSERT INTO public.app_settings (key, value)
VALUES ('referral_scheme_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow all access to app_settings
-- Note: The application logic (server actions) handles the PIN verification for security.
CREATE POLICY "Enable all access for app_settings"
ON public.app_settings
FOR ALL
USING (true)
WITH CHECK (true);

-- Allow authenticated users with admin privileges to update (if you use role-based auth)
-- For now, updates are handled via server actions with a PIN check.
