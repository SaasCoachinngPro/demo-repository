import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateQuestionDto, UpdateQuestionDto, SearchQuestionsDto } from './dto/questions.dto';

@Injectable()
export class QuestionsService {
    constructor(private supabase: SupabaseService) { }

    async create(dto: CreateQuestionDto, userId: string, instituteId: string) {
        const { data, error } = await this.supabase
            .from('questions')
            .insert({
                institute_id: instituteId,
                subject_id: dto.subjectId,
                chapter_id: dto.chapterId,
                topic_id: dto.topicId,
                question_text: dto.questionText,
                question_type: dto.questionType,
                options: dto.options,
                correct_answer: dto.correctAnswer,
                explanation: dto.explanation,
                difficulty: dto.difficulty,
                marks: dto.marks,
                negative_marks: dto.negativeMarks,
                time_estimate: dto.timeEstimate,
                image_url: dto.imageUrl,
                tags: dto.tags || [],
                source: 'TEACHER_CREATED',
                created_by: userId,
            })
            .select()
            .single();

        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async createBulk(questions: CreateQuestionDto[], userId: string, instituteId: string) {
        const records = questions.map((q) => ({
            institute_id: instituteId,
            subject_id: q.subjectId,
            chapter_id: q.chapterId,
            topic_id: q.topicId,
            question_text: q.questionText,
            question_type: q.questionType || 'MCQ',
            options: q.options,
            correct_answer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: q.difficulty || 'MEDIUM',
            marks: q.marks || 1,
            negative_marks: q.negativeMarks || 0,
            tags: q.tags || [],
            source: 'IMPORTED',
            created_by: userId,
        }));

        // Batch insert in chunks of 100
        const results = { total: records.length, success: 0, failed: 0, errors: [] as any[] };

        for (let i = 0; i < records.length; i += 100) {
            const batch = records.slice(i, i + 100);
            const { data, error } = await this.supabase.from('questions').insert(batch).select();

            if (error) {
                results.failed += batch.length;
                results.errors.push({ batch: Math.floor(i / 100) + 1, error: error.message });
            } else {
                results.success += data.length;
            }
        }

        return results;
    }

    async findAll(query: SearchQuestionsDto, instituteId: string) {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const offset = (page - 1) * limit;

        let q = this.supabase
            .from('questions')
            .select('*, subjects(name), chapters(name), topics(name), users!created_by(name)', { count: 'exact' })
            .eq('institute_id', instituteId)
            .eq('is_deleted', false);

        if (query.subjectId) q = q.eq('subject_id', query.subjectId);
        if (query.chapterId) q = q.eq('chapter_id', query.chapterId);
        if (query.topicId) q = q.eq('topic_id', query.topicId);
        if (query.difficulty) q = q.eq('difficulty', query.difficulty);
        if (query.questionType) q = q.eq('question_type', query.questionType);
        if (query.search) q = q.ilike('question_text', `%${query.search}%`);
        if (query.tags && query.tags.length > 0) q = q.overlaps('tags', query.tags);

        q = q.order(query.sortBy || 'created_at', { ascending: query.sortOrder === 'asc' });
        q = q.range(offset, offset + limit - 1);

        const { data, error, count } = await q;
        if (error) throw new BadRequestException(error.message);

        return { data, total: count || 0, page, limit };
    }

    async findOne(id: string) {
        const { data, error } = await this.supabase
            .from('questions')
            .select('*, subjects(name), chapters(name), topics(name), users!created_by(name)')
            .eq('id', id)
            .eq('is_deleted', false)
            .single();

        if (error || !data) throw new NotFoundException('Question not found');
        return data;
    }

    async update(id: string, dto: UpdateQuestionDto) {
        const updateData: any = { updated_at: new Date().toISOString() };
        if (dto.questionText) updateData.question_text = dto.questionText;
        if (dto.questionType) updateData.question_type = dto.questionType;
        if (dto.options) updateData.options = dto.options;
        if (dto.correctAnswer !== undefined) updateData.correct_answer = dto.correctAnswer;
        if (dto.explanation !== undefined) updateData.explanation = dto.explanation;
        if (dto.difficulty) updateData.difficulty = dto.difficulty;
        if (dto.marks !== undefined) updateData.marks = dto.marks;
        if (dto.negativeMarks !== undefined) updateData.negative_marks = dto.negativeMarks;
        if (dto.timeEstimate !== undefined) updateData.time_estimate = dto.timeEstimate;
        if (dto.imageUrl !== undefined) updateData.image_url = dto.imageUrl;
        if (dto.tags) updateData.tags = dto.tags;
        if (dto.subjectId) updateData.subject_id = dto.subjectId;
        if (dto.chapterId) updateData.chapter_id = dto.chapterId;
        if (dto.topicId) updateData.topic_id = dto.topicId;

        const { data, error } = await this.supabase
            .from('questions')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async softDelete(id: string) {
        const { data, error } = await this.supabase
            .from('questions')
            .update({ is_deleted: true, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new BadRequestException(error.message);
        return data;
    }

    // CSV/Excel import
    async importFromCsv(rows: any[], userId: string, instituteId: string) {
        const questions: CreateQuestionDto[] = rows.map((row) => ({
            questionText: row['question_text'] || row['question'] || row['Question'],
            questionType: row['question_type'] || row['type'] || 'MCQ',
            options: {
                A: row['option_a'] || row['A'] || '',
                B: row['option_b'] || row['B'] || '',
                C: row['option_c'] || row['C'] || '',
                D: row['option_d'] || row['D'] || '',
            },
            correctAnswer: row['correct_answer'] || row['answer'] || row['Answer'],
            explanation: row['explanation'] || '',
            difficulty: (row['difficulty'] || 'MEDIUM').toUpperCase(),
            marks: parseInt(row['marks'] || '1', 10),
            negativeMarks: parseFloat(row['negative_marks'] || '0'),
            tags: row['tags'] ? row['tags'].split(',').map((t: string) => t.trim()) : [],
        }));

        return this.createBulk(questions, userId, instituteId);
    }

    // Subject/Chapter/Topic management
    async getSubjects(instituteId: string) {
        const { data } = await this.supabase
            .from('subjects')
            .select('*, chapters(*, topics(*))')
            .eq('institute_id', instituteId);
        return data;
    }

    async createSubject(name: string, code: string, instituteId: string) {
        const { data, error } = await this.supabase
            .from('subjects')
            .insert({ name, code, institute_id: instituteId })
            .select()
            .single();
        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async createChapter(name: string, subjectId: string, order: number = 0) {
        const { data, error } = await this.supabase
            .from('chapters')
            .insert({ name, subject_id: subjectId, chapter_order: order })
            .select()
            .single();
        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async createTopic(name: string, chapterId: string) {
        const { data, error } = await this.supabase
            .from('topics')
            .insert({ name, chapter_id: chapterId })
            .select()
            .single();
        if (error) throw new BadRequestException(error.message);
        return data;
    }
}
