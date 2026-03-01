import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateQuestionDto {
    @IsNotEmpty()
    @IsString()
    questionText: string;

    @IsOptional()
    @IsEnum(['MCQ', 'NUMERICAL', 'SUBJECTIVE', 'MULTI_CORRECT'])
    questionType?: string = 'MCQ';

    @IsOptional()
    options?: Record<string, string>;

    @IsOptional()
    @IsString()
    correctAnswer?: string;

    @IsOptional()
    @IsString()
    explanation?: string;

    @IsOptional()
    @IsEnum(['EASY', 'MEDIUM', 'HARD'])
    difficulty?: string = 'MEDIUM';

    @IsOptional()
    @IsNumber()
    marks?: number = 1;

    @IsOptional()
    @IsNumber()
    negativeMarks?: number = 0;

    @IsOptional()
    @IsNumber()
    timeEstimate?: number;

    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsOptional()
    @IsArray()
    tags?: string[];

    @IsOptional()
    @IsString()
    subjectId?: string;

    @IsOptional()
    @IsString()
    chapterId?: string;

    @IsOptional()
    @IsString()
    topicId?: string;
}

export class UpdateQuestionDto {
    @IsOptional() @IsString() questionText?: string;
    @IsOptional() questionType?: string;
    @IsOptional() options?: Record<string, string>;
    @IsOptional() @IsString() correctAnswer?: string;
    @IsOptional() @IsString() explanation?: string;
    @IsOptional() difficulty?: string;
    @IsOptional() @IsNumber() marks?: number;
    @IsOptional() @IsNumber() negativeMarks?: number;
    @IsOptional() @IsNumber() timeEstimate?: number;
    @IsOptional() @IsString() imageUrl?: string;
    @IsOptional() @IsArray() tags?: string[];
    @IsOptional() @IsString() subjectId?: string;
    @IsOptional() @IsString() chapterId?: string;
    @IsOptional() @IsString() topicId?: string;
}

export class SearchQuestionsDto {
    @IsOptional() @IsString() subjectId?: string;
    @IsOptional() @IsString() chapterId?: string;
    @IsOptional() @IsString() topicId?: string;
    @IsOptional() difficulty?: string;
    @IsOptional() questionType?: string;
    @IsOptional() @IsString() search?: string;
    @IsOptional() @IsArray() tags?: string[];
    @IsOptional() @IsNumber() page?: number = 1;
    @IsOptional() @IsNumber() limit?: number = 20;
    @IsOptional() @IsString() sortBy?: string = 'created_at';
    @IsOptional() @IsString() sortOrder?: string = 'desc';
}
