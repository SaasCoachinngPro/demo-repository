import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard, RolesGuard, Roles } from '../auth/auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('ai')
@UseGuards(AuthGuard)
export class AiController {
    constructor(private aiService: AiService) { }

    @Post('classify-question')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async classifyQuestion(@Body() body: { questionText: string }) {
        const result = await this.aiService.classifyQuestion(body.questionText);
        return ApiResponse.ok(result, 'Question classified');
    }

    @Post('generate-similar/:questionId')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async generateSimilar(@Param('questionId') questionId: string) {
        const result = await this.aiService.generateSimilarQuestions(questionId);
        return ApiResponse.ok(result, '5 similar questions generated');
    }

    @Get('practice-questions')
    async getPracticeQuestions(@Req() req: any) {
        const result = await this.aiService.getPracticeQuestions(req.user.id);
        return ApiResponse.ok(result, 'Practice questions retrieved');
    }

    @Post('practice-answer')
    async submitPracticeAnswer(@Req() req: any, @Body() body: { questionId: string; answer: string }) {
        const result = await this.aiService.submitPracticeAnswer(req.user.id, body.questionId, body.answer);
        return ApiResponse.ok(result, result.isCorrect ? 'Correct! 🎉' : 'Incorrect. Keep practicing!');
    }

    @Get('student-progress')
    async getStudentProgress(@Req() req: any) {
        const result = await this.aiService.getStudentProgress(req.user.id);
        return ApiResponse.ok(result, 'Progress retrieved');
    }

    @Post('clean-ocr-text')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async cleanOcrText(@Body() body: { ocrText: string }) {
        const result = await this.aiService.cleanOcrText(body.ocrText);
        return ApiResponse.ok(result, 'OCR text cleaned');
    }
}
