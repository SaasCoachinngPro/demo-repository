import { Controller, Post, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { AuthGuard } from './auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    async register(@Body() dto: RegisterDto) {
        const result = await this.authService.register(dto);
        return ApiResponse.ok(result, 'Registration successful');
    }

    @Post('login')
    async login(@Body() dto: LoginDto) {
        const result = await this.authService.login(dto);
        return ApiResponse.ok(result, 'Login successful');
    }

    @UseGuards(AuthGuard)
    @Get('me')
    async getMe(@Req() req: any) {
        const result = await this.authService.getMe(req.user.authUser);
        return ApiResponse.ok(result, 'User profile retrieved');
    }

    @UseGuards(AuthGuard)
    @Patch('profile')
    async updateProfile(@Req() req: any, @Body() body: { name?: string; phone?: string; avatar_url?: string }) {
        const result = await this.authService.updateProfile(req.user.id, body);
        return ApiResponse.ok(result, 'Profile updated');
    }
}
