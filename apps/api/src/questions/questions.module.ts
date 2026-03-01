import { Module } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { AiExtractionService } from './ai-extraction.service';

@Module({
    controllers: [QuestionsController],
    providers: [QuestionsService, AiExtractionService],
    exports: [QuestionsService],
})
export class QuestionsModule { }
