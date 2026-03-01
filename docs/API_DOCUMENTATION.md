# 🔌 API Documentation — Coaching Pro

> **Base URL:** `http://localhost:3001/api`
> **Auth:** JWT Bearer Token via `Authorization: Bearer <token>` header
> **Last Updated:** 1 March 2026

---

## Standard Response Format

All endpoints return a consistent JSON format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Human-readable message",
  "timestamp": "2026-03-01T10:00:00.000Z"
}
```

**Paginated Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  },
  "message": "Success"
}
```

**Error Response:**
```json
{
  "message": "Error description",
  "error": "Unauthorized",
  "statusCode": 401
}
```

---

## Authentication

### Register
```
POST /auth/register
```
**Access:** Public
**Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Full name |
| `email` | string | ✅ | Email address |
| `password` | string | ✅ | Min 6 characters |
| `role` | string | ✅ | `ADMIN`, `TEACHER`, `STUDENT`, `PARENT` |
| `phone` | string | ❌ | Phone number |
| `class` | string | ❌ | Student's class |
| `batch` | string | ❌ | Student's batch |
| `parentPhone` | string | ❌ | Parent phone (students) |
| `subjects` | string[] | ❌ | Teaching subjects (teachers) |
| `classes` | string[] | ❌ | Teaching classes (teachers) |
| `qualification` | string | ❌ | Qualification (teachers) |
| `studentIds` | string[] | ❌ | Linked student IDs (parents) |

**Response:** `{ user, session: { access_token } }`

---

### Login
```
POST /auth/login
```
**Access:** Public
**Body:**
| Field | Type | Required |
|-------|------|----------|
| `email` | string | ✅ |
| `password` | string | ✅ |

**Response:** `{ user, session: { access_token } }`

---

### Get Current User
```
GET /auth/me
```
**Access:** 🔒 Authenticated
**Response:** `{ id, email, name, role, institute_id, profile }`

---

### Update Profile
```
PATCH /auth/profile
```
**Access:** 🔒 Authenticated
**Body:**
| Field | Type | Required |
|-------|------|----------|
| `name` | string | ❌ |
| `phone` | string | ❌ |
| `avatar_url` | string | ❌ |

---

## Question Bank

### List Questions (Paginated)
```
GET /questions
```
**Access:** 🔒 Authenticated
**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `search` | string | - | Search question text |
| `subjectId` | uuid | - | Filter by subject |
| `chapterId` | uuid | - | Filter by chapter |
| `topicId` | uuid | - | Filter by topic |
| `difficulty` | string | - | `EASY`, `MEDIUM`, `HARD` |
| `questionType` | string | - | `MCQ`, `NUMERICAL`, `SUBJECTIVE`, `MULTI_CORRECT` |
| `tags` | string[] | - | Filter by tags |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page |
| `sortBy` | string | `created_at` | Sort column |
| `sortOrder` | string | `desc` | `asc` or `desc` |

**Response:** Paginated array of question objects with joined `subjects`, `chapters`, `topics`, `users` data.

---

### Get Single Question
```
GET /questions/:id
```
**Access:** 🔒 Authenticated

---

### Create Question
```
POST /questions
```
**Access:** 🔒 ADMIN, TEACHER
**Body:**
| Field | Type | Required | Default |
|-------|------|----------|---------|
| `questionText` | string | ✅ | - |
| `questionType` | string | ❌ | `MCQ` |
| `options` | object | ❌ | - |
| `correctAnswer` | string | ❌ | - |
| `explanation` | string | ❌ | - |
| `difficulty` | string | ❌ | `MEDIUM` |
| `marks` | number | ❌ | `1` |
| `negativeMarks` | number | ❌ | `0` |
| `timeEstimate` | number | ❌ | - |
| `imageUrl` | string | ❌ | - |
| `tags` | string[] | ❌ | - |
| `subjectId` | uuid | ❌ | - |
| `chapterId` | uuid | ❌ | - |
| `topicId` | uuid | ❌ | - |

**Options format:** `{ "A": "Option text", "B": "Option text", "C": "...", "D": "..." }`

---

### Update Question
```
PATCH /questions/:id
```
**Access:** 🔒 ADMIN, TEACHER
**Body:** Same fields as Create (all optional)

---

### Delete Question (Soft Delete)
```
DELETE /questions/:id
```
**Access:** 🔒 ADMIN, TEACHER

---

### Bulk Create Questions
```
POST /questions/bulk
```
**Access:** 🔒 ADMIN, TEACHER
**Body:**
```json
{
  "questions": [ { ...CreateQuestionDto }, ... ]
}
```

---

### Import from CSV/Excel
```
POST /questions/import
```
**Access:** 🔒 ADMIN, TEACHER
**Content-Type:** `multipart/form-data`
| Field | Type | Description |
|-------|------|-------------|
| `file` | File | `.csv` or `.xlsx` file |

