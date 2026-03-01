import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AiService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(
        private configService: ConfigService,
        private supabase: SupabaseService,
    ) {
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        }
    }

    // ==================== QUESTION CLASSIFICATION ====================
    async classifyQuestion(questionText: string) {
        if (!this.model) throw new BadRequestException('Gemini API not configured');

        const prompt = `You are an expert educational content classifier for JEE/NEET exams in India.

Analyze this question and extract:
1. Subject (Physics/Chemistry/Mathematics/Biology)
2. Chapter (e.g., "Mechanics", "Thermodynamics", "Organic Chemistry")
3. Topic (e.g., "Kinematics", "Laws of Motion", "Alkanes")
4. Sub-topic (more specific if possible)
5. Difficulty (EASY/MEDIUM/HARD) based on:
   - Conceptual complexity
   - Number of steps to solve
   - Formula complexity
6. Concepts involved (key concepts/formulas as array)
7. Tags (5-10 keywords as array)
8. Bloom's Taxonomy Level (REMEMBER/UNDERSTAND/APPLY/ANALYZE/EVALUATE/CREATE)

Question: ${questionText}

Return response as JSON only (no markdown, no backticks):
{
  "subject": "",
  "chapter": "",
  "topic": "",
  "subTopic": "",
  "difficulty": "",
  "concepts": [],
  "tags": [],
  "bloomsLevel": ""
}`;

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text();
            // Clean any markdown formatting
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleaned);
        } catch (err) {
            throw new BadRequestException(`AI classification failed: ${err.message}`);
        }
    }

    // ==================== SIMILAR QUESTION GENERATION ====================
    async generateSimilarQuestions(questionId: string) {
        if (!this.model) throw new BadRequestException('Gemini API not configured');

        // Get original question
        const { data: question } = await this.supabase
            .from('questions')
            .select('*')
            .eq('id', questionId)
            .single();

        if (!question) throw new BadRequestException('Question not found');

        const prompt = `You are an expert question generator for JEE/NEET exam preparation in India.

Original Question: ${question.question_text}
Correct Answer: ${question.correct_answer}
Difficulty: ${question.difficulty}
Type: ${question.question_type}

Generate 5 similar questions that:
1. Test the SAME concept/formula
2. Have the SAME difficulty level
3. Use DIFFERENT scenarios/contexts
4. Use DIFFERENT numerical values (if applicable)
5. Are clear and unambiguous

For EACH question, provide:
- Question text (complete, ready to use)
- Options (A, B, C, D) if MCQ
- Correct answer
- Brief solution steps

Return as JSON array (no markdown, no backticks):
[
  {
    "questionText": "",
    "options": {"A": "", "B": "", "C": "", "D": ""},
    "correctAnswer": "",
    "solution": "",
    "difficulty": "${question.difficulty}"
  }
]`;

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text();
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const generated = JSON.parse(cleaned);

            // Store generated questions
            const records = generated.map((g: any) => ({
                source_question_id: questionId,
                generated_question: g,
            }));

            await this.supabase.from('generated_questions').insert(records);

            return generated;
        } catch (err) {
            throw new BadRequestException(`AI generation failed: ${err.message}`);
        }
    }

    // ==================== ADAPTIVE LEARNING ====================
    async getPracticeQuestions(studentId: string) {
        // Get student's weak concepts
        const { data: weakConcepts } = await this.supabase
            .from('learning_paths')
            .select('*')
            .eq('student_id', studentId)
            .eq('proficiency', 'WEAK')
            .order('last_practiced_at', { ascending: true, nullsFirst: true })
            .limit(5);

        if (!weakConcepts || weakConcepts.length === 0) {
            // Return random practice questions
            const { data: questions } = await this.supabase
                .from('questions')
                .select('*')
                .eq('is_deleted', false)
                .limit(10);
            return { questions, weakConcepts: [] };
        }

        // Get questions related to weak concepts
        const tags = weakConcepts.map((c) => c.concept);
        const { data: questions } = await this.supabase
            .from('questions')
            .select('*')
            .eq('is_deleted', false)
            .overlaps('tags', tags)
            .limit(10);

        return { questions, weakConcepts };
    }

    async submitPracticeAnswer(studentId: string, questionId: string, answer: string) {
        // Get question
        const { data: question } = await this.supabase
            .from('questions')
            .select('*')
            .eq('id', questionId)
            .single();

        if (!question) throw new BadRequestException('Question not found');

        const isCorrect = answer.trim().toUpperCase() === question.correct_answer?.trim().toUpperCase();

        // Update learning path
        const concept = question.tags?.[0] || 'General';
        const { data: existing } = await this.supabase
            .from('learning_paths')
            .select('*')
            .eq('student_id', studentId)
            .eq('concept', concept)
            .single();

        if (existing) {
            const newAttempted = existing.questions_attempted + 1;
            const newCorrect = existing.questions_correct + (isCorrect ? 1 : 0);
            const accuracy = newCorrect / newAttempted;
            const proficiency = accuracy >= 0.8 ? 'STRONG' : accuracy >= 0.5 ? 'MODERATE' : 'WEAK';

            await this.supabase
                .from('learning_paths')
                .update({
                    questions_attempted: newAttempted,
                    questions_correct: newCorrect,
                    proficiency,
                    last_practiced_at: new Date().toISOString(),
                })
                .eq('id', existing.id);
        } else {
            await this.supabase.from('learning_paths').insert({
                student_id: studentId,
                concept,
                questions_attempted: 1,
                questions_correct: isCorrect ? 1 : 0,
                proficiency: isCorrect ? 'MODERATE' : 'WEAK',
                last_practiced_at: new Date().toISOString(),
            });
        }

        return {
            isCorrect,
            correctAnswer: question.correct_answer,
            explanation: question.explanation,
            concept,
        };
    }

    async getStudentProgress(studentId: string) {
        const { data } = await this.supabase
            .from('learning_paths')
            .select('*')
            .eq('student_id', studentId)
            .order('proficiency');

        const weak = data?.filter((d) => d.proficiency === 'WEAK') || [];
        const moderate = data?.filter((d) => d.proficiency === 'MODERATE') || [];
        const strong = data?.filter((d) => d.proficiency === 'STRONG') || [];

        return { weak, moderate, strong, all: data };
    }

    // ==================== OCR TEXT CLEANING ====================
    async cleanOcrText(ocrText: string) {
        if (!this.model) throw new BadRequestException('Gemini API not configured');

        const prompt = `You are an expert at cleaning OCR-extracted text from question papers.

The following text was extracted from a question paper using OCR.
It may contain errors like:
- Misspelled words
- Missing punctuation
- Incorrect mathematical symbols
- Formatting issues

Clean and correct the text:
- Fix spelling errors
- Add proper punctuation
- Convert mathematical expressions to LaTeX where needed
- Maintain question numbering
- Preserve the structure (question numbers, option labels)

OCR Text:
${ocrText}

Return the corrected text only (no explanations, no markdown blocks):`;

        try {
            const result = await this.model.generateContent(prompt);
            return { cleanedText: result.response.text() };
        } catch (err) {
            throw new BadRequestException(`OCR cleaning failed: ${err.message}`);
        }
    }
}
