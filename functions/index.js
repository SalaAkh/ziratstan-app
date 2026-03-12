const { onRequest } = require('firebase-functions/v2/https');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let adminDb = null;

function getAdminDb() {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return null;
    }

    if (!adminDb) {
        adminDb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }

    return adminDb;
}

function sendJson(res, status, payload) {
    res.status(status).json(payload);
}

function parseJwtPayload(token) {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    } catch (_error) {
        return {};
    }
}

function getRoutePath(req) {
    const pathname = new URL(req.originalUrl || req.url, 'https://ziratstan.local').pathname;
    return pathname.replace(/^\/+/, '').replace(/^api\/?/, '');
}

async function requireAdmin(req) {
    const db = getAdminDb();

    if (!db) {
        const error = new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
        error.statusCode = 500;
        throw error;
    }

    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
        const error = new Error('Missing bearer token');
        error.statusCode = 401;
        throw error;
    }

    const token = authHeader.slice('Bearer '.length);
    const { data, error } = await db.auth.getUser(token);

    if (error || !data?.user) {
        const authError = new Error('Invalid admin session');
        authError.statusCode = 401;
        throw authError;
    }

    if (data.user.app_metadata?.role !== 'admin') {
        const roleError = new Error('Admin role required');
        roleError.statusCode = 403;
        throw roleError;
    }

    const claims = parseJwtPayload(token);
    if (claims.aal !== 'aal2') {
        const mfaError = new Error('Second factor required');
        mfaError.statusCode = 403;
        throw mfaError;
    }

    return data.user;
}

async function handleBootstrap(req, res) {
    await requireAdmin(req);
    const db = getAdminDb();

    const [namesRes, profilesRes, biosRes] = await Promise.all([
        db.from('ugc_submissions').select('*').order('submitted_at', { ascending: false }).limit(100),
        db.from('ugc_profile_submissions').select('*').order('submitted_at', { ascending: false }).limit(100),
        db.from('ugc_bio_submissions').select('*').order('submitted_at', { ascending: false }).limit(100),
    ]);

    if (namesRes.error || profilesRes.error || biosRes.error) {
        throw namesRes.error || profilesRes.error || biosRes.error;
    }

    sendJson(res, 200, {
        names: namesRes.data || [],
        profiles: profilesRes.data || [],
        bios: biosRes.data || [],
    });
}

async function handleProfilesGet(req, res) {
    await requireAdmin(req);
    const db = getAdminDb();

    const { data, error } = await db
        .from('profiles')
        .select('id, first_name, last_name, birth_date, death_date, created_at, epitaph, cemeteries(name)')
        .order('created_at', { ascending: false })
        .limit(300);

    if (error) {
        throw error;
    }

    sendJson(res, 200, { items: data || [] });
}

async function handleProfilesPost(req, res) {
    await requireAdmin(req);
    const db = getAdminDb();

    const body = req.body || {};
    if (!body.first_name || !String(body.first_name).trim()) {
        return sendJson(res, 400, { error: 'first_name is required' });
    }

    const payload = {
        first_name: String(body.first_name).trim(),
        last_name: body.last_name ? String(body.last_name).trim() : null,
        birth_date: body.birth_year ? `${body.birth_year}-01-01` : null,
        death_date: body.death_year ? `${body.death_year}-01-01` : null,
        biography: body.biography ? String(body.biography).trim() : null,
        visibility_status: 'public',
    };

    const { data, error } = await db.from('profiles').insert([payload]).select('id').single();

    if (error) {
        throw error;
    }

    sendJson(res, 200, { item: data });
}

async function handleStatusPost(req, res) {
    await requireAdmin(req);
    const db = getAdminDb();

    const tableMap = {
        names: 'ugc_submissions',
        profiles: 'ugc_profile_submissions',
        bios: 'ugc_bio_submissions',
    };

    const { type, id, status } = req.body || {};
    const table = tableMap[type];

    if (!table || !id || !['approved', 'rejected'].includes(status)) {
        return sendJson(res, 400, { error: 'Invalid payload' });
    }

    const { error } = await db.from(table).update({ status }).eq('id', id);

    if (error) {
        throw error;
    }

    sendJson(res, 200, { ok: true });
}

exports.api = onRequest({ cors: true }, async (req, res) => {
    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    try {
        const route = getRoutePath(req);

        if (route === 'admin/bootstrap' && req.method === 'GET') {
            return await handleBootstrap(req, res);
        }

        if (route === 'admin/profiles' && req.method === 'GET') {
            return await handleProfilesGet(req, res);
        }

        if (route === 'admin/profiles' && req.method === 'POST') {
            return await handleProfilesPost(req, res);
        }

        if (route === 'admin/status' && req.method === 'POST') {
            return await handleStatusPost(req, res);
        }

        return sendJson(res, 404, { error: 'Not found' });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        return sendJson(res, statusCode, { error: error.message || 'Internal server error' });
    }
});
