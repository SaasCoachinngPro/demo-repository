import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard, RolesGuard, Roles } from '../auth/auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
    constructor(private analyticsService: AnalyticsService) { }

    @Get('student/:studentId/performance')
    async getStudentPerformance(@Param('studentId') studentId: string) {
        const result = await this.analyticsService.getStudentPerformance(studentId);
        return ApiResponse.ok(result, 'Performance data retrieved');
    }

    @Get('student/:studentId/comparison')
    async getStudentComparison(
        @Param('studentId') studentId: string,
        @Query('testId') testId: string,
    ) {
        const result = await this.analyticsService.getStudentComparison(studentId, testId);
        return ApiResponse.ok(result, 'Comparison data retrieved');
    }

    @Get('dashboard')
    @UseGuards(RolesGuard)
    @Roles('ADMIN')
    async getDashboard(@Req() req: any) {
        const result = await this.analyticsService.getInstituteDashboard(req.user.institute_id);
        return ApiResponse.ok(result, 'Dashboard data retrieved');
    }

    // ==================== NOTIFICATIONS ====================
    @Get('notifications')
    async getNotifications(@Req() req: any, @Query('page') page?: number, @Query('limit') limit?: number) {
        const result = await this.analyticsService.getNotifications(req.user.id, page, limit);
        return ApiResponse.paginated(result.data, result.total, result.page, result.limit);
    }

    @Get('notifications/unread-count')
    async getUnreadCount(@Req() req: any) {
        const result = await this.analyticsService.getUnreadCount(req.user.id);
        return ApiResponse.ok(result, 'Unread count retrieved');
    }

    @Patch('notifications/:id/read')
    async markRead(@Param('id') id: string) {
        const result = await this.analyticsService.markNotificationRead(id);
        return ApiResponse.ok(result, 'Notification marked as read');
    }

    @Post('notifications')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'TEACHER')
    async createNotification(@Body() body: { userId: string; type: string; title: string; message: string; data?: any }) {
        const result = await this.analyticsService.createNotification(body.userId, body.type, body.title, body.message, body.data);
        return ApiResponse.ok(result, 'Notification sent');
    }
}
