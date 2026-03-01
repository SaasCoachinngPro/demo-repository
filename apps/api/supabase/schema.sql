-- ============================================
-- COACHING INSTITUTE SAAS - COMPLETE DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. INSTITUTES (Multi-tenant)
-- ============================================
CREATE TABLE institutes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  logo_url TEXT,
  subscription_plan VARCHAR(50) DEFAULT 'FREE',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. USERS (All roles)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE, -- links to Supabase Auth
  institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. STUDENTS
-- ============================================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  class VARCHAR(50),
  batch VARCHAR(100),
  roll_number VARCHAR(50),
  parent_phone VARCHAR(20),
  face_encoding BYTEA,
  face_registered BOOLEAN DEFAULT false,
  face_images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. TEACHERS
-- ============================================
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  subjects TEXT[] DEFAULT '{}',
  classes TEXT[] DEFAULT '{}',
  qualification VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. PARENTS
-- ============================================
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  student_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. SUBJECTS, CHAPTERS, TOPICS
-- ============================================
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  chapter_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. QUESTIONS
-- ============================================
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) DEFAULT 'MCQ' CHECK (question_type IN ('MCQ', 'NUMERICAL', 'SUBJECTIVE', 'MULTI_CORRECT')),
  options JSONB DEFAULT '{}',
  correct_answer TEXT,
  explanation TEXT,
  difficulty VARCHAR(20) DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  marks INTEGER DEFAULT 1,
  negative_marks DECIMAL DEFAULT 0,
  time_estimate INTEGER,
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  source VARCHAR(100) DEFAULT 'TEACHER_CREATED' CHECK (source IN ('TEACHER_CREATED', 'AI_GENERATED', 'IMPORTED')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_questions_subject ON questions(subject_id);
CREATE INDEX idx_questions_chapter ON questions(chapter_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty);
CREATE INDEX idx_questions_institute ON questions(institute_id);
CREATE INDEX idx_questions_tags ON questions USING GIN(tags);

-- ============================================
-- 8. TESTS
-- ============================================
CREATE TABLE tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  test_type VARCHAR(50) DEFAULT 'PRACTICE' CHECK (test_type IN ('PRACTICE', 'MOCK', 'CHAPTER', 'FULL')),
  total_marks INTEGER DEFAULT 0,
  duration INTEGER DEFAULT 60,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  instructions JSONB DEFAULT '[]',
  is_published BOOLEAN DEFAULT false,
  proctoring_enabled BOOLEAN DEFAULT false,
  shuffle_questions BOOLEAN DEFAULT false,
  shuffle_options BOOLEAN DEFAULT false,
  max_violations INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE test_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  duration INTEGER,
  marks INTEGER DEFAULT 0,
  section_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE test_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  section_id UUID REFERENCES test_sections(id) ON DELETE SET NULL,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  marks INTEGER DEFAULT 1,
  negative_marks DECIMAL DEFAULT 0,
  question_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 9. TEST ASSIGNMENTS & ATTEMPTS
-- ============================================
CREATE TABLE test_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED')),
  UNIQUE(test_id, student_id)
);

CREATE TABLE test_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  time_taken INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'SUBMITTED', 'AUTO_SUBMITTED')),
  score DECIMAL DEFAULT 0,
  total_marks INTEGER DEFAULT 0,
  percentage DECIMAL DEFAULT 0,
  rank INTEGER,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  unattempted_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE student_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  answer TEXT,
  is_correct BOOLEAN,
  marks_awarded DECIMAL DEFAULT 0,
  time_taken INTEGER DEFAULT 0,
  marked_for_review BOOLEAN DEFAULT false,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(attempt_id, question_id)
);

CREATE INDEX idx_test_attempts_student ON test_attempts(student_id);
CREATE INDEX idx_test_attempts_test ON test_attempts(test_id);

-- ============================================
-- 10. CLASSES & ATTENDANCE
-- ============================================
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  batch VARCHAR(50),
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  schedule JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE class_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'PRESENT' CHECK (status IN ('PRESENT', 'ABSENT', 'LATE')),
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  marked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  method VARCHAR(50) DEFAULT 'MANUAL' CHECK (method IN ('MANUAL', 'FACE_RECOGNITION', 'AUTO')),
  confidence_score DECIMAL,
  image_url TEXT,
  UNIQUE(student_id, class_id, date)
);

CREATE INDEX idx_attendance_student_date ON attendance(student_id, date);

-- ============================================
-- 11. PROCTORING
-- ============================================
CREATE TABLE proctoring_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID REFERENCES test_attempts(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  total_violations INTEGER DEFAULT 0,
  trust_score DECIMAL DEFAULT 100.0,
  snapshots TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES proctoring_sessions(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('TAB_SWITCH', 'FOCUS_LOSS', 'MULTIPLE_FACES', 'NO_FACE', 'SUSPICIOUS_MOVEMENT', 'APP_SWITCH')),
  severity VARCHAR(20) DEFAULT 'LOW' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  snapshot_url TEXT,
  metadata JSONB DEFAULT '{}'
);

-- ============================================
-- 12. NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('ATTENDANCE', 'RESULTS', 'ANNOUNCEMENT', 'TEST_REMINDER', 'LOW_ATTENDANCE')),
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 13. AI & LEARNING
-- ============================================
CREATE TABLE learning_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  concept VARCHAR(200) NOT NULL,
  proficiency VARCHAR(20) DEFAULT 'WEAK' CHECK (proficiency IN ('WEAK', 'MODERATE', 'STRONG')),
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  last_practiced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE generated_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  generated_question JSONB NOT NULL,
  quality_rating INTEGER,
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 14. PAYMENTS & SUBSCRIPTIONS
-- ============================================
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  price DECIMAL NOT NULL,
  duration INTEGER DEFAULT 1,
  features JSONB DEFAULT '{}',
  student_limit INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  razorpay_subscription_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CANCELLED', 'EXPIRED', 'TRIAL')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  institute_id UUID REFERENCES institutes(id) ON DELETE CASCADE,
  razorpay_payment_id VARCHAR(255),
  razorpay_order_id VARCHAR(255),
  amount DECIMAL NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('SUCCESS', 'FAILED', 'PENDING', 'REFUNDED')),
  payment_method VARCHAR(50),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SEED DATA: Default Subscription Plans
-- ============================================
INSERT INTO subscription_plans (name, price, duration, features, student_limit) VALUES
  ('Starter', 2999, 1, '{"question_bank": true, "tests": true, "analytics": false, "face_recognition": false, "proctoring": false, "ai_questions": false}', 100),
  ('Professional', 5999, 1, '{"question_bank": true, "tests": true, "analytics": true, "face_recognition": true, "proctoring": true, "ai_questions": false}', 500),
  ('Enterprise', 9999, 1, '{"question_bank": true, "tests": true, "analytics": true, "face_recognition": true, "proctoring": true, "ai_questions": true}', 2000);

-- ============================================
-- SEED DATA: Default Subjects
-- ============================================
-- (These will be created per-institute, but add common ones)
