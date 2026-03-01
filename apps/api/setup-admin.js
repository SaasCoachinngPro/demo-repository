require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function setupAdmin() {
    const email = 'admin@kapedutech.com';
    const password = 'AdminPassword123!';

    console.log(`Setting up admin user: ${email}...`);

    // 1. Create or update user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { name: 'KAP Admin' }
    });

    let userId;
    if (authError) {
        if (authError.message.includes('already been registered')) {
            console.log('User already exists in Auth. Fetching ID...');
            const { data: users } = await supabase.auth.admin.listUsers();
            const existingUser = users.users.find(u => u.email === email);
            userId = existingUser.id;

            // Force update password and confirm email just in case
            await supabase.auth.admin.updateUserById(userId, {
                password: password,
                email_confirm: true
            });
            console.log('Updated existing user password and confirmation.');
        } else {
            console.error('Failed to create auth user:', authError);
            return;
        }
    } else {
        userId = authData.user.id;
        console.log('Created new auth user, ID:', userId);
    }

    // 2. Ensure they exist in our public.users table as ADMIN
    // First check if institute exists, if not create one
    let instituteId;
    const { data: instCheck } = await supabase.from('institutes').select('id').limit(1);

    if (!instCheck || instCheck.length === 0) {
        console.log('Creating default institute...');
        const { data: newInst, error: instErr } = await supabase.from('institutes').insert({
            name: 'KAP Edutech Default',
            slug: 'kap-default'
        }).select().single();

        if (instErr) {
            console.error('Failed to create institute:', instErr);
            return;
        }
        instituteId = newInst.id;
    } else {
        instituteId = instCheck[0].id;
    }

    // Check if user is in 'users' table
    const { data: userCheck } = await supabase.from('users').select('id').eq('id', userId);

    if (!userCheck || userCheck.length === 0) {
        console.log('Inserting user profile into DB...');
        const { error: dbError } = await supabase.from('users').insert({
            id: userId,
            email: email,
            name: 'KAP Admin',
            role: 'ADMIN',
            institute_id: instituteId,
            is_active: true
        });

        if (dbError) {
            console.error('Failed to create db user profile:', dbError);
            return;
        }
    } else {
        console.log('Updating existing user profile to ADMIN...');
        await supabase.from('users').update({
            role: 'ADMIN',
            institute_id: instituteId
        }).eq('id', userId);
    }

    console.log('\n--- SUCCESS ---');
    console.log(`Login Email: ${email}`);
    console.log(`Login Password: ${password}`);
    console.log('-----------------\n');
}

setupAdmin();
