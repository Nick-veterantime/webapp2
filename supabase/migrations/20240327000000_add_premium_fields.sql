-- Add premium-related fields to user_data table
ALTER TABLE user_data
ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS subscription_status text,
ADD COLUMN IF NOT EXISTS subscription_period_start timestamp with time zone,
ADD COLUMN IF NOT EXISTS subscription_period_end timestamp with time zone; 