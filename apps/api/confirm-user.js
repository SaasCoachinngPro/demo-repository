require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function confirmEmail() {
    console.log("Fetching users...");
    const { data: users, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error("Error fetching users:", error);
        return;
    }

    const user = users.users.find(u => u.email === 'adityasdhondge04@gmail.com');
    if (user) {
        console.log("Found user, confirming email...");
        const { data, error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { email_confirm: true }
        );
        if (updateError) {
            console.error("Update error:", updateError);
        } else {
            console.log('User confirmed successfully at:', data.user.email_confirmed_at);
        }
    } else {
        console.log("User adityasdhondge04@gmail.com not found!");
    }
}

confirmEmail();
