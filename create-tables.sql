-- Daily records table
CREATE TABLE daily_records (
  date TEXT PRIMARY KEY,
  hours REAL DEFAULT 0,
  workout TEXT DEFAULT 'No',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time entries table  
CREATE TABLE time_entries (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  hours REAL NOT NULL,
  type TEXT NOT NULL, -- 'manual' or 'stopwatch'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now - you may want to restrict this)
CREATE POLICY "Allow all operations" ON daily_records FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON time_entries FOR ALL USING (true); 