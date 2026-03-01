import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../supabase/supabase.service';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => {
    return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
        Reflect.defineMetadata(ROLES_KEY, roles, descriptor?.value || target);
        return descriptor || target;
    };
};

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private supabase: SupabaseService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid authorization token');
        }

        const token = authHeader.replace('Bearer ', '');

        try {
            const { data, error } = await this.supabase.getUser(token);
            if (error || !data?.user) {
                throw new UnauthorizedException('Invalid or expired token');
            }

            // Get user profile - try auth_id first, then direct id (for admin-seeded users)
            let { data: userProfile } = await this.supabase
                .from('users')
                .select('*')
                .eq('auth_id', data.user.id)
                .single();

            if (!userProfile) {
                const { data: profileById } = await this.supabase
                    .from('users')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();
                userProfile = profileById;
            }

            // Auto-create profile if still not found (fallback for new auth users)
            if (!userProfile) {
                // Get or create a default institute
                let instituteId: string | null = null;
                const { data: institutes } = await this.supabase.from('institutes').select('id').limit(1);
                instituteId = institutes?.[0]?.id || null;

                const { data: newProfile } = await this.supabase
                    .from('users')
                    .insert({
                        auth_id: data.user.id,
                        email: data.user.email,
                        name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Admin',
                        role: 'ADMIN',
                        institute_id: instituteId,
                    })
                    .select()
                    .single();
                userProfile = newProfile;
            }

            if (!userProfile) {
                throw new UnauthorizedException('User profile not found');
            }

            request.user = { ...userProfile, authUser: data.user };
            request.token = token;
            return true;
        } catch (err) {
            if (err instanceof UnauthorizedException) throw err;
            throw new UnauthorizedException('Authentication failed');
        }
    }
}

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
        if (!requiredRoles || requiredRoles.length === 0) return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) return false;
        return requiredRoles.includes(user.role);
    }
}
