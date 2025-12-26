-- Update Orders table for Part Payment
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_scheme TEXT DEFAULT 'full' CHECK (payment_scheme IN ('full', 'part')),
ADD COLUMN IF NOT EXISTS paid_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_id TEXT,
ADD COLUMN IF NOT EXISTS merchant_transaction_id TEXT;

-- Index for looking up orders by merchant transaction id
CREATE INDEX IF NOT EXISTS idx_orders_merchant_txn ON orders(merchant_transaction_id);
