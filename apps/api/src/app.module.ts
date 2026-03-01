import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { QuestionsModule } from './questions/questions.module';
import { TestsModule } from './tests/tests.module';
import { AiModule } from './ai/ai.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
    imports: [
        // Config from .env
        ConfigModule.forRoot({ isGlobal: true }),

        // Core
        SupabaseModule,

        // Feature modules
        AuthModule,
        QuestionsModule,
        TestsModule,
        AiModule,
        AttendanceModule,
        AnalyticsModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
