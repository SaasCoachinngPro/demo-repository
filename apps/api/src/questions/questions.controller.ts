import {
    Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req,
    UploadedFile, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { QuestionsService } from './questions.service';
import { AiExtractionService } from './ai-extraction.service';
import { CreateQuestionDto, UpdateQuestionDto, SearchQuestionsDto } from './dto/questions.dto';
import { AuthGuard, RolesGuard, Roles } from '../auth/auth.guard';
import { ApiResponse } from '../common/api-response';
import * as Papa from 'papaparse';

@Controller('questions')
@UseGuards(AuthGuard)
export class QuestionsController {
    constructor(
        private questionsService: QuestionsService,
        private aiExtractionService: AiExtractionService
    ) { }

    @Post('import/ai')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    @UseInterceptors(FileInterceptor('file'))
    async importViaAi(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('No file uploaded');

        const questions = await this.aiExtractionService.parseDocument(file.buffer, file.mimetype);
        return ApiResponse.ok(questions, 'Questions extracted successfully by AI. Please review before saving.');
    }

    @Post()
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async create(@Body() dto: CreateQuestionDto, @Req() req: any) {
        const result = await this.questionsService.create(dto, req.user.id, req.user.institute_id);
        return ApiResponse.ok(result, 'Question created');
    }

    @Post('bulk')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async createBulk(@Body() body: { questions: CreateQuestionDto[] }, @Req() req: any) {
        const result = await this.questionsService.createBulk(body.questions, req.user.id, req.user.institute_id);
        return ApiResponse.ok(result, 'Bulk import completed');
    }

    @Post('import')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    @UseInterceptors(FileInterceptor('file'))
    async importFile(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
        if (!file) return ApiResponse.error('No file uploaded');

        const content = file.buffer.toString('utf-8');
        let rows: any[];

        if (file.originalname.endsWith('.csv')) {
            const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
            rows = parsed.data;
        } else if (file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
            const XLSX = await import('xlsx');
            const workbook = XLSX.read(file.buffer, { type: 'buffer' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            rows = XLSX.utils.sheet_to_json(sheet);
        } else {
            return ApiResponse.error('Unsupported file format. Use CSV or Excel (.xlsx)');
        }

        const result = await this.questionsService.importFromCsv(rows, req.user.id, req.user.institute_id);
        return ApiResponse.ok(result, `Import completed: ${result.success}/${result.total} questions imported`);
    }

    @Get()
    async findAll(@Query() query: SearchQuestionsDto, @Req() req: any) {
        const result = await this.questionsService.findAll(query, req.user.institute_id);
        return ApiResponse.paginated(result.data, result.total, result.page, result.limit);
    }

    @Get('subjects')
    async getSubjects(@Req() req: any) {
        const data = await this.questionsService.getSubjects(req.user.institute_id);
        return ApiResponse.ok(data, 'Subjects retrieved');
    }

    @Post('subjects')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async createSubject(@Body() body: { name: string; code: string }, @Req() req: any) {
        const data = await this.questionsService.createSubject(body.name, body.code, req.user.institute_id);
        return ApiResponse.ok(data, 'Subject created');
    }

    @Post('chapters')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async createChapter(@Body() body: { name: string; subjectId: string; order?: number }) {
        const data = await this.questionsService.createChapter(body.name, body.subjectId, body.order);
        return ApiResponse.ok(data, 'Chapter created');
    }

    @Post('topics')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async createTopic(@Body() body: { name: string; chapterId: string }) {
        const data = await this.questionsService.createTopic(body.name, body.chapterId);
        return ApiResponse.ok(data, 'Topic created');
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const data = await this.questionsService.findOne(id);
        return ApiResponse.ok(data, 'Question retrieved');
    }

    @Patch(':id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async update(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
        const data = await this.questionsService.update(id, dto);
        return ApiResponse.ok(data, 'Question updated');
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async delete(@Param('id') id: string) {
        const data = await this.questionsService.softDelete(id);
        return ApiResponse.ok(data, 'Question deleted');
    }
}
