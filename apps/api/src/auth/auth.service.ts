import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterDto, LoginDto, UserRole } from './dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(private supabase: SupabaseService) { }

    async register(dto: RegisterDto) {
        // 1. Create auth user in Supabase
        const { data: authData, error: authError } = await this.supabase.signUp(dto.email, dto.password);
        if (authError) throw new BadRequestException(authError.message);

        // 2. Create a default institute for admin, or assign to first institute
        let instituteId: string | null = null;
        if (dto.role === UserRole.ADMIN) {
            const { data: institute } = await this.supabase
                .from('institutes')
                .insert({ name: `${dto.name}'s Institute` })
                .select()
                .single();
            instituteId = institute?.id;
        } else {
            // For non-admin users, get the first institute (or null)
            const { data: institutes } = await this.supabase
                .from('institutes')
                .select('id')
                .limit(1);
            instituteId = institutes?.[0]?.id || null;
        }

        // 3. Create user profile
        const { data: user, error: userError } = await this.supabase
            .from('users')
            .insert({
                auth_id: authData.user?.id,
                institute_id: instituteId,
                role: dto.role,
                name: dto.name,
                email: dto.email,
                phone: dto.phone,
            })
            .select()
            .single();

        if (userError) throw new BadRequestException(userError.message);

        // 4. Create role-specific profile
        if (dto.role === UserRole.STUDENT) {
            await this.supabase.from('students').insert({
                user_id: user.id,
                class: dto.class,
                batch: dto.batch,
                parent_phone: dto.parentPhone,
            });
        } else if (dto.role === UserRole.TEACHER) {
            await this.supabase.from('teachers').insert({
                user_id: user.id,
                subjects: dto.subjects || [],
                classes: dto.classes || [],
                qualification: dto.qualification,
            });
        } else if (dto.role === UserRole.PARENT) {
            await this.supabase.from('parents').insert({
                user_id: user.id,
                student_ids: dto.studentIds || [],
            });
        }

        return {
            user,
            session: authData.session,
        };
    }

    async login(dto: LoginDto) {
        const { data, error } = await this.supabase.signIn(dto.email, dto.password);
        if (error) throw new UnauthorizedException('Invalid email or password');

        // Get user profile (try auth_id first, then direct id for admin-seeded users)
        let { data: user } = await this.supabase
            .from('users')
            .select('*')
            .eq('auth_id', data.user.id)
            .single();

        if (!user) {
            const { data: userById } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();
            user = userById;
        }

        // If still no user profile, create a minimal one from auth metadata
        if (!user) {
            const { data: newUser } = await this.supabase
                .from('users')
                .insert({
                    id: data.user.id,
                    auth_id: data.user.id,
                    email: data.user.email,
                    name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
                    role: 'ADMIN',
                })
                .select()
                .single();
            user = newUser;
        }

        return {
            user,
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: data.session.expires_at,
            },
        };
    }

    async getMe(authUser: any) {
        const { data: user } = await this.supabase
            .from('users')
            .select('*')
            .eq('auth_id', authUser.id)
            .single();

        if (!user) throw new UnauthorizedException('User not found');

        // Get role-specific data
        let roleData = null;
        if (user.role === 'STUDENT') {
            const { data } = await this.supabase.from('students').select('*').eq('user_id', user.id).single();
            roleData = data;
        } else if (user.role === 'TEACHER') {
            const { data } = await this.supabase.from('teachers').select('*').eq('user_id', user.id).single();
            roleData = data;
        }

        return { ...user, roleData };
    }

    async updateProfile(userId: string, updates: Partial<{ name: string; phone: string; avatar_url: string }>) {
        const { data, error } = await this.supabase
            .from('users')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw new BadRequestException(error.message);
        return data;
    }
}
