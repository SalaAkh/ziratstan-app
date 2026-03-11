const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://myxswvzzotieygqnecbi.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
}

if (!ADMIN_EMAIL) {
    console.error('Missing ADMIN_EMAIL.');
    process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function findUserByEmail(email) {
    let page = 1;

    while (true) {
        const { data, error } = await adminClient.auth.admin.listUsers({
            page,
            perPage: 200,
        });

        if (error) {
            throw error;
        }

        const users = data?.users || [];
        const existingUser = users.find((user) => (user.email || '').toLowerCase() === email);

        if (existingUser) {
            return existingUser;
        }

        if (users.length < 200) {
            return null;
        }

        page += 1;
    }
}

async function main() {
    const existingUser = await findUserByEmail(ADMIN_EMAIL);

    if (existingUser) {
        const { error } = await adminClient.auth.admin.updateUserById(existingUser.id, {
            email_confirm: true,
            user_metadata: {
                ...(existingUser.user_metadata || {}),
                role: 'admin',
            },
        });

        if (error) {
            throw error;
        }

        console.log(`Admin user already existed and was updated: ${ADMIN_EMAIL}`);
        return;
    }

    const { error } = await adminClient.auth.admin.createUser({
        email: ADMIN_EMAIL,
        email_confirm: true,
        user_metadata: {
            role: 'admin',
        },
    });

    if (error) {
        throw error;
    }

    console.log(`Admin user created: ${ADMIN_EMAIL}`);
}

main().catch((error) => {
    console.error('Failed to register admin email:', error.message || error);
    process.exit(1);
});
