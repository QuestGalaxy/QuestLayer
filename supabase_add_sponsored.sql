-- Add is_sponsored column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_sponsored boolean DEFAULT false;

-- Update RLS policies if necessary (usually not needed for new columns if policy is (true))
-- But good practice to ensure it's queryable.
-- existing policies are "using (true)" so it should be fine.
