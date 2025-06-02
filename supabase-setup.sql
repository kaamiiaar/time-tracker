-- Time Tracker Assistant - Supabase Database Setup
-- Run this SQL in your Supabase dashboard SQL Editor

-- 1. Create the daily_records table
CREATE TABLE IF NOT EXISTS daily_records (
  date TEXT PRIMARY KEY,
  hours REAL DEFAULT 0,
  workout TEXT DEFAULT 'No',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create the time_entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  hours REAL NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('manual', 'stopwatch')),
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
CREATE INDEX IF NOT EXISTS idx_time_entries_created_at ON time_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_records_date ON daily_records(date);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- 5. Create policies (allow all operations for now)
-- Note: In production, you might want to restrict these based on user authentication
DROP POLICY IF EXISTS "Allow all operations" ON daily_records;
CREATE POLICY "Allow all operations" ON daily_records 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations" ON time_entries;
CREATE POLICY "Allow all operations" ON time_entries 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 6. Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create trigger to automatically update the updated_at field
DROP TRIGGER IF EXISTS update_daily_records_updated_at ON daily_records;
CREATE TRIGGER update_daily_records_updated_at 
  BEFORE UPDATE ON daily_records 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Insert some sample data (optional - remove if you don't want sample data)
INSERT INTO daily_records (date, hours, workout) VALUES 
  ('2024-01-15', 8.5, 'Yes'),
  ('2024-01-16', 7.0, 'No'),
  ('2024-01-17', 6.5, 'Yes')
ON CONFLICT (date) DO NOTHING;

INSERT INTO time_entries (date, hours, type, description) VALUES 
  ('2024-01-15', 4.0, 'stopwatch', 'Morning coding session'),
  ('2024-01-15', 2.5, 'manual', 'Afternoon meeting'),
  ('2024-01-15', 2.0, 'stopwatch', 'Evening documentation'),
  ('2024-01-16', 3.5, 'manual', 'Project planning'),
  ('2024-01-16', 3.5, 'stopwatch', 'Development work'),
  ('2024-01-17', 6.5, 'stopwatch', 'Full day coding session')
ON CONFLICT DO NOTHING;

-- Setup complete!
-- Your Time Tracker Assistant database is now ready to use. 