**Expected columns:** `questionText`, `questionType`, `optionA`, `optionB`, `optionC`, `optionD`, `correctAnswer`, `difficulty`, `marks`, `negativeMarks`

---

### AI-Powered Question Extraction
```
POST /questions/import/ai
```
**Access:** 🔒 ADMIN, TEACHER
**Content-Type:** `multipart/form-data`
| Field | Type | Description |
|-------|------|-------------|
| `file` | File | PDF, DOCX, or image file |

**Response:** Array of extracted question objects (not saved yet — review before bulk save).
**AI Model:** Google Gemini 2.0 Flash
**Requires:** `GEMINI_API_KEY` environment variable

---

### Get Subjects
```
GET /questions/subjects
```
**Access:** 🔒 Authenticated

---

### Create Subject
```
POST /questions/subjects
```
**Access:** 🔒 ADMIN, TEACHER
**Body:** `{ name: string, code: string }`

---

### Create Chapter
```
POST /questions/chapters
```
**Access:** 🔒 ADMIN, TEACHER
**Body:** `{ name: string, subjectId: string, order?: number }`

---

### Create Topic
```
POST /questions/topics
```
**Access:** 🔒 ADMIN, TEACHER
**Body:** `{ name: string, chapterId: string }`

---

## Tests & Assessments

### Create Test
```
POST /tests
```
**Access:** 🔒 ADMIN, TEACHER
**Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | Test name |
| `description` | string | ❌ | Description |
| `test_type` | string | ❌ | `MOCK_EXAM`, `CHAPTER_TEST`, `PRACTICE`, `ASSIGNMENT` |
| `duration` | number | ❌ | Duration in minutes |
| `total_marks` | number | ❌ | Total marks |
| `passing_marks` | number | ❌ | Pass mark |
| `settings` | object | ❌ | `{ shuffle, showResults, allowReview }` |

---

### List Tests (Paginated)
```
GET /tests
```
**Access:** 🔒 Authenticated

---

### Get Test Details
```
GET /tests/:id
```
**Access:** 🔒 Authenticated
**Response:** Full test with sections and questions joined.

---

### Update Test
```
PATCH /tests/:id
```
**Access:** 🔒 ADMIN, TEACHER

---

### Delete Test
```
DELETE /tests/:id
```
**Access:** 🔒 ADMIN, TEACHER

---

### Publish Test
```
POST /tests/:id/publish
```
**Access:** 🔒 ADMIN, TEACHER
Sets `is_published = true`, making it visible to students.

---

### Add Section to Test
```
POST /tests/:id/sections
```
**Access:** 🔒 ADMIN, TEACHER
**Body:** `{ name: string, order?: number }`

---

### Get Test Sections
```
GET /tests/:id/sections
```
**Access:** 🔒 Authenticated

---

### Add Questions to Test
```
POST /tests/:id/questions
```
**Access:** 🔒 ADMIN, TEACHER
**Body:**
```json
{
  "questions": [
    { "questionId": "uuid", "sectionId": "uuid", "marks": 4, "negativeMarks": 1, "order": 1 }
  ]
}
```

---

### Remove Question from Test
```
DELETE /tests/:testId/questions/:questionId
```
**Access:** 🔒 ADMIN, TEACHER

---

### Assign Students to Test
```
POST /tests/:id/assign
```
**Access:** 🔒 ADMIN, TEACHER
**Body:** `{ studentIds: ["uuid1", "uuid2", ...] }`

---

### Get Assigned Students
```
GET /tests/:id/assigned-students
```
**Access:** 🔒 Authenticated

---

### Get My Tests (Student)
```
GET /tests/student/my-tests
```
**Access:** 🔒 Authenticated
Returns tests assigned to the current student.

---

### Start Test Attempt
```
POST /tests/:id/start
```
**Access:** 🔒 Authenticated
Creates a `test_attempts` record with `status: 'IN_PROGRESS'`.
**Response:** `{ attemptId, questions, timeLeft }`

---

### Save Answer
```
POST /tests/attempts/:attemptId/answer
```
**Access:** 🔒 Authenticated
**Body:**
| Field | Type | Required |
|-------|------|----------|
| `questionId` | uuid | ✅ |
| `answer` | string | ✅ |
| `timeTaken` | number | ❌ |
| `markedForReview` | boolean | ❌ |

---

### Submit Test
```
POST /tests/attempts/:attemptId/submit
```
**Access:** 🔒 Authenticated
Grades all answers, calculates score/rank, and locks the attempt.

---

### Get Results
```
GET /tests/attempts/:attemptId/results
```
**Access:** 🔒 Authenticated
**Response:** `{ score, percentage, rank, correct, incorrect, unattempted, answers: [...] }`

---

### Get Test Analytics
```
GET /tests/:id/analytics
```
**Access:** 🔒 ADMIN, TEACHER
**Response:** Aggregate analytics — avg score, score distribution, question-wise analysis, top performers.

---

## Attendance

