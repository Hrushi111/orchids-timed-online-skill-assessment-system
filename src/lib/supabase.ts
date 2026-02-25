import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Subject = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  created_at: string;
};

export type Topic = {
  id: string;
  subject_id: string;
  name: string;
  created_at: string;
};

export type Question = {
  id: string;
  subject_id: string;
  topic_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  difficulty: "easy" | "medium" | "hard";
  created_at: string;
};

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  created_at: string;
};

export type TestResult = {
  id: string;
  user_id: string;
  subject_id: string;
  score: number;
  total_questions: number;
  accuracy: number;
  time_taken_seconds: number;
  answers: Record<string, string>;
  weak_topics: string[];
  topic_performance: Record<string, { correct: number; total: number }>;
  created_at: string;
};
