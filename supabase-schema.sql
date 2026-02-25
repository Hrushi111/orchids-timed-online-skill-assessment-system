-- ============================================================
--  ThorPrep — Complete Database Schema
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. PROFILES ─────────────────────────────────────────────
-- Stores user profile data (linked to Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. SUBJECTS ─────────────────────────────────────────────
-- e.g. Java, SQL, Angular, Python, Aptitude, Web Development
CREATE TABLE IF NOT EXISTS subjects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL UNIQUE,
  description       TEXT,
  duration_minutes  INT  NOT NULL DEFAULT 30,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. TOPICS ───────────────────────────────────────────────
-- Sub-topics within a subject, e.g. Java → Collections, Multithreading
CREATE TABLE IF NOT EXISTS topics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id  UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. QUESTIONS ────────────────────────────────────────────
-- MCQ questions with 4 options
CREATE TABLE IF NOT EXISTS questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id      UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  topic_id        UUID REFERENCES topics(id) ON DELETE SET NULL,
  question_text   TEXT NOT NULL,
  option_a        TEXT NOT NULL,
  option_b        TEXT NOT NULL,
  option_c        TEXT NOT NULL,
  option_d        TEXT NOT NULL,
  correct_answer  TEXT NOT NULL CHECK (correct_answer IN ('a', 'b', 'c', 'd')),
  difficulty      TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. TEST RESULTS ─────────────────────────────────────────
-- Stores each user's test attempt result
CREATE TABLE IF NOT EXISTS test_results (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id           UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  score                INT  NOT NULL,
  total_questions      INT  NOT NULL,
  accuracy             NUMERIC(5,2) NOT NULL,
  time_taken_seconds   INT  NOT NULL,
  answers              JSONB NOT NULL DEFAULT '{}',
  weak_topics          TEXT[] NOT NULL DEFAULT '{}',
  topic_performance    JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  ROW LEVEL SECURITY (RLS) — Controls who can read/write
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects      ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics        ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results  ENABLE ROW LEVEL SECURITY;

-- PROFILES: users can only see/edit their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- SUBJECTS: everyone (even unauthenticated) can read subjects
CREATE POLICY "Anyone can view subjects"
  ON subjects FOR SELECT USING (true);

-- Admins only can insert/update/delete subjects
CREATE POLICY "Admins can manage subjects"
  ON subjects FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- TOPICS: everyone can read, admins can manage
CREATE POLICY "Anyone can view topics"
  ON topics FOR SELECT USING (true);

CREATE POLICY "Admins can manage topics"
  ON topics FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- QUESTIONS: authenticated users can read, admins can manage
CREATE POLICY "Authenticated users can view questions"
  ON questions FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage questions"
  ON questions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow authenticated users to also insert questions (for "Dump Questions" feature)
CREATE POLICY "Authenticated users can insert questions"
  ON questions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- TEST RESULTS: users see only their own results
CREATE POLICY "Users can view own results"
  ON test_results FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own results"
  ON test_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can see all results
CREATE POLICY "Admins can view all results"
  ON test_results FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
--  SEED DATA — Starter Subjects & Topics
-- ============================================================

INSERT INTO subjects (name, description, duration_minutes) VALUES
  ('Java',             'Core Java: OOPs, Collections, Multithreading, JVM internals', 30),
  ('SQL',              'Database: Joins, Indexing, Aggregates, Window Functions',       25),
  ('Angular',          'Frontend: Components, RxJS, Lifecycle, Routing, Forms',        30),
  ('Aptitude',         'Quantitative, Logical Reasoning, Verbal Ability',               20),
  ('Web Development',  'HTML, CSS, JavaScript, React, APIs',                            30),
  ('Python',           'Data Structures, OOP, Algorithms, Libraries',                  30)
ON CONFLICT (name) DO NOTHING;

-- Seed topics for Java
INSERT INTO topics (subject_id, name)
SELECT id, unnest(ARRAY[
  'OOP Concepts', 'Collections Framework', 'Multithreading',
  'Exception Handling', 'JVM Internals', 'Design Patterns',
  'Java 8+ Features', 'String Handling'
])
FROM subjects WHERE name = 'Java'
ON CONFLICT DO NOTHING;

-- Seed topics for SQL
INSERT INTO topics (subject_id, name)
SELECT id, unnest(ARRAY[
  'SELECT & Filtering', 'Joins', 'Aggregations',
  'Subqueries', 'Indexes', 'Transactions',
  'Window Functions', 'Normalization'
])
FROM subjects WHERE name = 'SQL'
ON CONFLICT DO NOTHING;

-- Seed topics for Angular
INSERT INTO topics (subject_id, name)
SELECT id, unnest(ARRAY[
  'Components', 'Directives', 'Services & DI',
  'RxJS & Observables', 'Routing', 'Forms',
  'Lifecycle Hooks', 'HTTP Client'
])
FROM subjects WHERE name = 'Angular'
ON CONFLICT DO NOTHING;

-- Seed topics for Python
INSERT INTO topics (subject_id, name)
SELECT id, unnest(ARRAY[
  'Data Types & Collections', 'OOP in Python', 'Decorators',
  'List Comprehensions', 'File Handling', 'Error Handling',
  'Libraries (NumPy/Pandas)', 'Algorithms'
])
FROM subjects WHERE name = 'Python'
ON CONFLICT DO NOTHING;

-- Seed topics for Aptitude
INSERT INTO topics (subject_id, name)
SELECT id, unnest(ARRAY[
  'Number Systems', 'Percentages', 'Ratios & Proportions',
  'Time & Work', 'Logical Sequences', 'Verbal Reasoning'
])
FROM subjects WHERE name = 'Aptitude'
ON CONFLICT DO NOTHING;

-- Seed topics for Web Development
INSERT INTO topics (subject_id, name)
SELECT id, unnest(ARRAY[
  'HTML5 Semantics', 'CSS & Flexbox', 'JavaScript ES6+',
  'React Hooks', 'REST APIs', 'Browser & DOM'
])
FROM subjects WHERE name = 'Web Development'
ON CONFLICT DO NOTHING;

-- ============================================================
--  AUTO-CREATE PROFILE ON SIGNUP
--  (Trigger that runs when a new auth user registers)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
