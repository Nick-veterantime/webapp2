-- Drop existing table if it exists
DROP TABLE IF EXISTS user_data CASCADE;

-- Create user_data table
CREATE TABLE user_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  branch TEXT,
  rank_category TEXT,
  rank TEXT,
  job_code TEXT,
  location_preference TEXT,
  location_type TEXT CHECK (location_type IN ('CONUS', 'OCONUS')),
  location TEXT,
  considering_areas TEXT[],
  location_additional_info TEXT,
  career_goal TEXT,
  education_level TEXT,
  separation_date TIMESTAMP WITH TIME ZONE,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users (id)
    ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON user_data;
DROP POLICY IF EXISTS "Users can insert own data" ON user_data;
DROP POLICY IF EXISTS "Users can update own data" ON user_data;

-- Create policies with proper permissions
CREATE POLICY "Users can view own data" 
ON user_data FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" 
ON user_data FOR INSERT 
WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "Users can update own data" 
ON user_data FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_data TO authenticated;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_user_data_updated_at ON user_data;

-- Create trigger for timestamp
CREATE TRIGGER update_user_data_updated_at
    BEFORE UPDATE ON user_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 