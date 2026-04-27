-- DYATRA OPS DASHBOARD - SUPABASE SCHEMA SETUP

-- 1. Create Tables

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT,
  description TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'ongoing', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  time TEXT NOT NULL,
  speaker TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations Table
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  capacity TEXT,
  contact TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LED Details Table
CREATE TABLE IF NOT EXISTS led_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  dimensions TEXT,
  resolution TEXT,
  operator TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Checklist/Planning Table
CREATE TABLE IF NOT EXISTS checklist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
  assigned_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media Table
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('music', 'video')),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  duration TEXT,
  artist TEXT,
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rentals Table
CREATE TABLE IF NOT EXISTS rentals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item TEXT NOT NULL,
  vendor TEXT NOT NULL,
  cost TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guidance Table
CREATE TABLE IF NOT EXISTS guidance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add Dummy Data

INSERT INTO events (name, date, location, description, status) VALUES
('Monsoon Music Festival', '2026-06-15', 'Mumbai, MMRDA Grounds', 'Annual music festival featuring international artists.', 'planned'),
('Tech Summit 2026', '2026-08-20', 'Bangalore, BIEC', 'Premier technology conference for developers and innovators.', 'planned');

INSERT INTO sessions (name, time, speaker, status) VALUES
('Opening Keynote', '10:00 AM', 'Dr. Arpit Sharma', 'scheduled'),
('AV Infrastructure Workshop', '02:00 PM', 'Sarah Jenkins', 'scheduled');

INSERT INTO locations (name, address, capacity, contact) VALUES
('Main Arena', 'Gate 4, MMRDA Grounds', '50,000', 'John Doe (+91 98765 43210)'),
('VIP Lounge', 'Level 2, West Wing', '500', 'Jane Smith (+91 98765 43211)');

INSERT INTO led_details (type, dimensions, resolution, operator) VALUES
('P1.9 Indoor LED', '12m x 4m', '6144 x 2048', 'Rahul Kumar'),
('P3.9 Outdoor LED', '20m x 10m', '5120 x 2560', 'Suresh Singh');

INSERT INTO checklist (task, category, status, assigned_to) VALUES
('Audio Rigging', 'Audio', 'pending', 'Team Alpha'),
('LED Calibration', 'Visuals', 'in-progress', 'Rahul Kumar');

INSERT INTO media (type, title, url, duration, artist) VALUES
('music', 'Festival Anthem', 'https://example.com/anthem.mp3', '04:20', 'The Dyatras'),
('video', 'Opening Visuals', 'https://example.com/visuals.mp4', '02:00', NULL);

INSERT INTO rentals (item, vendor, cost, status) VALUES
('50k Projector', 'AV Rentals Inc.', '₹50,000/day', 'active'),
('Line Array System', 'Sound Masters', '₹1,20,000/event', 'active');

INSERT INTO guidance (title, content, category) VALUES
('Safety Protocol', 'All crew must wear high-vis vests during load-in.', 'Safety'),
('Network Setup', 'SSID: Dyatra_Ops | Pass: AV_Master_2026', 'Technical');
