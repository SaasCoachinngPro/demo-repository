import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class TestsService {
    constructor(private supabase: SupabaseService) { }

    // ==================== TEST CRUD ====================
    async createTest(dto: any, userId: string, instituteId: string) {
        const { data, error } = await this.supabase
            .from('tests')
            .insert({
                institute_id: instituteId,
                created_by: userId,
                title: dto.title,
                description: dto.description,
                test_type: dto.testType || 'PRACTICE',
                duration: dto.duration || 60,
                start_time: dto.startTime,
                end_time: dto.endTime,
                instructions: dto.instructions || [],
                proctoring_enabled: dto.proctoringEnabled || false,
                shuffle_questions: dto.shuffleQuestions || false,
                shuffle_options: dto.shuffleOptions || false,
                max_violations: dto.maxViolations || 3,
            })
            .select()
            .single();
        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async listTests(instituteId: string, filters: any = {}) {
        let query = this.supabase
            .from('tests')
            .select('*, users!created_by(name)', { count: 'exact' })
            .eq('institute_id', instituteId)
            .order('created_at', { ascending: false });

        if (filters.testType) query = query.eq('test_type', filters.testType);
        if (filters.isPublished !== undefined) query = query.eq('is_published', filters.isPublished);

        const page = filters.page || 1;
        const limit = filters.limit || 20;
        query = query.range((page - 1) * limit, page * limit - 1);

        const { data, error, count } = await query;
        if (error) throw new BadRequestException(error.message);
        return { data, total: count || 0, page, limit };
    }

    async getTest(id: string) {
        const { data, error } = await this.supabase
            .from('tests')
            .select('*, test_sections(*, test_questions(*, questions(*))), users!created_by(name)')
            .eq('id', id)
            .single();
        if (error || !data) throw new NotFoundException('Test not found');
        return data;
    }

    async updateTest(id: string, dto: any) {
        const updateData: any = { updated_at: new Date().toISOString() };
        if (dto.title) updateData.title = dto.title;
        if (dto.description !== undefined) updateData.description = dto.description;
        if (dto.testType) updateData.test_type = dto.testType;
        if (dto.duration) updateData.duration = dto.duration;
        if (dto.startTime) updateData.start_time = dto.startTime;
        if (dto.endTime) updateData.end_time = dto.endTime;
        if (dto.instructions) updateData.instructions = dto.instructions;
        if (dto.proctoringEnabled !== undefined) updateData.proctoring_enabled = dto.proctoringEnabled;
        if (dto.shuffleQuestions !== undefined) updateData.shuffle_questions = dto.shuffleQuestions;
        if (dto.shuffleOptions !== undefined) updateData.shuffle_options = dto.shuffleOptions;

        const { data, error } = await this.supabase.from('tests').update(updateData).eq('id', id).select().single();
        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async deleteTest(id: string) {
        const { error } = await this.supabase.from('tests').delete().eq('id', id);
        if (error) throw new BadRequestException(error.message);
        return { deleted: true };
    }

    async publishTest(id: string) {
        // Calculate total marks from test questions
        const { data: testQuestions } = await this.supabase
            .from('test_questions')
            .select('marks')
            .eq('test_id', id);

        const totalMarks = testQuestions?.reduce((sum, q) => sum + (q.marks || 0), 0) || 0;

        const { data, error } = await this.supabase
            .from('tests')
            .update({ is_published: true, total_marks: totalMarks, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error) throw new BadRequestException(error.message);
        return data;
    }

    // ==================== SECTIONS ====================
    async addSection(testId: string, dto: { name: string; duration?: number; marks?: number; order?: number }) {
        const { data, error } = await this.supabase
            .from('test_sections')
            .insert({ test_id: testId, name: dto.name, duration: dto.duration, marks: dto.marks, section_order: dto.order || 0 })
            .select()
            .single();
        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async getSections(testId: string) {
        const { data } = await this.supabase
            .from('test_sections')
            .select('*, test_questions(*, questions(*))')
            .eq('test_id', testId)
            .order('section_order');
        return data;
    }

    // ==================== TEST QUESTIONS ====================
    async addQuestions(testId: string, questions: { questionId: string; sectionId?: string; marks?: number; negativeMarks?: number; order?: number }[]) {
        const records = questions.map((q, i) => ({
            test_id: testId,
            section_id: q.sectionId,
            question_id: q.questionId,
            marks: q.marks || 1,
            negative_marks: q.negativeMarks || 0,
            question_order: q.order || i + 1,
        }));

        const { data, error } = await this.supabase.from('test_questions').insert(records).select();
        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async removeQuestion(testId: string, questionId: string) {
        const { error } = await this.supabase
            .from('test_questions')
            .delete()
            .eq('test_id', testId)
            .eq('question_id', questionId);
        if (error) throw new BadRequestException(error.message);
        return { removed: true };
    }

    // ==================== STUDENT ASSIGNMENT ====================
    async assignStudents(testId: string, studentIds: string[]) {
        const records = studentIds.map((sid) => ({ test_id: testId, student_id: sid }));
        const { data, error } = await this.supabase.from('test_assignments').upsert(records, { onConflict: 'test_id,student_id' }).select();
        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async getAssignedStudents(testId: string) {
        const { data } = await this.supabase
            .from('test_assignments')
            .select('*, users!student_id(name, email)')
            .eq('test_id', testId);
        return data;
    }

    async getStudentTests(studentId: string) {
        const { data } = await this.supabase
            .from('test_assignments')
            .select('*, tests(*)')
            .eq('student_id', studentId)
            .order('assigned_at', { ascending: false });
        return data;
    }

    // ==================== TEST ATTEMPTS ====================
    async startAttempt(testId: string, studentId: string) {
        // Check if test is published
        const { data: test } = await this.supabase.from('tests').select('*').eq('id', testId).single();
        if (!test) throw new NotFoundException('Test not found');
        if (!test.is_published) throw new ForbiddenException('Test is not published yet');

        // Check if student is assigned
        const { data: assignment } = await this.supabase
            .from('test_assignments')
            .select('*')
            .eq('test_id', testId)
            .eq('student_id', studentId)
            .single();
        if (!assignment) throw new ForbiddenException('You are not assigned to this test');

        // Check for existing attempt
        const { data: existing } = await this.supabase
            .from('test_attempts')
            .select('*')
            .eq('test_id', testId)
            .eq('student_id', studentId)
            .eq('status', 'IN_PROGRESS')
            .single();

        if (existing) return existing; // Resume existing attempt

        // Get test questions
        const { data: testQuestions } = await this.supabase
            .from('test_questions')
            .select('*, questions(*)')
            .eq('test_id', testId)
            .order('question_order');

        // Create new attempt
        const { data: attempt, error } = await this.supabase
            .from('test_attempts')
            .insert({
                test_id: testId,
                student_id: studentId,
                total_marks: test.total_marks,
                unattempted_count: testQuestions?.length || 0,
            })
            .select()
            .single();
        if (error) throw new BadRequestException(error.message);

        // Update assignment status
        await this.supabase
            .from('test_assignments')
            .update({ status: 'IN_PROGRESS' })
            .eq('test_id', testId)
            .eq('student_id', studentId);

        return { attempt, questions: testQuestions, test };
    }

    async saveAnswer(attemptId: string, questionId: string, answer: string, timeTaken: number = 0, markedForReview: boolean = false) {
        const { data, error } = await this.supabase
            .from('student_responses')
            .upsert(
                { attempt_id: attemptId, question_id: questionId, answer, time_taken: timeTaken, marked_for_review: markedForReview, answered_at: new Date().toISOString() },
                { onConflict: 'attempt_id,question_id' },
            )
            .select()
            .single();
        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async submitAttempt(attemptId: string) {
        // Get attempt
        const { data: attempt } = await this.supabase.from('test_attempts').select('*').eq('id', attemptId).single();
        if (!attempt) throw new NotFoundException('Attempt not found');
        if (attempt.status !== 'IN_PROGRESS') throw new BadRequestException('This attempt has already been submitted');

        // Get all responses
        const { data: responses } = await this.supabase
            .from('student_responses')
            .select('*, questions(*)')
            .eq('attempt_id', attemptId);

        // Get all test questions to find unattempted
        const { data: testQuestions } = await this.supabase
            .from('test_questions')
            .select('marks, negative_marks, questions(correct_answer, question_type)')
            .eq('test_id', attempt.test_id);

        // Auto-grade
        let score = 0;
        let correct = 0;
        let incorrect = 0;
        let totalTimeTaken = 0;

        if (responses) {
            for (const resp of responses) {
                totalTimeTaken += resp.time_taken || 0;
                const question = resp.questions;
                if (!question || !resp.answer) continue;

                const isCorrect = resp.answer.trim().toUpperCase() === question.correct_answer?.trim().toUpperCase();

                // Get marks from test_questions
                const tq = testQuestions?.find((tq: any) => tq.questions?.correct_answer === question.correct_answer);
                const marks = tq?.marks || question.marks || 1;
                const negMarks = tq?.negative_marks || question.negative_marks || 0;

                const marksAwarded = isCorrect ? marks : -negMarks;

                await this.supabase
                    .from('student_responses')
                    .update({ is_correct: isCorrect, marks_awarded: marksAwarded })
                    .eq('id', resp.id);

                score += marksAwarded;
                if (isCorrect) correct++;
                else incorrect++;
            }
        }

        const totalQs = testQuestions?.length || 0;
        const answered = responses?.filter((r) => r.answer).length || 0;
        const unattempted = totalQs - answered;
        const totalMarks = attempt.total_marks || testQuestions?.reduce((s: number, q: any) => s + (q.marks || 1), 0) || 0;
        const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100 * 100) / 100 : 0;

        // Update attempt
        const { data: updatedAttempt, error } = await this.supabase
            .from('test_attempts')
            .update({
                status: 'SUBMITTED',
                ended_at: new Date().toISOString(),
                time_taken: totalTimeTaken,
                score,
                percentage: Math.max(0, percentage),
                correct_count: correct,
                incorrect_count: incorrect,
                unattempted_count: unattempted,
            })
            .eq('id', attemptId)
            .select()
            .single();

        if (error) throw new BadRequestException(error.message);

        // Update assignment status
        await this.supabase
            .from('test_assignments')
            .update({ status: 'COMPLETED' })
            .eq('test_id', attempt.test_id)
            .eq('student_id', attempt.student_id);

        // Calculate rank
        await this.calculateRanks(attempt.test_id);

        return updatedAttempt;
    }

    async calculateRanks(testId: string) {
        const { data: attempts } = await this.supabase
            .from('test_attempts')
            .select('id, score')
            .eq('test_id', testId)
            .eq('status', 'SUBMITTED')
            .order('score', { ascending: false });

        if (attempts) {
            for (let i = 0; i < attempts.length; i++) {
                await this.supabase
                    .from('test_attempts')
                    .update({ rank: i + 1 })
                    .eq('id', attempts[i].id);
            }
        }
    }

    async getResults(attemptId: string) {
        const { data: attempt } = await this.supabase
            .from('test_attempts')
            .select('*, tests(title, total_marks, duration)')
            .eq('id', attemptId)
            .single();

        if (!attempt) throw new NotFoundException('Attempt not found');

        // Get all responses with question details
        const { data: responses } = await this.supabase
            .from('student_responses')
            .select('*, questions(question_text, question_type, options, correct_answer, explanation, difficulty)')
            .eq('attempt_id', attemptId)
            .order('answered_at');

        // Total attempts for percentile
        const { count } = await this.supabase
            .from('test_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('test_id', attempt.test_id)
            .eq('status', 'SUBMITTED');

        const totalAttempts = count || 1;
        const percentile = Math.round(((totalAttempts - (attempt.rank || 1)) / totalAttempts) * 100 * 100) / 100;

        return {
            attempt,
            responses,
            stats: {
                totalAttempts,
                percentile: Math.max(0, percentile),
            },
        };
    }

    async getTestAnalytics(testId: string) {
        const { data: attempts } = await this.supabase
            .from('test_attempts')
            .select('*, users!student_id(name)')
            .eq('test_id', testId)
            .eq('status', 'SUBMITTED')
            .order('rank');

        if (!attempts || attempts.length === 0) return { message: 'No submissions yet' };

        const scores = attempts.map((a) => a.score || 0);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
        const passPercentage = (scores.filter((s) => s >= (attempts[0]?.total_marks || 100) * 0.33).length / scores.length) * 100;

        return {
            totalAttempts: attempts.length,
            averageScore: Math.round(avgScore * 100) / 100,
            highestScore: maxScore,
            lowestScore: minScore,
            passPercentage: Math.round(passPercentage * 100) / 100,
            leaderboard: attempts.slice(0, 10).map((a) => ({
                rank: a.rank,
                studentName: (a as any).users?.name,
                score: a.score,
                percentage: a.percentage,
                timeTaken: a.time_taken,
            })),
        };
    }
}
