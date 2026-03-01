import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AuthGuard, RolesGuard, Roles } from '../auth/auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('attendance')
@UseGuards(AuthGuard)
export class AttendanceController {
    constructor(private attendanceService: AttendanceService) { }

    // ==================== CLASSES ====================
    @Post('classes')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async createClass(@Body() dto: any, @Req() req: any) {
        const result = await this.attendanceService.createClass(dto, req.user.institute_id);
        return ApiResponse.ok(result, 'Class created');
    }

    @Get('classes')
    async listClasses(@Req() req: any) {
        const result = await this.attendanceService.listClasses(req.user.institute_id);
        return ApiResponse.ok(result, 'Classes retrieved');
    }

    @Post('classes/:classId/students')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async addStudentsToClass(@Param('classId') classId: string, @Body() body: { studentIds: string[] }) {
        const result = await this.attendanceService.addStudentsToClass(classId, body.studentIds);
        return ApiResponse.ok(result, 'Students added to class');
    }

    @Get('classes/:classId/students')
    async getClassStudents(@Param('classId') classId: string) {
        const result = await this.attendanceService.getClassStudents(classId);
        return ApiResponse.ok(result, 'Class students retrieved');
    }

    // ==================== ATTENDANCE ====================
    @Post('mark')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async markAttendance(@Body() dto: any, @Req() req: any) {
        const result = await this.attendanceService.markAttendance({ ...dto, markedBy: req.user.id });
        return ApiResponse.ok(result, 'Attendance marked');
    }

    @Post('mark-bulk')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async markBulkAttendance(
        @Body() body: { records: { studentId: string; status: string }[]; classId: string; date: string },
        @Req() req: any,
    ) {
        const result = await this.attendanceService.markBulkAttendance(body.records, body.classId, body.date, req.user.id);
        return ApiResponse.ok(result, `Attendance marked for ${result.length} students`);
    }

    @Post('face-recognition-batch')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async markFaceRecognitionBatch(
        @Body() body: { records: { studentId: string; confidence: number }[]; classId: string; date: string },
        @Req() req: any,
    ) {
        const result = await this.attendanceService.markFaceRecognitionBatch(body.records, body.classId, body.date, req.user.id);
        return ApiResponse.ok(result, 'Face recognition attendance marked');
    }

    @Get('class/:classId/date/:date')
    async getClassAttendance(@Param('classId') classId: string, @Param('date') date: string) {
        const result = await this.attendanceService.getClassAttendance(classId, date);
        return ApiResponse.ok(result, 'Attendance retrieved');
    }

    @Get('student/:studentId')
    async getStudentAttendance(
        @Param('studentId') studentId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const result = await this.attendanceService.getStudentAttendance(studentId, startDate, endDate);
        return ApiResponse.ok(result, 'Attendance history retrieved');
    }

    @Get('report/student/:studentId')
    async getStudentReport(@Param('studentId') studentId: string) {
        const result = await this.attendanceService.getAttendanceReport(studentId);
        return ApiResponse.ok(result, 'Attendance report generated');
    }

    @Get('report/class/:classId')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async getClassReport(@Param('classId') classId: string) {
        const result = await this.attendanceService.getClassAttendanceReport(classId);
        return ApiResponse.ok(result, 'Class attendance report generated');
    }

    // ==================== FACE REGISTRATION ====================
    @Post('face/register/:studentId')
    async registerFace(@Param('studentId') studentId: string, @Body() body: { faceImages: string[] }) {
        const result = await this.attendanceService.registerFace(studentId, body.faceImages);
        return ApiResponse.ok(result, 'Face registered');
    }

    @Get('face/status/:studentId')
    async getFaceStatus(@Param('studentId') studentId: string) {
        const result = await this.attendanceService.getFaceStatus(studentId);
        return ApiResponse.ok(result, 'Face registration status');
    }
}
