import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
    private client: SupabaseClient;

    constructor(private configService: ConfigService) {
        const url = this.configService.get<string>('SUPABASE_URL');
        const key = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') ||
            this.configService.get<string>('SUPABASE_ANON_KEY');

        if (!url || !key) {
            console.warn('⚠️ Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env');
            return;
        }

        this.client = createClient(url, key, {
            auth: { autoRefreshToken: false, persistSession: false },
        });
    }

    getClient(): SupabaseClient {
        return this.client;
    }

    // Auth helpers
    async signUp(email: string, password: string) {
        return this.client.auth.signUp({ email, password });
    }

    async signIn(email: string, password: string) {
        return this.client.auth.signInWithPassword({ email, password });
    }

    async signOut(token: string) {
        return this.client.auth.admin.signOut(token);
    }

    async getUser(token: string) {
        return this.client.auth.getUser(token);
    }

    // Database query helper
    from(table: string) {
        return this.client.from(table);
    }

    // Storage helper
    storage(bucket: string) {
        return this.client.storage.from(bucket);
    }
}
