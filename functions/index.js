const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { createClient } = require('@supabase/supabase-js');

// Firebase Functions v2 secrets must be declared and attached to the function to be available at runtime.
const SUPABASE_URL_SECRET = defineSecret('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY_SECRET = defineSecret('SUPABASE_SERVICE_ROLE_KEY');

let adminDb = null;

function getSupabaseUrl() {
    return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}

function getServiceRoleKey() {
    return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

function getAdminDb() {
    const SUPABASE_URL = getSupabaseUrl();
    const SUPABASE_SERVICE_ROLE_KEY = getServiceRoleKey();

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

function setCorsHeaders(req, res) {
    const origin = req.headers.origin || '*';
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Max-Age', '3600');
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

function toSafeString(value, maxLen) {
    if (value === undefined || value === null) return null;
    const s = String(value).trim();
    if (!s) return null;
    if (maxLen && s.length > maxLen) return s.slice(0, maxLen);
    return s;
}

function toSafeNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

function toSafeYearDate(value) {
    const raw = toSafeString(value, 20);
    if (!raw) return null;
    const match = raw.match(/\d{4}/);
    if (!match) return null;
    return `${match[0]}-01-01`;
}

function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''));
}

const DEFAULT_PROFILE_CATEGORY = 'shezhire';
const PROFILE_CATEGORY_VALUES = new Set([
    'shezhire',
    'historical',
    'military',
    'religious',
    'educator',
    'culture',
    'public_figure',
    'other',
]);

function toSafeProfileCategory(value, { allowNull = false } = {}) {
    const raw = toSafeString(value, 60);
    if (!raw) {
        return allowNull ? null : DEFAULT_PROFILE_CATEGORY;
    }
    const normalized = String(raw).toLowerCase().trim().replace(/\s+/g, '_');
    return PROFILE_CATEGORY_VALUES.has(normalized) ? normalized : null;
}

function isMissingColumnError(error, columnName) {
    const message = error?.message ? String(error.message) : '';
    return Boolean(columnName) && (message.includes(columnName) || message.includes(`"${columnName}"`));
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

async function handlePublicUgcName(req, res) {
    const db = getAdminDb();
    if (!db) return sendJson(res, 500, { error: 'Server is not configured' });

    const body = req.body || {};
    const payload = {
        cemetery_id: toSafeString(body.cemetery_id ?? body.cemeteryId, 120),
        current_name: toSafeString(body.current_name ?? body.currentName, 200),
        suggested_name: toSafeString(body.suggested_name ?? body.suggestedName, 200),
        lat: toSafeNumber(body.lat),
        lng: toSafeNumber(body.lng),
        comment: toSafeString(body.comment, 500),
        status: 'pending',
        submitted_at: new Date().toISOString(),
    };

    if (!payload.suggested_name) {
        return sendJson(res, 400, { error: 'Invalid payload' });
    }

    const { error } = await db.from('ugc_submissions').insert([payload]);
    if (error) throw error;
    return sendJson(res, 200, { ok: true });
}

async function handlePublicServicesLead(req, res) {
    const db = getAdminDb();
    if (!db) return sendJson(res, 500, { error: 'Server is not configured' });

    const body = req.body || {};
    const payload = {
        service_type: toSafeString(body.service_type, 80),
        customer_name: toSafeString(body.customer_name, 120),
        customer_phone: toSafeString(body.customer_phone, 60),
        profile_ref: toSafeString(body.profile_ref, 80),
        comment: toSafeString(body.comment, 500),
        price: toSafeNumber(body.price),
        submitted_at: new Date().toISOString(),
    };

    if (!payload.service_type || !payload.customer_name || !payload.customer_phone || payload.price === null) {
        return sendJson(res, 400, { error: 'Invalid payload' });
    }

    const { error } = await db.from('services_leads').insert([payload]);
    if (error) throw error;
    return sendJson(res, 200, { ok: true });
}

async function handlePublicUgcProfile(req, res) {
    const db = getAdminDb();
    if (!db) return sendJson(res, 500, { error: 'Server is not configured' });

    const body = req.body || {};
    const ownerId = toSafeString(body.owner_id ?? body.ownerId, 80);
    const payload = {
        cemetery_id: toSafeString(body.cemeteryId, 80),
        cemetery_name: toSafeString(body.cemeteryName, 200),
        lat: toSafeNumber(body.lat),
        lng: toSafeNumber(body.lng),
        full_name: toSafeString(body.fullName, 200),
        birth_year: toSafeString(body.birth, 10),
        death_year: toSafeString(body.death, 10),
        description: toSafeString(body.description, 1000),
        profile_category: toSafeProfileCategory(body.profile_category ?? body.profileCategory, { allowNull: true }) || DEFAULT_PROFILE_CATEGORY,
        owner_id: isUuid(ownerId) ? ownerId : null,
        status: 'pending',
        submitted_at: new Date().toISOString(),
    };

    if (!payload.full_name || payload.lat === null || payload.lng === null) {
        return sendJson(res, 400, { error: 'Invalid payload' });
    }

    let { error } = await db.from('ugc_profile_submissions').insert([payload]);
    if (error && isMissingColumnError(error, 'profile_category')) {
        delete payload.profile_category;
        const retry = await db.from('ugc_profile_submissions').insert([payload]);
        error = retry.error || null;
    }
    if (error) throw error;
    return sendJson(res, 200, { ok: true });
}

async function handlePublicUgcBio(req, res) {
    const db = getAdminDb();
    if (!db) return sendJson(res, 500, { error: 'Server is not configured' });

    const body = req.body || {};
    const payload = {
        profile_id: toSafeString(body.profileId, 80),
        author_name: toSafeString(body.authorName, 120),
        bio_text: toSafeString(body.text, 3000),
        status: 'pending',
        submitted_at: new Date().toISOString(),
    };

    if (!payload.profile_id || !payload.bio_text) {
        return sendJson(res, 400, { error: 'Invalid payload' });
    }

    const { error } = await db.from('ugc_bio_submissions').insert([payload]);
    if (error) throw error;
    return sendJson(res, 200, { ok: true });
}

async function handlePublicVipProfiles(req, res) {
    const db = getAdminDb();
    if (!db) return sendJson(res, 500, { error: 'Server is not configured' });

    const { data, error } = await db
        .from('profiles')
        .select('id, first_name, last_name, patronymic, birth_date, death_date, epitaph, biography, main_photo_url, cemetery_id, location')
        .eq('visibility_status', 'public')
        .limit(2000);

    if (error) throw error;

    const items = (data || []).map((p) => ({
        id: p.id,
        name: [p.last_name, p.first_name, p.patronymic].filter(Boolean).join(' '),
        birth: p.birth_date ? String(p.birth_date).substring(0, 4) : '?',
        death: p.death_date ? String(p.death_date).substring(0, 4) : '?',
        cemetery: p.cemetery_id || 'Неизвестно',
        city: '',
        filter: 'historical',
        lat: p.location ? p.location.coordinates[1] : null,
        lng: p.location ? p.location.coordinates[0] : null,
        photo: p.main_photo_url || '',
        bio: p.biography || '',
        epitaph: p.epitaph || '',
    })).filter((p) => p.lat && p.lng);

    return sendJson(res, 200, { items });
}

async function handlePublicProfile(req, res) {
    const db = getAdminDb();
    if (!db) return sendJson(res, 500, { error: 'Server is not configured' });

    const id = String(req.query?.id || '').trim();
    if (!isUuid(id)) return sendJson(res, 400, { error: 'Invalid id' });

    const { data, error } = await db
        .from('profiles')
        .select('*, cemetery:cemeteries(name, city)')
        .eq('id', id)
        .eq('visibility_status', 'public')
        .maybeSingle();

    if (error) throw error;
    if (!data) return sendJson(res, 404, { error: 'Not found' });

    const item = {
        id: data.id,
        fullName: [data.last_name, data.first_name, data.patronymic].filter(Boolean).join(' '),
        name: data.first_name,
        lastName: data.last_name,
        birth: data.birth_date ? String(data.birth_date).substring(0, 4) : '?',
        death: data.death_date ? String(data.death_date).substring(0, 4) : '?',
        cemetery: data.cemetery?.name || 'Неизвестно',
        city: data.cemetery?.city || '',
        photo: data.main_photo_url || '',
        bio: data.biography || '',
        epitaph: data.epitaph || '',
        filter: 'historical',
    };

    return sendJson(res, 200, { item });
}

async function handlePublicFamily(req, res) {
    const db = getAdminDb();
    if (!db) return sendJson(res, 500, { error: 'Server is not configured' });

    const profileId = String(req.query?.profileId || '').trim();
    if (!isUuid(profileId)) return sendJson(res, 400, { error: 'Invalid profileId' });

    // Only expose relations for public profiles.
    const { data: profile, error: profileError } = await db
        .from('profiles')
        .select('id')
        .eq('id', profileId)
        .eq('visibility_status', 'public')
        .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) return sendJson(res, 404, { error: 'Not found' });

    const { data, error } = await db
        .from('profile_relations')
        .select('relation_type, profile_id_2, profiles!profile_relations_profile_id_2_fkey(id, first_name, last_name, birth_date, death_date, main_photo_url)')
        .eq('profile_id_1', profileId);

    if (error) throw error;
    return sendJson(res, 200, { items: data || [] });
}

async function handlePublicQrResolve(req, res) {
    const db = getAdminDb();
    if (!db) return sendJson(res, 500, { error: 'Server is not configured' });

    const slug = String(req.query?.slug || '').trim().toUpperCase();
    if (!slug || slug.length > 32) return sendJson(res, 400, { error: 'Invalid slug' });

    const { data, error } = await db
        .from('qr_codes')
        .select('id, slug, profile_id, status, scan_count')
        .eq('slug', slug)
        .eq('status', 'active')
        .maybeSingle();

    if (error) throw error;
    if (!data) return sendJson(res, 404, { error: 'Not found' });

    // Fire-and-forget atomic increment via SQL function.
    db.rpc('increment_qr_scan_count', { p_qr_id: data.id })
        .then(() => { })
        .catch(() => { });

    return sendJson(res, 200, { item: data });
}

async function handlePublicQrByProfile(req, res) {
    const db = getAdminDb();
    if (!db) return sendJson(res, 500, { error: 'Server is not configured' });

    const profileId = String(req.query?.profileId || '').trim();
    if (!isUuid(profileId)) return sendJson(res, 400, { error: 'Invalid profileId' });

    const { data, error } = await db
        .from('qr_codes')
        .select('id, slug, scan_count, status, activated_at')
        .eq('profile_id', profileId)
        .eq('status', 'active')
        .maybeSingle();

    if (error) throw error;
    return sendJson(res, 200, { item: data || null });
}

async function handlePublicProfileIdBySlug(req, res) {
    const db = getAdminDb();
    if (!db) return sendJson(res, 500, { error: 'Server is not configured' });

    const slug = String(req.query?.slug || '').trim();
    if (!slug || slug.length > 64) return sendJson(res, 400, { error: 'Invalid slug' });

    if (isUuid(slug)) {
        return sendJson(res, 200, { item: slug });
    }

    const normalizedSlug = slug.toUpperCase();
    const { data, error } = await db
        .from('qr_codes')
        .select('profile_id, status')
        .eq('slug', normalizedSlug)
        .maybeSingle();

    if (error) throw error;
    if (!data || data.status !== 'active') {
        return sendJson(res, 200, { item: null });
    }

    return sendJson(res, 200, { item: data.profile_id });
}

async function handleBootstrap(req, res) {
    await requireAdmin(req);
    const db = getAdminDb();

    const [namesRes, profilesRes, biosRes] = await Promise.all([
        db.from('ugc_submissions').select('*').order('submitted_at', { ascending: false, nullsFirst: false }).limit(100),
        db.from('ugc_profile_submissions').select('*').order('submitted_at', { ascending: false, nullsFirst: false }).limit(100),
        db.from('ugc_bio_submissions').select('*').order('submitted_at', { ascending: false, nullsFirst: false }).limit(100),
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

    let { data, error } = await db
        .from('profiles')
        .select('id, first_name, last_name, birth_date, death_date, created_at, epitaph, profile_category, cemeteries(name)')
        .order('created_at', { ascending: false })
        .limit(300);

    if (error && isMissingColumnError(error, 'profile_category')) {
        const fallback = await db
            .from('profiles')
            .select('id, first_name, last_name, birth_date, death_date, created_at, epitaph, cemeteries(name)')
            .order('created_at', { ascending: false })
            .limit(300);
        data = fallback.data;
        error = fallback.error;
    }

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
        profile_category: toSafeProfileCategory(body.profile_category, { allowNull: true }) || DEFAULT_PROFILE_CATEGORY,
        visibility_status: 'public',
    };

    let { data, error } = await db.from('profiles').insert([payload]).select('id').single();
    if (error && isMissingColumnError(error, 'profile_category')) {
        const fallbackPayload = { ...payload };
        delete fallbackPayload.profile_category;
        const retry = await db.from('profiles').insert([fallbackPayload]).select('id').single();
        data = retry.data;
        error = retry.error;
    }

    if (error) {
        throw error;
    }

    sendJson(res, 200, { item: data });
}

async function handleStatusPost(req, res) {
    const adminUser = await requireAdmin(req);
    const db = getAdminDb();

    const tableMap = {
        names: 'ugc_submissions',
        profiles: 'ugc_profile_submissions',
        bios: 'ugc_bio_submissions',
    };

    const { type, id, status } = req.body || {};
    const table = tableMap[type];

    if (!table || !id || !['approved', 'rejected', 'pending'].includes(status)) {
        return sendJson(res, 400, { error: 'Invalid payload' });
    }

    if (type === 'profiles' && status === 'approved') {
        const fetchSubmission = async (fields) => db
            .from('ugc_profile_submissions')
            .select(fields.join(', '))
            .eq('id', id)
            .maybeSingle();
        let submissionFields = [
            'id',
            'full_name',
            'birth_year',
            'death_year',
            'description',
            'lat',
            'lng',
            'cemetery_id',
            'owner_id',
            'profile_category',
            'published_profile_id',
        ];
        let hasPublishedIdColumn = true;
        let hasProfileCategoryColumn = true;
        let subRes = await fetchSubmission(submissionFields);
        if (subRes.error && isMissingColumnError(subRes.error, 'published_profile_id')) {
            hasPublishedIdColumn = false;
            submissionFields = submissionFields.filter((field) => field !== 'published_profile_id');
            subRes = await fetchSubmission(submissionFields);
        }
        if (subRes.error && isMissingColumnError(subRes.error, 'profile_category')) {
            hasProfileCategoryColumn = false;
            submissionFields = submissionFields.filter((field) => field !== 'profile_category');
            subRes = await fetchSubmission(submissionFields);
        }

        if (subRes.error) throw subRes.error;
        if (!subRes.data) return sendJson(res, 404, { error: 'Submission not found' });

        const submission = subRes.data;
        let publishedProfileId = submission.published_profile_id || null;
        const lat = toSafeNumber(submission.lat);
        const lng = toSafeNumber(submission.lng);
        const ownerId = isUuid(submission.owner_id)
            ? submission.owner_id
            : (isUuid(adminUser?.id) ? adminUser.id : null);
        const submissionProfileCategory = hasProfileCategoryColumn
            ? (toSafeProfileCategory(submission.profile_category, { allowNull: true }) || DEFAULT_PROFILE_CATEGORY)
            : DEFAULT_PROFILE_CATEGORY;

        if (publishedProfileId && isUuid(publishedProfileId)) {
            const existingProfile = await db
                .from('profiles')
                .select('id, owner_id')
                .eq('id', publishedProfileId)
                .maybeSingle();

            if (existingProfile.error) throw existingProfile.error;

            if (existingProfile.data) {
                const profilePatch = { visibility_status: 'private' };
                if (!existingProfile.data.owner_id && ownerId) {
                    profilePatch.owner_id = ownerId;
                }

                const syncProfile = await db
                    .from('profiles')
                    .update(profilePatch)
                    .eq('id', publishedProfileId);

                if (syncProfile.error) throw syncProfile.error;
            } else {
                // Stale reference: recreate profile and relink submission.
                publishedProfileId = null;
            }
        }

        if (!publishedProfileId) {
            const profilePayload = {
                first_name: toSafeString(submission.full_name, 100) || 'Unknown',
                last_name: null,
                patronymic: null,
                birth_date: toSafeYearDate(submission.birth_year),
                death_date: toSafeYearDate(submission.death_year),
                biography: toSafeString(submission.description, 4000),
                profile_category: submissionProfileCategory,
                visibility_status: 'private',
                owner_id: ownerId,
                cemetery_id: isUuid(submission.cemetery_id) ? submission.cemetery_id : null,
                location: (lng !== null && lat !== null) ? `SRID=4326;POINT(${lng} ${lat})` : null,
            };

            let created = await db.from('profiles').insert([profilePayload]).select('id').single();
            if (created.error && isMissingColumnError(created.error, 'profile_category')) {
                const fallbackPayload = { ...profilePayload };
                delete fallbackPayload.profile_category;
                created = await db.from('profiles').insert([fallbackPayload]).select('id').single();
            }
            if (created.error) throw created.error;
            publishedProfileId = created.data?.id || null;
        }

        const updatePayload = hasPublishedIdColumn
            ? { status, published_profile_id: publishedProfileId }
            : { status };

        const updated = await db.from('ugc_profile_submissions').update(updatePayload).eq('id', id);
        if (updated.error) throw updated.error;

        return sendJson(res, 200, { ok: true, profile_id: publishedProfileId });
    }

    const { error } = await db.from(table).update({ status }).eq('id', id);

    if (error) {
        throw error;
    }

    sendJson(res, 200, { ok: true });
}

exports.api = onRequest(
    {
        secrets: [SUPABASE_URL_SECRET, SUPABASE_SERVICE_ROLE_KEY_SECRET],
    },
    async (req, res) => {
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }

    try {
        const route = getRoutePath(req);

        if (route === 'public/ugc/name' && req.method === 'POST') {
            return await handlePublicUgcName(req, res);
        }

        if (route === 'public/ugc/profile' && req.method === 'POST') {
            return await handlePublicUgcProfile(req, res);
        }

        if (route === 'public/ugc/bio' && req.method === 'POST') {
            return await handlePublicUgcBio(req, res);
        }

        if (route === 'public/services/lead' && req.method === 'POST') {
            return await handlePublicServicesLead(req, res);
        }

        if (route === 'public/vip-profiles' && req.method === 'GET') {
            return await handlePublicVipProfiles(req, res);
        }

        if (route === 'public/profile' && req.method === 'GET') {
            return await handlePublicProfile(req, res);
        }

        if (route === 'public/family' && req.method === 'GET') {
            return await handlePublicFamily(req, res);
        }

        if (route === 'public/qr/resolve' && req.method === 'GET') {
            return await handlePublicQrResolve(req, res);
        }

        if (route === 'public/qr/by-profile' && req.method === 'GET') {
            return await handlePublicQrByProfile(req, res);
        }

        if (route === 'public/profile-id-by-slug' && req.method === 'GET') {
            return await handlePublicProfileIdBySlug(req, res);
        }

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
