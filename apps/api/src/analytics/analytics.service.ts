import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AnalyticsService {
    constructor(private supabase: SupabaseService) { }

    // ==================== STUDENT PERFORMANCE ====================
    async getStudentPerformance(studentId: string) {
        // Get all attempts
        const { data: attempts } = await this.supabase
            .from('test_attempts')
            .select('*, tests(title, test_type, total_marks)')
            .eq('student_id', studentId)
            .eq('status', 'SUBMITTED')
            .order('created_at', { ascending: false });

        if (!attempts || attempts.length === 0) return { message: 'No test data available' };

        const scores = attempts.map((a) => a.score || 0);
        const percentages = attempts.map((a) => a.percentage || 0);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const avgPercentage = percentages.reduce((a, b) => a + b, 0) / percentages.length;

        // Performance trend (last 10 tests)
        const trend = attempts.slice(0, 10).map((a) => ({
            testTitle: (a as any).tests?.title,
            score: a.score,
            percentage: a.percentage,
            rank: a.rank,
            date: a.created_at,
        }));

        // Accuracy breakdown
        const totalCorrect = attempts.reduce((sum, a) => sum + (a.correct_count || 0), 0);
        const totalIncorrect = attempts.reduce((sum, a) => sum + (a.incorrect_count || 0), 0);
        const totalUnattempted = attempts.reduce((sum, a) => sum + (a.unattempted_count || 0), 0);

        return {
            totalTests: attempts.length,
            averageScore: Math.round(avgScore * 100) / 100,
            averagePercentage: Math.round(avgPercentage * 100) / 100,
            bestScore: Math.max(...scores),
            bestPercentage: Math.max(...percentages),
            bestRank: Math.min(...attempts.map((a) => a.rank || 999)),
            totalCorrect,
            totalIncorrect,
            totalUnattempted,
            overallAccuracy: totalCorrect + totalIncorrect > 0
                ? Math.round((totalCorrect / (totalCorrect + totalIncorrect)) * 100 * 100) / 100
                : 0,
            trend,
        };
    }

    // ==================== STUDENT COMPARISON ====================
    async getStudentComparison(studentId: string, testId: string) {
        // Get student's attempt
        const { data: studentAttempt } = await this.supabase
            .from('test_attempts')
            .select('*')
            .eq('test_id', testId)
            .eq('student_id', studentId)
            .eq('status', 'SUBMITTED')
            .single();

        if (!studentAttempt) return { message: 'Student has not attempted this test' };

        // Get all attempts for comparison
        const { data: allAttempts } = await this.supabase
            .from('test_attempts')
            .select('score, percentage')
            .eq('test_id', testId)
            .eq('status', 'SUBMITTED');

        if (!allAttempts) return { message: 'No data available' };

        const classAvg = allAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / allAttempts.length;
        const studentsBelow = allAttempts.filter((a) => (a.score || 0) < (studentAttempt.score || 0)).length;
        const percentile = Math.round((studentsBelow / allAttempts.length) * 100 * 100) / 100;

        return {
            studentScore: studentAttempt.score,
            studentPercentage: studentAttempt.percentage,
            studentRank: studentAttempt.rank,
            classAverage: Math.round(classAvg * 100) / 100,
            totalStudents: allAttempts.length,
            percentile,
            aboveAverage: (studentAttempt.score || 0) > classAvg,
            improvement: null, // Can calculate from previous tests
        };
    }

    // ==================== INSTITUTE DASHBOARD ====================
    async getInstituteDashboard(instituteId: string) {
        // Count students
        const { count: studentCount } = await this.supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('institute_id', instituteId)
            .eq('role', 'STUDENT');

        // Count teachers
        const { count: teacherCount } = await this.supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('institute_id', instituteId)
            .eq('role', 'TEACHER');

        // Count tests
        const { count: testCount } = await this.supabase
            .from('tests')
            .select('*', { count: 'exact', head: true })
            .eq('institute_id', instituteId);

        // Count questions
        const { count: questionCount } = await this.supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('institute_id', instituteId)
            .eq('is_deleted', false);

        // Recent tests
        const { data: recentTests } = await this.supabase
            .from('tests')
            .select('id, title, test_type, is_published, created_at')
            .eq('institute_id', instituteId)
            .order('created_at', { ascending: false })
            .limit(5);

        return {
            stats: {
                totalStudents: studentCount || 0,
                totalTeachers: teacherCount || 0,
                totalTests: testCount || 0,
                totalQuestions: questionCount || 0,
            },
            recentTests,
        };
    }

    // ==================== NOTIFICATIONS ====================
    async createNotification(userId: string, type: string, title: string, message: string, data: any = {}) {
        const { data: notification, error } = await this.supabase
            .from('notifications')
            .insert({ user_id: userId, type, title, message, data })
            .select()
            .single();
        if (error) throw new BadRequestException(error.message);
        return notification;
    }

    async getNotifications(userId: string, page: number = 1, limit: number = 20) {
        const offset = (page - 1) * limit;
        const { data, count } = await this.supabase
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('sent_at', { ascending: false })
            .range(offset, offset + limit - 1);
        return { data, total: count || 0, page, limit };
    }

    async markNotificationRead(notificationId: string) {
        const { data, error } = await this.supabase
            .from('notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('id', notificationId)
            .select()
            .single();
        if (error) throw new BadRequestException(error.message);
        return data;
    }

    async getUnreadCount(userId: string) {
        const { count } = await this.supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);
        return { unreadCount: count || 0 };
    }
}
