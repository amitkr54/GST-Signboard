-- Orders Table for Supabase
-- Run this in your Supabase SQL Editor BEFORE the referral schema

-- Orders table: Stores customer orders with minimal required info
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- User authentication (from Google Sign-In)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Customer contact details (minimal required info)
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    
    -- Signage design data
    company_details JSONB NOT NULL, -- Stores: companyName, address, logoUrl, etc.
    design_config JSONB NOT NULL,   -- Stores: colors, fonts, template, etc.
    
    -- Order details
    material TEXT NOT NULL,         -- flex, vinyl, acrylicBoard, etc.
    amount NUMERIC NOT NULL,        -- Order total in ₹
    
    -- Payment & Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'completed', 'cancelled')),
    payment_id TEXT,                -- Payment gateway transaction ID
    payment_method TEXT,            -- razorpay, phonepay, etc.
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment ON orders(payment_id);

-- Enable Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- 1. Allow anyone to create orders (for guest checkout or new users)
CREATE POLICY "Anyone can create orders"
    ON orders FOR INSERT
    WITH CHECK (true);

-- 2. Allow users to view their own orders
CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

-- 3. Allow users to update their own pending orders
CREATE POLICY "Users can update own pending orders"
    ON orders FOR UPDATE
    USING (auth.uid() = user_id AND status = 'pending')
    WITH CHECK (auth.uid() = user_id);

-- 4. Service role can do anything (for admin operations)
-- Note: This is automatically handled by service_role key

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_orders_updated_at();

-- Optional: Create a view for admin to see all orders with customer info
CREATE OR REPLACE VIEW admin_orders_view AS
SELECT 
    o.id,
    o.customer_name,
    o.customer_email,
    o.customer_phone,
    o.company_details->>'companyName' as company_name,
    o.material,
    o.amount,
    o.status,
    o.payment_id,
    o.created_at,
    o.completed_at,
    u.email as user_google_email
FROM orders o
LEFT JOIN auth.users u ON o.user_id = u.id
ORDER BY o.created_at DESC;
