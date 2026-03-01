import {
    Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { TestsService } from './tests.service';
import { AuthGuard, RolesGuard, Roles } from '../auth/auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('tests')
@UseGuards(AuthGuard)
export class TestsController {
    constructor(private testsService: TestsService) { }

    // ==================== TEST CRUD ====================
    @Post()
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async create(@Body() dto: any, @Req() req: any) {
        const result = await this.testsService.createTest(dto, req.user.id, req.user.institute_id);
        return ApiResponse.ok(result, 'Test created');
    }

    @Get()
    async list(@Query() query: any, @Req() req: any) {
        const result = await this.testsService.listTests(req.user.institute_id, query);
        return ApiResponse.paginated(result.data, result.total, result.page, result.limit);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const result = await this.testsService.getTest(id);
        return ApiResponse.ok(result, 'Test retrieved');
    }

    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async update(@Param('id') id: string, @Body() dto: any) {
        const result = await this.testsService.updateTest(id, dto);
        return ApiResponse.ok(result, 'Test updated');
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async delete(@Param('id') id: string) {
        const result = await this.testsService.deleteTest(id);
        return ApiResponse.ok(result, 'Test deleted');
    }

    @Post(':id/publish')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async publish(@Param('id') id: string) {
        const result = await this.testsService.publishTest(id);
        return ApiResponse.ok(result, 'Test published');
    }

    // ==================== SECTIONS ====================
    @Post(':id/sections')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async addSection(@Param('id') testId: string, @Body() dto: any) {
        const result = await this.testsService.addSection(testId, dto);
        return ApiResponse.ok(result, 'Section added');
    }

    @Get(':id/sections')
    async getSections(@Param('id') testId: string) {
        const result = await this.testsService.getSections(testId);
        return ApiResponse.ok(result, 'Sections retrieved');
    }

    // ==================== TEST QUESTIONS ====================
    @Post(':id/questions')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async addQuestions(@Param('id') testId: string, @Body() body: { questions: any[] }) {
        const result = await this.testsService.addQuestions(testId, body.questions);
        return ApiResponse.ok(result, 'Questions added to test');
    }

    @Delete(':testId/questions/:questionId')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async removeQuestion(@Param('testId') testId: string, @Param('questionId') questionId: string) {
        const result = await this.testsService.removeQuestion(testId, questionId);
        return ApiResponse.ok(result, 'Question removed from test');
    }

    // ==================== STUDENT ASSIGNMENT ====================
    @Post(':id/assign')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async assignStudents(@Param('id') testId: string, @Body() body: { studentIds: string[] }) {
        const result = await this.testsService.assignStudents(testId, body.studentIds);
        return ApiResponse.ok(result, 'Students assigned');
    }

    @Get(':id/assigned-students')
    async getAssignedStudents(@Param('id') testId: string) {
        const result = await this.testsService.getAssignedStudents(testId);
        return ApiResponse.ok(result, 'Assigned students retrieved');
    }

    @Get('student/my-tests')
    async getMyTests(@Req() req: any) {
        const result = await this.testsService.getStudentTests(req.user.id);
        return ApiResponse.ok(result, 'Your tests retrieved');
    }

    // ==================== TEST ATTEMPTS ====================
    @Post(':id/start')
    async startAttempt(@Param('id') testId: string, @Req() req: any) {
        const result = await this.testsService.startAttempt(testId, req.user.id);
        return ApiResponse.ok(result, 'Test started');
    }

    @Post('attempts/:attemptId/answer')
    async saveAnswer(
        @Param('attemptId') attemptId: string,
        @Body() body: { questionId: string; answer: string; timeTaken?: number; markedForReview?: boolean },
    ) {
        const result = await this.testsService.saveAnswer(
            attemptId, body.questionId, body.answer, body.timeTaken, body.markedForReview,
        );
        return ApiResponse.ok(result, 'Answer saved');
    }

    @Post('attempts/:attemptId/submit')
    async submitAttempt(@Param('attemptId') attemptId: string) {
        const result = await this.testsService.submitAttempt(attemptId);
        return ApiResponse.ok(result, 'Test submitted and graded');
    }

    @Get('attempts/:attemptId/results')
    async getResults(@Param('attemptId') attemptId: string) {
        const result = await this.testsService.getResults(attemptId);
        return ApiResponse.ok(result, 'Results retrieved');
    }

    // ==================== ANALYTICS ====================
    @Get(':id/analytics')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async getTestAnalytics(@Param('id') testId: string) {
        const result = await this.testsService.getTestAnalytics(testId);
        return ApiResponse.ok(result, 'Test analytics retrieved');
    }
}
