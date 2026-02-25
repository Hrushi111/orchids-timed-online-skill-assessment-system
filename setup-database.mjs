/**
 * ThorPrep — Supabase Database Setup Script
 * Runs the full schema SQL against your Supabase project.
 * Usage: node setup-database.mjs
 */

import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Read credentials from .env.local ─────────────────────────
const envPath = path.join(__dirname, ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const env = Object.fromEntries(
    envContent
        .split("\n")
        .filter((l) => l.includes("=") && !l.startsWith("#"))
        .map((l) => {
            const [k, ...v] = l.split("=");
            return [k.trim(), v.join("=").trim()];
        })
);

const SUPABASE_URL = env["NEXT_PUBLIC_SUPABASE_URL"];
const SERVICE_ROLE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
}

// Extract project ref from URL
const PROJECT_REF = SUPABASE_URL.replace("https://", "").split(".")[0];
console.log(`\n⚡ ThorPrep Database Setup`);
console.log(`   Project: ${PROJECT_REF}`);
console.log(`   URL:     ${SUPABASE_URL}\n`);

// ── SQL statements to execute (split into batches) ───────────
const statements = [
    // ---------- TABLES ----------
    `CREATE TABLE IF NOT EXISTS profiles (
    id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    role       TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

    `CREATE TABLE IF NOT EXISTS subjects (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             TEXT NOT NULL UNIQUE,
    description      TEXT,
    duration_minutes INT  NOT NULL DEFAULT 30,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

    `CREATE TABLE IF NOT EXISTS topics (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

    `CREATE TABLE IF NOT EXISTS questions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id     UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    topic_id       UUID REFERENCES topics(id) ON DELETE SET NULL,
    question_text  TEXT NOT NULL,
    option_a       TEXT NOT NULL,
    option_b       TEXT NOT NULL,
    option_c       TEXT NOT NULL,
    option_d       TEXT NOT NULL,
    correct_answer TEXT NOT NULL CHECK (correct_answer IN ('a','b','c','d')),
    difficulty     TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

    `CREATE TABLE IF NOT EXISTS test_results (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id         UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    score              INT  NOT NULL,
    total_questions    INT  NOT NULL,
    accuracy           NUMERIC(5,2) NOT NULL,
    time_taken_seconds INT  NOT NULL,
    answers            JSONB NOT NULL DEFAULT '{}',
    weak_topics        TEXT[] NOT NULL DEFAULT '{}',
    topic_performance  JSONB NOT NULL DEFAULT '{}',
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,

    // ---------- RLS ----------
    `ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE subjects     ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE topics       ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE questions    ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE test_results ENABLE ROW LEVEL SECURITY`,

    // Profiles
    `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can view own profile') THEN
      CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
    END IF; END $$`,
    `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can update own profile') THEN
      CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
    END IF; END $$`,
    `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can insert own profile') THEN
      CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF; END $$`,

    // Subjects
    `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subjects' AND policyname='Anyone can view subjects') THEN
      CREATE POLICY "Anyone can view subjects" ON subjects FOR SELECT USING (true);
    END IF; END $$`,
    `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subjects' AND policyname='Admins can manage subjects') THEN
      CREATE POLICY "Admins can manage subjects" ON subjects FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF; END $$`,

    // Topics
    `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='topics' AND policyname='Anyone can view topics') THEN
      CREATE POLICY "Anyone can view topics" ON topics FOR SELECT USING (true);
    END IF; END $$`,
    `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='topics' AND policyname='Admins can manage topics') THEN
      CREATE POLICY "Admins can manage topics" ON topics FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF; END $$`,

    // Questions
    `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='questions' AND policyname='Authenticated users can view questions') THEN
      CREATE POLICY "Authenticated users can view questions" ON questions FOR SELECT USING (auth.role() = 'authenticated');
    END IF; END $$`,
    `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='questions' AND policyname='Authenticated users can insert questions') THEN
      CREATE POLICY "Authenticated users can insert questions" ON questions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF; END $$`,
    `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='questions' AND policyname='Admins can manage questions') THEN
      CREATE POLICY "Admins can manage questions" ON questions FOR ALL
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF; END $$`,

    // Test results
    `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='test_results' AND policyname='Users can view own results') THEN
      CREATE POLICY "Users can view own results" ON test_results FOR SELECT USING (auth.uid() = user_id);
    END IF; END $$`,
    `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='test_results' AND policyname='Users can insert own results') THEN
      CREATE POLICY "Users can insert own results" ON test_results FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF; END $$`,
    `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='test_results' AND policyname='Admins can view all results') THEN
      CREATE POLICY "Admins can view all results" ON test_results FOR SELECT
      USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF; END $$`,

    // ---------- AUTO-PROFILE TRIGGER ----------
    `CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.profiles (id, name, email, role)
     VALUES (
       NEW.id,
       COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
       NEW.email,
       'user'
     ) ON CONFLICT (id) DO NOTHING;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER`,

    `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`,
    `CREATE TRIGGER on_auth_user_created
   AFTER INSERT ON auth.users
   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()`,

    // ---------- SEED SUBJECTS ----------
    `INSERT INTO subjects (name, description, duration_minutes) VALUES
    ('Java',            'Core Java: OOPs, Collections, Multithreading', 30),
    ('SQL',             'Database: Joins, Indexing, Aggregates',         25),
    ('Angular',         'Components, RxJS, Lifecycle, Routing',          30),
    ('Aptitude',        'Quantitative, Logical, Verbal',                 20),
    ('Web Development', 'HTML, CSS, JavaScript, React, APIs',            30),
    ('Python',          'Data Structures, OOP, Algorithms',              30)
   ON CONFLICT (name) DO NOTHING`,

    // ---------- SEED TOPICS ----------
    `INSERT INTO topics (subject_id, name)
   SELECT s.id, t.name FROM subjects s
   CROSS JOIN (VALUES
     ('OOP Concepts'),('Collections Framework'),('Multithreading'),
     ('Exception Handling'),('JVM Internals'),('Design Patterns'),
     ('Java 8+ Features'),('String Handling')
   ) AS t(name)
   WHERE s.name = 'Java'
   ON CONFLICT DO NOTHING`,

    `INSERT INTO topics (subject_id, name)
   SELECT s.id, t.name FROM subjects s
   CROSS JOIN (VALUES
     ('SELECT & Filtering'),('Joins'),('Aggregations'),
     ('Subqueries'),('Indexes'),('Transactions'),
     ('Window Functions'),('Normalization')
   ) AS t(name)
   WHERE s.name = 'SQL'
   ON CONFLICT DO NOTHING`,

    `INSERT INTO topics (subject_id, name)
   SELECT s.id, t.name FROM subjects s
   CROSS JOIN (VALUES
     ('Components'),('Directives'),('Services & DI'),
     ('RxJS & Observables'),('Routing'),('Forms'),
     ('Lifecycle Hooks'),('HTTP Client')
   ) AS t(name)
   WHERE s.name = 'Angular'
   ON CONFLICT DO NOTHING`,

    `INSERT INTO topics (subject_id, name)
   SELECT s.id, t.name FROM subjects s
   CROSS JOIN (VALUES
     ('Data Types & Collections'),('OOP in Python'),('Decorators'),
     ('List Comprehensions'),('File Handling'),('Error Handling'),
     ('Libraries (NumPy/Pandas)'),('Algorithms')
   ) AS t(name)
   WHERE s.name = 'Python'
   ON CONFLICT DO NOTHING`,

    `INSERT INTO topics (subject_id, name)
   SELECT s.id, t.name FROM subjects s
   CROSS JOIN (VALUES
     ('Number Systems'),('Percentages'),('Ratios & Proportions'),
     ('Time & Work'),('Logical Sequences'),('Verbal Reasoning')
   ) AS t(name)
   WHERE s.name = 'Aptitude'
   ON CONFLICT DO NOTHING`,

    `INSERT INTO topics (subject_id, name)
   SELECT s.id, t.name FROM subjects s
   CROSS JOIN (VALUES
     ('HTML5 Semantics'),('CSS & Flexbox'),('JavaScript ES6+'),
     ('React Hooks'),('REST APIs'),('Browser & DOM')
   ) AS t(name)
   WHERE s.name = 'Web Development'
   ON CONFLICT DO NOTHING`,
];

// ── Execute via Supabase Management API ──────────────────────
function runSQL(sql) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ query: sql });
        const options = {
            hostname: "api.supabase.com",
            path: `/v1/projects/${PROJECT_REF}/database/query`,
            method: "POST",
            headers: {
                Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(body),
            },
        };
        const req = https.request(options, (res) => {
            let data = "";
            res.on("data", (c) => (data += c));
            res.on("end", () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ ok: true, status: res.statusCode });
                } else {
                    resolve({ ok: false, status: res.statusCode, body: data });
                }
            });
        });
        req.on("error", reject);
        req.write(body);
        req.end();
    });
}

// ── Main ─────────────────────────────────────────────────────
const labels = [
    "Table: profiles", "Table: subjects", "Table: topics",
    "Table: questions", "Table: test_results",
    "RLS: profiles", "RLS: subjects", "RLS: topics", "RLS: questions", "RLS: test_results",
    "Policy: profile view", "Policy: profile update", "Policy: profile insert",
    "Policy: subject view", "Policy: subject admin",
    "Policy: topic view", "Policy: topic admin",
    "Policy: question view", "Policy: question insert", "Policy: question admin",
    "Policy: result view", "Policy: result insert", "Policy: result admin-view",
    "Trigger function", "Drop old trigger", "Create trigger",
    "Seed: subjects",
    "Seed: Java topics", "Seed: SQL topics", "Seed: Angular topics",
    "Seed: Python topics", "Seed: Aptitude topics", "Seed: WebDev topics",
];

(async () => {
    let ok = 0;
    let fail = 0;

    for (let i = 0; i < statements.length; i++) {
        const label = labels[i] ?? `Statement ${i + 1}`;
        process.stdout.write(`  ⏳  ${label.padEnd(35)}`);
        try {
            const result = await runSQL(statements[i]);
            if (result.ok) {
                console.log("✅");
                ok++;
            } else {
                const msg = JSON.parse(result.body)?.message ?? result.body;
                // Ignore "already exists" errors
                if (msg?.includes("already exists") || msg?.includes("duplicate")) {
                    console.log("⏭  (already exists)");
                    ok++;
                } else {
                    console.log(`❌  [${result.status}] ${msg?.slice(0, 80)}`);
                    fail++;
                }
            }
        } catch (err) {
            console.log(`❌  ${err.message}`);
            fail++;
        }
    }

    console.log(`\n${"─".repeat(55)}`);
    if (fail === 0) {
        console.log(`✅  All done! ${ok} statements executed successfully.`);
        console.log(`\n🚀  Your ThorPrep database is ready. Restart your dev server!`);
    } else {
        console.log(`⚠️   ${ok} succeeded · ${fail} failed`);
        console.log(`\n💡  If Management API failed (401), paste supabase-schema.sql`);
        console.log(`    into: https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`);
    }
})();
