-- Referral System Tables for Supabase
-- Run this in your Supabase SQL Editor

-- Table: referrers
-- Stores information about people who sign up to refer others
CREATE TABLE IF NOT EXISTS referrers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referral_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    total_earnings NUMERIC DEFAULT 0,
    pending_earnings NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: referrals
-- Tracks each referral (links orders to referrers)
CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES referrers(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    commission_amount NUMERIC NOT NULL DEFAULT 150,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_referrers_code ON referrers(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_order ON referrals(order_id);

-- Enable Row Level Security (RLS)
ALTER TABLE referrers ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Referrers: Allow anyone to insert (sign up)
CREATE POLICY "Anyone can create referrer account"
    ON referrers FOR INSERT
    WITH CHECK (true);

-- Referrers: Allow anyone to read (for dashboard lookup)
CREATE POLICY "Anyone can view referrers"
    ON referrers FOR SELECT
    USING (true);

-- Referrals: Allow service role to insert (backend only)
CREATE POLICY "Service can create referrals"
    ON referrals FOR INSERT
    WITH CHECK (true);

-- Referrals: Allow anyone to read (for dashboard)
CREATE POLICY "Anyone can view referrals"
    ON referrals FOR SELECT
    USING (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to referrers
CREATE TRIGGER update_referrers_updated_at
    BEFORE UPDATE ON referrers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to referrals
CREATE TRIGGER update_referrals_updated_at
    BEFORE UPDATE ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Note: Make sure your 'orders' table exists before running this
-- If not, you'll need to create it first or remove the foreign key constraint
