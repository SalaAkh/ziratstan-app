require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://myxswvzzotieygqnecbi.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Error: Please set SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createAdmin() {
    const email = 'admin@ziratstan.kz';
    const password = 'adminpassword123'; // Temporary password

    console.log(`Checking if user ${email} exists...`);
    
    // Check if user already exists
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
        console.error('Error listing users:', usersError.message);
        return;
    }
    
    const existingUser = usersData.users.find(u => u.email === email);
    
    if (existingUser) {
        console.log(`User ${email} already exists. Updating password...`);
        const { data, error } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: password }
        );
        if (error) {
            console.error('Error updating password:', error.message);
        } else {
            console.log(`Successfully updated password for ${email}. Login with: ${password}`);
        }
        return;
    }

    console.log(`Creating user ${email}...`);
    const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true 
    });

    if (error) {
        console.error('Error creating user:', error.message);
    } else {
        console.log(`Successfully created admin user!`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log('You can now log in to the admin panel.');
    }
}

createAdmin();