### Create Class
```
POST /attendance/classes
```
**Access:** 🔒 ADMIN, TEACHER
**Body:** `{ name: string }`

---

### List Classes
```
GET /attendance/classes
```
**Access:** 🔒 Authenticated

---

### Add Students to Class
```
POST /attendance/classes/:classId/students
```
**Access:** 🔒 ADMIN, TEACHER
**Body:** `{ studentIds: ["uuid1", "uuid2"] }`

---

### Get Class Students
```
GET /attendance/classes/:classId/students
```
**Access:** 🔒 Authenticated

---

### Mark Attendance (Single)
```
POST /attendance/mark
```
**Access:** 🔒 ADMIN, TEACHER
**Body:** `{ studentId, classId, date, status }`
**Status values:** `PRESENT`, `ABSENT`, `LATE`

---

### Mark Bulk Attendance
```
POST /attendance/mark-bulk
```
**Access:** 🔒 ADMIN, TEACHER
**Body:**
```json
{
  "classId": "uuid",
  "date": "2026-03-01",
  "records": [
    { "studentId": "uuid", "status": "PRESENT" },
    { "studentId": "uuid", "status": "ABSENT" }
  ]
}
```

---

### Face Recognition Batch Attendance
```
POST /attendance/face-recognition-batch
```
**Access:** 🔒 ADMIN, TEACHER
**Body:**
```json
{
  "classId": "uuid",
  "date": "2026-03-01",
  "records": [
    { "studentId": "uuid", "confidence": 0.95 }
  ]
}
```

---

### Get Class Attendance by Date
```
GET /attendance/class/:classId/date/:date
```
**Access:** 🔒 Authenticated
**Example:** `GET /attendance/class/abc-123/date/2026-03-01`

---

### Get Student Attendance History
```
GET /attendance/student/:studentId
```
**Access:** 🔒 Authenticated
**Query:** `?startDate=2026-01-01&endDate=2026-03-01`

---

### Student Attendance Report
```
GET /attendance/report/student/:studentId
```
**Access:** 🔒 Authenticated
**Response:** `{ totalDays, present, absent, late, attendancePercentage }`

---

### Class Attendance Report
```
GET /attendance/report/class/:classId
```
**Access:** 🔒 ADMIN, TEACHER

---

### Register Face
```
POST /attendance/face/register/:studentId
```
**Access:** 🔒 Authenticated
**Body:** `{ faceImages: ["base64string1", "base64string2"] }`

---

### Get Face Registration Status
```
GET /attendance/face/status/:studentId
```
**Access:** 🔒 Authenticated

---

## Analytics

### Institute Dashboard
```
GET /analytics/dashboard
```
**Access:** 🔒 ADMIN
**Response:**
```json
{
  "studentCount": 150,
  "teacherCount": 12,
  "testCount": 45,
  "questionCount": 1200,
  "recentTests": [ ... ]
}
```

---

### Student Performance
```
GET /analytics/student/:studentId
```
**Access:** 🔒 Authenticated

---

### Student Comparison
```
GET /analytics/compare
```
**Access:** 🔒 Authenticated
**Query:** `?studentIds=uuid1,uuid2,uuid3`

---

## AI Services

### Classify Question
```
POST /ai/classify-question
```
**Access:** 🔒 ADMIN, TEACHER
**Body:** `{ questionText: "..." }`
**Response:** `{ difficulty, tags, subject, topic }`

---

### Generate Similar Questions
```
POST /ai/generate-similar/:questionId
```
**Access:** 🔒 ADMIN, TEACHER
Generates 5 similar questions using AI.

---

### Get Practice Questions (Adaptive)
```
GET /ai/practice-questions
```
**Access:** 🔒 Authenticated
Returns AI-curated practice questions based on the student's weak areas.

---

### Submit Practice Answer
```
POST /ai/practice-answer
```
**Access:** 🔒 Authenticated
**Body:** `{ questionId: "uuid", answer: "C" }`
**Response:** `{ isCorrect, explanation }`

---

### Get Student Progress
```
GET /ai/student-progress
```
**Access:** 🔒 Authenticated
Returns topic-wise mastery and improvement areas.

---

### Clean OCR Text
```
POST /ai/clean-ocr-text
```
**Access:** 🔒 ADMIN, TEACHER
**Body:** `{ ocrText: "messy OCR output..." }`
Uses AI to fix OCR artifacts and format text properly.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key |
| `JWT_SECRET` | ✅ | JWT signing secret |
| `GEMINI_API_KEY` | ❌ | Google Gemini API (for AI features) |
| `ANTHROPIC_API_KEY` | ❌ | Anthropic Claude API (fallback) |

---

## Error Codes

| Status | Meaning |
|--------|---------|
| `200` | Success |
| `400` | Bad Request — Invalid input or validation error |
| `401` | Unauthorized — Missing or invalid JWT token |
| `403` | Forbidden — Insufficient role permissions |
| `404` | Not Found |
| `500` | Internal Server Error |
