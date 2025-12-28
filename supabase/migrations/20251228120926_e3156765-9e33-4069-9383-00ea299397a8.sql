-- Drop existing payment method constraints
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_payment_method_check;
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS valid_payment_method;

-- Add updated constraint that includes 'Overstay Fee'
ALTER TABLE transactions ADD CONSTRAINT valid_payment_method 
CHECK (payment_method = ANY (ARRAY['FASTag'::text, 'Cash'::text, 'UPI'::text, 'Overstay Fee'::text]));