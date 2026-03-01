import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AttendanceService {
    constructor(private supabase: SupabaseService) { }

    // ==================== CLASSES ====================
    async createClass(dto: any, instituteId: string) {
        const { data, error } = await this.supabase
            .from('classes')
            .insert({ institute_id: instituteId, name: dto.name, batch: dto.batch, teacher_id: dto.teacherId, schedule: dto.schedule || {} })
            .select()
            .single();
        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async listClasses(instituteId: string) {
        const { data } = await this.supabase
            .from('classes')
            .select('*, users!teacher_id(name)')
            .eq('institute_id', instituteId)
            .order('created_at', { ascending: false });
        return data;
    }

    async addStudentsToClass(classId: string, studentIds: string[]) {
        const records = studentIds.map((sid) => ({ class_id: classId, student_id: sid }));
        const { data, error } = await this.supabase
            .from('class_students')
            .upsert(records, { onConflict: 'class_id,student_id' })
            .select();
        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async getClassStudents(classId: string) {
        const { data } = await this.supabase
            .from('class_students')
            .select('*, users!student_id(name, email, phone)')
            .eq('class_id', classId);
        return data;
    }

    // ==================== ATTENDANCE ====================
    async markAttendance(dto: { studentId: string; classId: string; date: string; status: string; markedBy: string; method?: string; confidenceScore?: number }) {
        const { data, error } = await this.supabase
            .from('attendance')
            .upsert({
                student_id: dto.studentId,
                class_id: dto.classId,
                date: dto.date,
                status: dto.status,
                marked_by: dto.markedBy,
                method: dto.method || 'MANUAL',
                confidence_score: dto.confidenceScore,
                marked_at: new Date().toISOString(),
            }, { onConflict: 'student_id,class_id,date' })
            .select()
            .single();
        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async markBulkAttendance(records: { studentId: string; status: string }[], classId: string, date: string, markedBy: string) {
        const attendanceRecords = records.map((r) => ({
            student_id: r.studentId,
            class_id: classId,
            date,
            status: r.status,
            marked_by: markedBy,
            method: 'MANUAL',
            marked_at: new Date().toISOString(),
        }));

        const { data, error } = await this.supabase
            .from('attendance')
            .upsert(attendanceRecords, { onConflict: 'student_id,class_id,date' })
            .select();
        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async markFaceRecognitionBatch(records: { studentId: string; confidence: number }[], classId: string, date: string, markedBy: string) {
        const attendanceRecords = records.map((r) => ({
            student_id: r.studentId,
            class_id: classId,
            date,
            status: r.confidence >= 0.7 ? 'PRESENT' : 'ABSENT',
            marked_by: markedBy,
            method: 'FACE_RECOGNITION',
            confidence_score: r.confidence,
            marked_at: new Date().toISOString(),
        }));

        const { data, error } = await this.supabase
            .from('attendance')
            .upsert(attendanceRecords, { onConflict: 'student_id,class_id,date' })
            .select();
        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async getClassAttendance(classId: string, date: string) {
        const { data } = await this.supabase
            .from('attendance')
            .select('*, users!student_id(name, email)')
            .eq('class_id', classId)
            .eq('date', date);
        return data;
    }

    async getStudentAttendance(studentId: string, startDate?: string, endDate?: string) {
        let query = this.supabase
            .from('attendance')
            .select('*, classes(name)')
            .eq('student_id', studentId)
            .order('date', { ascending: false });

        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lte('date', endDate);

        const { data } = await query;
        return data;
    }

    async getAttendanceReport(studentId: string) {
        const { data: records } = await this.supabase
            .from('attendance')
            .select('*')
            .eq('student_id', studentId);

        if (!records || records.length === 0) return { totalDays: 0, present: 0, absent: 0, late: 0, percentage: 0 };

        const present = records.filter((r) => r.status === 'PRESENT').length;
        const absent = records.filter((r) => r.status === 'ABSENT').length;
        const late = records.filter((r) => r.status === 'LATE').length;
        const percentage = Math.round((present / records.length) * 100 * 100) / 100;

        return {
            totalDays: records.length,
            present,
            absent,
            late,
            percentage,
            isLowAttendance: percentage < 75,
        };
    }

    async getClassAttendanceReport(classId: string) {
        const { data: students } = await this.supabase
            .from('class_students')
            .select('student_id, users!student_id(name)')
            .eq('class_id', classId);

        if (!students) return [];

        const reports = [];
        for (const student of students) {
            const report = await this.getAttendanceReport(student.student_id);
            reports.push({
                studentId: student.student_id,
                studentName: (student as any).users?.name,
                ...report,
            });
        }

        return reports;
    }

    // ==================== FACE REGISTRATION ====================
    async registerFace(studentId: string, faceImages: string[]) {
        const { data, error } = await this.supabase
            .from('students')
            .update({ face_images: faceImages, face_registered: true })
            .eq('user_id', studentId)
            .select()
            .single();
        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async getFaceStatus(studentId: string) {
        const { data } = await this.supabase
            .from('students')
            .select('face_registered, face_images')
            .eq('user_id', studentId)
            .single();

        return {
            isRegistered: data?.face_registered || false,
            imagesCount: data?.face_images?.length || 0,
            minRequired: 5,
            canAttemptFaceAttendance: (data?.face_images?.length || 0) >= 5,
        };
    }
}
