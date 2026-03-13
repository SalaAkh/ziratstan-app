// ------------------------------------------------------------
// ADMIN PANEL LOGIC - src/js/admin.js
// ------------------------------------------------------------

let currentTab = 'names';
let allData = { names: [], profiles: [], bios: [], leads: [], manage: [], sessions: [] };
let hasLoadedDashboard = false;

const ADMIN_EMAIL_STORAGE_KEY = 'ziratstan_admin_email';
const MFA_FACTOR_NAME = 'Ziratstan Admin';
const ADMIN_DEVICE_ID_STORAGE_KEY = 'ziratstan_admin_device_id';
const ADMIN_SESSION_TRACK_ID_KEY = 'ziratstan_admin_session_track_id';
const ADMIN_SESSION_DEADLINE_KEY = 'ziratstan_admin_session_deadline';
const ADMIN_SESSION_TIMEOUT_MS = 15 * 60 * 1000;
const ADMIN_SESSION_HEARTBEAT_MS = 60 * 1000;
const ADMIN_ACTIVE_SESSION_WINDOW_MS = 17 * 60 * 1000;

let pendingMfa = null;
let authFlowId = 0;
let authSyncQueue = Promise.resolve();
let sessionDeadlineTimer = null;
let sessionHeartbeatTimer = null;
let currentSessionTrackId = null;
let remoteSignOutInProgress = false;

const AUTH_RETRY_DELAY_MS = 120;
const AUTH_RETRY_MAX_ATTEMPTS = 3;

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isSupabaseLockAbortError(error) {
    const message = (error && error.message) ? String(error.message) : '';
    const name = (error && error.name) ? String(error.name) : '';

    return name === 'AbortError'
        && (message.includes('Lock broken by another request')
            || message.includes('was not released within 5000ms'));
}

function isTransientNetworkAuthError(error) {
    const name = (error && error.name) ? String(error.name) : '';
    const message = (error && error.message) ? String(error.message) : '';

    return (name === 'TypeError' && message.includes('Failed to fetch'))
        || message.includes('NetworkError')
        || message.includes('ERR_CONNECTION_')
        || message.includes('Load failed');
}

function toAuthUiErrorMessage(error, fallbackMessage) {
    if (isTransientNetworkAuthError(error)) {
        return 'Network connection to Supabase failed. Check VPN/proxy/antivirus and try again.';
    }

    return (error && error.message) ? error.message : fallbackMessage;
}

async function withAuthRetry(fn) {
    let attempt = 0;

    while (attempt < AUTH_RETRY_MAX_ATTEMPTS) {
        try {
            return await fn();
        } catch (error) {
            attempt += 1;
            const shouldRetry = isSupabaseLockAbortError(error) || isTransientNetworkAuthError(error);
            if (!shouldRetry || attempt >= AUTH_RETRY_MAX_ATTEMPTS) {
                throw error;
            }

            await delay(AUTH_RETRY_DELAY_MS * attempt);
        }
    }
}

function queueAuthSync(session) {
    authSyncQueue = authSyncQueue
        .catch(() => {})
        .then(() => syncAuthUI(session));

    return authSyncQueue;
}

function getOrCreateDeviceId() {
    const existing = localStorage.getItem(ADMIN_DEVICE_ID_STORAGE_KEY);
    if (existing) {
        return existing;
    }

    const generated = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(ADMIN_DEVICE_ID_STORAGE_KEY, generated);
    return generated;
}

function buildDeviceName() {
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || 'unknown-platform';
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    const browser = ua.includes('Edg/')
        ? 'Edge'
        : ua.includes('Chrome/')
            ? 'Chrome'
            : ua.includes('Firefox/')
                ? 'Firefox'
                : ua.includes('Safari/')
                    ? 'Safari'
                    : 'Browser';

    return `${browser} / ${platform}${isMobile ? ' / mobile' : ' / desktop'}`;
}

function clearSessionTimers() {
    if (sessionDeadlineTimer) {
        clearTimeout(sessionDeadlineTimer);
        sessionDeadlineTimer = null;
    }

    if (sessionHeartbeatTimer) {
        clearInterval(sessionHeartbeatTimer);
        sessionHeartbeatTimer = null;
    }
}

function clearSessionTrackingState() {
    clearSessionTimers();
    currentSessionTrackId = null;
    localStorage.removeItem(ADMIN_SESSION_TRACK_ID_KEY);
    localStorage.removeItem(ADMIN_SESSION_DEADLINE_KEY);
}

function getOrCreateSessionTrackId() {
    if (currentSessionTrackId) {
        return currentSessionTrackId;
    }

    const existing = localStorage.getItem(ADMIN_SESSION_TRACK_ID_KEY);
    if (existing) {
        currentSessionTrackId = existing;
        return existing;
    }

    const generated = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    currentSessionTrackId = generated;
    localStorage.setItem(ADMIN_SESSION_TRACK_ID_KEY, generated);
    return generated;
}

async function touchAdminSession(reason = null) {
    const session = await withAuthRetry(() => getSession());
    if (!session?.user?.id) {
        return;
    }

    const nowIso = new Date().toISOString();
    const trackId = getOrCreateSessionTrackId();
    const basePayload = {
        track_id: trackId,
        user_id: session.user.id,
        email: session.user.email || null,
        device_id: getOrCreateDeviceId(),
        device_name: buildDeviceName(),
        user_agent: (navigator.userAgent || '').slice(0, 512),
        last_seen_at: nowIso,
    };

    const existing = await withAuthRetry(() => db
        .from('admin_sessions')
        .select('id, ended_at, end_reason')
        .eq('track_id', trackId)
        .maybeSingle());

    if (existing.error) {
        if (isTableNotFoundError(existing.error)) {
            console.warn('[Ziratstan] admin_sessions table not found — session tracking disabled.');
            return;
        }
        if (isRlsDeniedError(existing.error)) {
            throw createAdminRoleRequiredError();
        }
        throw existing.error;
    }

    if (!existing.data) {
        const insertPayload = {
            ...basePayload,
            started_at: nowIso,
            ended_at: null,
            end_reason: null,
        };

        const insertRes = await withAuthRetry(() => db.from('admin_sessions').insert([insertPayload]));
        if (insertRes.error) {
            if (isTableNotFoundError(insertRes.error)) {
                return;
            }
            if (isRlsDeniedError(insertRes.error)) {
                throw createAdminRoleRequiredError();
            }
            throw insertRes.error;
        }
        return;
    }

    if (!reason && existing.data.ended_at) {
        const error = new Error('Session terminated from another device');
        error.code = 'SESSION_TERMINATED';
        throw error;
    }

    const updatePayload = reason
        ? {
            ...basePayload,
            ended_at: nowIso,
            end_reason: reason,
        }
        : basePayload;

    const updateRes = await withAuthRetry(() => db
        .from('admin_sessions')
        .update(updatePayload)
        .eq('track_id', trackId));
    if (updateRes.error) {
        if (isTableNotFoundError(updateRes.error)) {
            return;
        }
        if (isRlsDeniedError(updateRes.error)) {
            throw createAdminRoleRequiredError();
        }
        throw updateRes.error;
    }
}


function isTableNotFoundError(error) {
    return error && (error.code === 'PGRST205' || error.code === '42P01' || (error.message && error.message.includes("Could not find the table")));
}

function isRlsDeniedError(error) {
    const message = error?.message ? String(error.message) : '';
    return error?.code === '42501' || message.toLowerCase().includes('row-level security policy');
}

function createAdminRoleRequiredError() {
    const error = new Error('Admin role is required for this account. Run scripts/register_admin_email.js and sign in again.');
    error.code = 'ADMIN_ROLE_REQUIRED';
    return error;
}

function isAdminRoleRequiredError(error) {
    return error && error.code === 'ADMIN_ROLE_REQUIRED';
}

function isAuthSessionMissingError(error) {
    if (!error) {
        return false;
    }

    const message = error.message ? String(error.message).toLowerCase() : '';
    const name = error.name ? String(error.name) : '';
    return name === 'AuthSessionMissingError' || message.includes('auth session missing');
}

async function ensureAdminRole(session) {
    if (!session?.user?.id) {
        return;
    }

    if (session.user.app_metadata?.role === 'admin') {
        return;
    }

    // Session claims can be stale right after role changes; fetch canonical user metadata.
    const userRes = await withAuthRetry(() => db.auth.getUser());
    if (userRes.error) {
        if (isAuthSessionMissingError(userRes.error)) {
            return;
        }
        throw userRes.error;
    }

    if (userRes.data?.user?.app_metadata?.role === 'admin') {
        return;
    }

    throw createAdminRoleRequiredError();
}

function isSessionTerminatedError(error) {
    return error && error.code === 'SESSION_TERMINATED';
}

async function closeAdminSession(reason = 'manual_logout') {
    try {
        await touchAdminSession(reason);
    } catch (error) {
        console.error('Failed to close admin session record:', error);
    } finally {
        clearSessionTrackingState();
    }
}

async function forceSignOutForTerminatedSession() {
    if (remoteSignOutInProgress) {
        return;
    }

    remoteSignOutInProgress = true;
    try {
        clearSessionTrackingState();
        await withAuthRetry(() => db.auth.signOut());
        showGate();
        showToast('Сессия завершена на другом устройстве.', 'error');
        showGateMessage('error', 'Эта сессия была завершена с другого устройства.');
    } finally {
        remoteSignOutInProgress = false;
    }
}

async function signOutForAdminRoleRequired(message = null) {
    try {
        await withAuthRetry(() => db.auth.signOut());
    } catch (signOutError) {
        console.error('Failed to sign out user without admin role:', signOutError);
    } finally {
        clearSessionTrackingState();
        showGate();
        showGateMessage('error', message || createAdminRoleRequiredError().message);
    }
}

function scheduleSessionDeadline() {
    const now = Date.now();
    let deadline = Number(localStorage.getItem(ADMIN_SESSION_DEADLINE_KEY) || 0);

    if (!deadline || Number.isNaN(deadline)) {
        deadline = now + ADMIN_SESSION_TIMEOUT_MS;
        localStorage.setItem(ADMIN_SESSION_DEADLINE_KEY, String(deadline));
    }

    if (deadline <= now) {
        setTimeout(async () => {
            showToast('Сессия истекла (15 минут). Выполнен выход.', 'error');
            await closeAdminSession('session_expired');
            await withAuthRetry(() => db.auth.signOut());
            showGate();
            showGateMessage('error', 'Сессия истекла. Войдите снова.');
        }, 0);
        return;
    }

    const msLeft = Math.max(0, deadline - now);
    sessionDeadlineTimer = setTimeout(async () => {
        showToast('Сессия истекла (15 минут). Выполнен выход.', 'error');
        await closeAdminSession('session_expired');
        await withAuthRetry(() => db.auth.signOut());
        showGate();
        showGateMessage('error', 'Сессия истекла. Войдите снова.');
    }, msLeft);
}

function startSessionHeartbeat() {
    sessionHeartbeatTimer = setInterval(() => {
        touchAdminSession(null).catch((error) => {
            if (isSessionTerminatedError(error)) {
                forceSignOutForTerminatedSession().catch((err) => {
                    console.error('Failed to sign out after remote termination:', err);
                });
                return;
            }
            if (isAdminRoleRequiredError(error) || isRlsDeniedError(error)) {
                const message = isAdminRoleRequiredError(error)
                    ? error.message
                    : createAdminRoleRequiredError().message;
                signOutForAdminRoleRequired(message);
                return;
            }

            console.error('Session heartbeat failed:', error);
        });
    }, ADMIN_SESSION_HEARTBEAT_MS);
}

async function startAdminSessionControls() {
    clearSessionTimers();
    await touchAdminSession(null);
    scheduleSessionDeadline();
    startSessionHeartbeat();
}

function getGateElements() {
    return {
        gate: document.getElementById('gate'),
        panel: document.getElementById('panel'),
        loginStep: document.getElementById('loginStep'),
        mfaStep: document.getElementById('mfaStep'),
        emailInput: document.getElementById('emailInput'),
        passwordInput: document.getElementById('passwordInput'),
        loginBtn: document.getElementById('loginBtn'),
        magicLinkBtn: document.getElementById('magicLinkBtn'),
        mfaTitle: document.getElementById('mfaTitle'),
        mfaText: document.getElementById('mfaText'),
        mfaQrWrap: document.getElementById('mfaQrWrap'),
        mfaQrImage: document.getElementById('mfaQrImage'),
        mfaSecretWrap: document.getElementById('mfaSecretWrap'),
        mfaSecret: document.getElementById('mfaSecret'),
        mfaCodeInput: document.getElementById('mfaCodeInput'),
        mfaVerifyBtn: document.getElementById('mfaVerifyBtn'),
        mfaCancelBtn: document.getElementById('mfaCancelBtn'),
        success: document.getElementById('gateSuccess'),
        error: document.getElementById('gateError'),
    };
}

function resetGateMessages() {
    const { success, error } = getGateElements();

    if (success) {
        success.style.display = 'none';
        success.textContent = '';
    }

    if (error) {
        error.style.display = 'none';
        error.textContent = '';
    }
}

function showGateMessage(type, message) {
    const { success, error } = getGateElements();
    resetGateMessages();

    if (type === 'success' && success) {
        success.textContent = message;
        success.style.display = 'block';
        return;
    }

    if (error) {
        error.textContent = message;
        error.style.display = 'block';
    }
}

function setLoginButtonState(isLoading) {
    const { loginBtn } = getGateElements();
    if (!loginBtn) {
        return;
    }

    loginBtn.disabled = isLoading;
    loginBtn.textContent = isLoading ? 'Входим...' : 'Войти';
}

function setMagicLinkButtonState(isLoading) {
    const { magicLinkBtn } = getGateElements();
    if (!magicLinkBtn) {
        return;
    }

    magicLinkBtn.disabled = isLoading;
    magicLinkBtn.textContent = isLoading ? 'Отправляем...' : 'Отправить Magic Link';
}

function setMfaButtonState(isLoading, label) {
    const { mfaVerifyBtn, mfaCancelBtn } = getGateElements();

    if (mfaVerifyBtn) {
        mfaVerifyBtn.disabled = isLoading;
        if (label) {
            mfaVerifyBtn.textContent = isLoading ? 'Проверяем...' : label;
        }
    }

    if (mfaCancelBtn) {
        mfaCancelBtn.disabled = isLoading;
    }
}

function getAdminRedirectUrl() {
    const currentPath = window.location.pathname || '';
    const isAdminPage = /(^|\/)admin\.html$/i.test(currentPath);
    const adminPath = isAdminPage ? currentPath : '/admin.html';
    return `${window.location.origin}${adminPath}`;
}

function cleanupAuthUrl() {
    const url = new URL(window.location.href);
    const hasAuthHash = url.hash.includes('access_token') || url.hash.includes('refresh_token');
    const hasAuthCode = url.searchParams.has('code');
    const hasAuthType = url.searchParams.has('type');
    const hasAuthError = url.searchParams.has('error') || url.searchParams.has('error_description');

    if (!hasAuthHash && !hasAuthCode && !hasAuthType && !hasAuthError) {
        return;
    }

    window.history.replaceState({}, document.title, getAdminRedirectUrl());
}

async function apiRequest(path, options = {}) {
    const session = await withAuthRetry(() => getSession());
    if (!session?.access_token) {
        const error = new Error('Admin session expired. Please sign in again.');
        error.statusCode = 401;
        throw error;
    }

    const method = (options.method || 'GET').toUpperCase();
    const body = options.body || {};
    const approverUserId = session?.user?.id || null;

    const toError = (message, statusCode = 500) => {
        const error = new Error(message);
        error.statusCode = statusCode;
        return error;
    };

    const throwIfError = (result, fallbackMessage, statusCode = 500) => {
        if (result?.error) {
            throw toError(result.error.message || fallbackMessage, statusCode);
        }
    };

    const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''));
    const toSafeYearDate = (value) => {
        const raw = value === null || value === undefined ? '' : String(value).trim();
        if (!raw) return null;
        const match = raw.match(/\d{4}/);
        return match ? `${match[0]}-01-01` : null;
    };
    const toFiniteNumber = (value) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : null;
    };

    if (path === '/admin/bootstrap' && method === 'GET') {
        const [namesRes, profilesRes, biosRes, leadsRes] = await Promise.all([
            db.from('ugc_submissions').select('*').order('submitted_at', { ascending: false }).limit(100),
            db.from('ugc_profile_submissions').select('*').order('submitted_at', { ascending: false }).limit(100),
            db.from('ugc_bio_submissions').select('*').order('submitted_at', { ascending: false }).limit(100),
            db.from('services_leads').select('*').order('submitted_at', { ascending: false }).limit(100),
        ]);

        throwIfError(namesRes, 'Failed to load name submissions');
        throwIfError(profilesRes, 'Failed to load profile submissions');
        throwIfError(biosRes, 'Failed to load biography submissions');
        throwIfError(leadsRes, 'Failed to load service leads');

        return {
            names: namesRes.data || [],
            profiles: profilesRes.data || [],
            bios: biosRes.data || [],
            leads: leadsRes.data || [],
        };
    }

    if (path === '/admin/profiles' && method === 'GET') {
        const result = await db
            .from('profiles')
            .select('id, first_name, last_name, birth_date, death_date, created_at, epitaph, cemeteries(name)')
            .order('created_at', { ascending: false })
            .limit(300);

        throwIfError(result, 'Failed to load profiles');
        return { items: result.data || [] };
    }

    if (path === '/admin/profiles' && method === 'POST') {
        if (!body.first_name || !String(body.first_name).trim()) {
            throw toError('first_name is required', 400);
        }

        const payload = {
            first_name: String(body.first_name).trim(),
            last_name: body.last_name ? String(body.last_name).trim() : null,
            birth_date: body.birth_year ? `${body.birth_year}-01-01` : null,
            death_date: body.death_year ? `${body.death_year}-01-01` : null,
            biography: body.biography ? String(body.biography).trim() : null,
            visibility_status: 'public',
        };

        const result = await db.from('profiles').insert([payload]).select('id').single();
        throwIfError(result, 'Failed to create profile');
        return { item: result.data };
    }

    if (path === '/admin/status' && method === 'POST') {
        const tableMap = {
            names: 'ugc_submissions',
            profiles: 'ugc_profile_submissions',
            bios: 'ugc_bio_submissions',
            leads: 'services_leads',
        };

        const table = tableMap[body.type];
        if (!table || !body.id || !['approved', 'rejected', 'pending'].includes(body.status)) {
            throw toError('Invalid payload', 400);
        }

        if (body.type === 'profiles' && body.status === 'approved') {
            let subRes = await db
                .from('ugc_profile_submissions')
                .select('id, full_name, birth_year, death_year, description, lat, lng, cemetery_id, owner_id, published_profile_id')
                .eq('id', body.id)
                .maybeSingle();

            let hasPublishedIdColumn = true;
            if (subRes?.error && String(subRes.error.message || '').includes('published_profile_id')) {
                hasPublishedIdColumn = false;
                subRes = await db
                    .from('ugc_profile_submissions')
                    .select('id, full_name, birth_year, death_year, description, lat, lng, cemetery_id, owner_id')
                    .eq('id', body.id)
                    .maybeSingle();
            }

            throwIfError(subRes, 'Failed to load profile submission');
            if (!subRes.data) {
                throw toError('Submission not found', 404);
            }

            const submission = subRes.data;
            let publishedProfileId = submission.published_profile_id || null;

            if (!publishedProfileId) {
                const lng = toFiniteNumber(submission.lng);
                const lat = toFiniteNumber(submission.lat);
                const ownerId = isUuid(submission.owner_id)
                    ? submission.owner_id
                    : (isUuid(approverUserId) ? approverUserId : null);

                const createRes = await db.from('profiles').insert([{
                    first_name: (submission.full_name || '').trim() || 'Unknown',
                    last_name: null,
                    patronymic: null,
                    birth_date: toSafeYearDate(submission.birth_year),
                    death_date: toSafeYearDate(submission.death_year),
                    biography: submission.description ? String(submission.description).trim() : null,
                    visibility_status: 'public',
                    owner_id: ownerId,
                    cemetery_id: isUuid(submission.cemetery_id) ? submission.cemetery_id : null,
                    location: (lng !== null && lat !== null) ? `SRID=4326;POINT(${lng} ${lat})` : null,
                }]).select('id').single();

                throwIfError(createRes, 'Failed to publish approved profile');
                publishedProfileId = createRes.data?.id || null;
            }

            const updatePayload = hasPublishedIdColumn
                ? { status: body.status, published_profile_id: publishedProfileId }
                : { status: body.status };

            const updateRes = await db
                .from('ugc_profile_submissions')
                .update(updatePayload)
                .eq('id', body.id);

            throwIfError(updateRes, 'Failed to update status');
            return { ok: true, profile_id: publishedProfileId };
        }

        const result = await db.from(table).update({ status: body.status }).eq('id', body.id);
        throwIfError(result, 'Failed to update status');
        return { ok: true };
    }

    throw toError('Not found', 404);
}
function showPanel() {
    const { gate, panel } = getGateElements();

    if (gate) {
        gate.style.display = 'none';
    }

    if (panel) {
        panel.style.display = 'block';
    }

    if (!hasLoadedDashboard) {
        hasLoadedDashboard = true;
        loadAllData();
    }
}

function showLoginStep() {
    const { loginStep, mfaStep, emailInput, passwordInput, loginBtn, magicLinkBtn } = getGateElements();

    if (loginStep) {
        loginStep.style.display = 'block';
    }

    if (mfaStep) {
        mfaStep.style.display = 'none';
    }

    if (loginBtn) {
        loginBtn.style.display = 'block';
    }

    if (magicLinkBtn) {
        magicLinkBtn.style.display = 'block';
    }

    const savedEmail = localStorage.getItem(ADMIN_EMAIL_STORAGE_KEY);
    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
    }

    if (passwordInput) {
        passwordInput.value = '';
    }

    setLoginButtonState(false);
    setMagicLinkButtonState(false);
    setMfaButtonState(false);
}

function showMfaStep(config) {
    const {
        loginStep,
        mfaStep,
        mfaTitle,
        mfaText,
        mfaQrWrap,
        mfaQrImage,
        mfaSecretWrap,
        mfaSecret,
        mfaCodeInput,
        mfaVerifyBtn,
        mfaCancelBtn,
        loginBtn,
        magicLinkBtn,
    } = getGateElements();

    if (loginStep) {
        loginStep.style.display = 'none';
    }

    if (mfaStep) {
        mfaStep.style.display = 'block';
    }

    if (loginBtn) {
        loginBtn.style.display = 'none';
    }

    if (magicLinkBtn) {
        magicLinkBtn.style.display = 'none';
    }

    if (mfaTitle) {
        mfaTitle.textContent = config.title;
    }

    if (mfaText) {
        mfaText.textContent = config.text;
    }

    if (mfaQrWrap) {
        mfaQrWrap.style.display = config.qrCode ? 'block' : 'none';
    }

    if (mfaQrImage) {
        mfaQrImage.src = config.qrCode || '';
        mfaQrImage.alt = config.qrCode ? 'QR code for authenticator app' : '';
    }

    if (mfaSecretWrap) {
        mfaSecretWrap.style.display = config.secret ? 'block' : 'none';
    }

    if (mfaSecret) {
        mfaSecret.textContent = config.secret || '';
    }

    if (mfaVerifyBtn) {
        mfaVerifyBtn.textContent = config.buttonLabel || 'Подтвердить код';
    }

    if (mfaCancelBtn) {
        mfaCancelBtn.textContent = config.cancelLabel || 'Выйти';
    }

    if (mfaCodeInput) {
        mfaCodeInput.value = '';
        mfaCodeInput.focus();
    }

    setMfaButtonState(false, config.buttonLabel || 'Подтвердить код');
}

function showGate() {
    const { gate, panel } = getGateElements();

    if (gate) {
        gate.style.display = 'flex';
    }

    if (panel) {
        panel.style.display = 'none';
    }

    hasLoadedDashboard = false;
    pendingMfa = null;
    clearSessionTrackingState();
    showLoginStep();
}

function getMfaCode() {
    const { mfaCodeInput } = getGateElements();
    return (mfaCodeInput?.value || '').replace(/\s+/g, '');
}

async function getAuthenticatorAssuranceLevel() {
    const { data, error } = await withAuthRetry(() => db.auth.mfa.getAuthenticatorAssuranceLevel());
    if (error) {
        if (error.status === 404 || error.code === 404 || (error.message && error.message.includes('404'))) {
            console.warn('[Ziratstan] MFA (двухфакторная авторизация) отключена на сервере (404). Выполняется вход без MFA.');
            return { currentLevel: 'aal2', nextLevel: 'aal2' };
        }
        throw error;
    }

    return data || { currentLevel: null, nextLevel: null };
}

async function getVerifiedTotpFactor() {
    const { data, error } = await withAuthRetry(() => db.auth.mfa.listFactors());
    if (error) {
        if (error.status === 404 || error.code === 404 || (error.message && error.message.includes('404'))) {
            return null;
        }
        throw error;
    }

    return data?.totp?.[0] || null;
}

async function cleanupUnverifiedTotpFactors() {
    const { data, error } = await withAuthRetry(() => db.auth.getUser());
    if (error) {
        throw error;
    }

    const factors = data?.user?.factors || [];
    const unverifiedFactors = factors.filter((factor) => factor.factor_type === 'totp' && factor.status !== 'verified');

    for (const factor of unverifiedFactors) {
        await withAuthRetry(() => db.auth.mfa.unenroll({ factorId: factor.id }));
    }
}

async function startTotpEnrollment() {
    await cleanupUnverifiedTotpFactors();

    const { data, error } = await withAuthRetry(() => db.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: MFA_FACTOR_NAME,
        issuer: 'Ziratstan',
    }));

    if (error) {
        if (error.status === 404 || error.code === 404 || (error.message && error.message.includes('404'))) {
            const bypassError = new Error('MFA endpoint not found (404). Bypassing MFA requirement.');
            bypassError.isMfaBypass = true;
            throw bypassError;
        }
        throw error;
    }

    pendingMfa = {
        mode: 'setup',
        factorId: data.id,
        buttonLabel: 'Включить защиту',
    };

    showMfaStep({
        title: 'Подключите приложение-аутентификатор',
        text: 'Отсканируйте QR-код в Google Authenticator или аналогичном приложении, затем введите 6-значный код.',
        qrCode: data.totp?.qr_code || '',
        secret: data.totp?.secret || '',
        buttonLabel: pendingMfa.buttonLabel,
        cancelLabel: 'Выйти',
    });
}

async function promptForMfaVerification(factorId) {
    pendingMfa = {
        mode: 'verify',
        factorId,
        buttonLabel: 'Подтвердить вход',
    };

    showMfaStep({
        title: 'Подтвердите вход',
        text: 'Введите 6-значный код из Google Authenticator, чтобы открыть админку.',
        qrCode: '',
        secret: '',
        buttonLabel: pendingMfa.buttonLabel,
        cancelLabel: 'Выйти',
    });
}

async function syncAuthUI(session) {
    const flowId = ++authFlowId;

    if (!session) {
        clearSessionTrackingState();
        showGate();
        resetGateMessages();
        return;
    }

    cleanupAuthUrl();

    try {
        await ensureAdminRole(session);
        if (flowId !== authFlowId) {
            return;
        }

        const aal = await getAuthenticatorAssuranceLevel();
        if (flowId !== authFlowId) {
            return;
        }

        if (aal.currentLevel === 'aal2') {
            pendingMfa = null;
            resetGateMessages();
            showPanel();
            await startAdminSessionControls();
            return;
        }

        const verifiedTotpFactor = await getVerifiedTotpFactor();
        if (flowId !== authFlowId) {
            return;
        }

        if (verifiedTotpFactor) {
            showGateMessage('success', 'Пароль принят. Подтвердите вход кодом из приложения-аутентификатора.');
            await promptForMfaVerification(verifiedTotpFactor.id);
            return;
        }

        showGateMessage('success', 'Пароль принят. Теперь нужно один раз включить двухфакторную защиту.');
        await startTotpEnrollment();
    } catch (error) {
        if (error.isMfaBypass) {
            console.warn('[Ziratstan] ' + error.message);
            pendingMfa = null;
            resetGateMessages();
            showPanel();
            await startAdminSessionControls();
            return;
        }
        if (isAuthSessionMissingError(error)) {
            clearSessionTrackingState();
            showGate();
            resetGateMessages();
            return;
        }

        if (isSessionTerminatedError(error)) {
            await forceSignOutForTerminatedSession();
            return;
        }
        if (isAdminRoleRequiredError(error) || isRlsDeniedError(error)) {
            const message = isAdminRoleRequiredError(error)
                ? error.message
                : createAdminRoleRequiredError().message;
            await signOutForAdminRoleRequired(message);
            return;
        }

        console.error(error);
        showGate();
        showGateMessage('error', error.message || 'Не удалось подготовить двухфакторную проверку.');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.db || !window.getSession) {
        console.error('[Admin] Supabase client is not initialized. Check src/js/config.public.js / src/js/config.js.');
        showGate();
        showGateMessage('error', 'Supabase client is not configured. Check SUPABASE_URL and SUPABASE_ANON_KEY.');
        return;
    }

    const { emailInput } = getGateElements();
    const savedEmail = localStorage.getItem(ADMIN_EMAIL_STORAGE_KEY);

    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
    }

    db.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            clearSessionTrackingState();
        }

        queueAuthSync(session).catch((error) => {
            console.error(error);
            if (isAuthSessionMissingError(error)) {
                resetGateMessages();
                return;
            }
            if (isTransientNetworkAuthError(error)) {
                showGateMessage('error', toAuthUiErrorMessage(error, 'Auth network error.'));
                return;
            }
            if (isSupabaseLockAbortError(error)) {
                showGateMessage('error', 'Retry sign in. Parallel auth requests were detected.');
                return;
            }

            showGateMessage('error', error.message || 'Auth error.');
        });
    });

    const session = await withAuthRetry(() => getSession());
    await queueAuthSync(session);
});

async function loginUser() {
    const { emailInput, passwordInput } = getGateElements();
    const email = emailInput?.value.trim().toLowerCase();
    const password = passwordInput?.value || '';

    if (!email) {
        showGateMessage('error', 'Введите admin email.');
        return;
    }

    if (!password) {
        showGateMessage('error', 'Введите пароль администратора.');
        return;
    }

    resetGateMessages();
    setLoginButtonState(true);
    setMagicLinkButtonState(true);
    localStorage.setItem(ADMIN_EMAIL_STORAGE_KEY, email);

    let loginResult;
    try {
        loginResult = await withAuthRetry(() => db.auth.signInWithPassword({ email, password }));
    } catch (error) {
        showGateMessage('error', toAuthUiErrorMessage(error, 'Failed to sign in.'));
        setLoginButtonState(false);
        setMagicLinkButtonState(false);
        return;
    }

    const { error } = loginResult;

    if (error) {
        const message = error.message === 'Invalid login credentials'
            ? 'Неверный email или пароль.'
            : (error.message || 'Не удалось выполнить вход.');
        showGateMessage('error', message);
        setLoginButtonState(false);
        setMagicLinkButtonState(false);
        return;
    }

    setLoginButtonState(false);
    setMagicLinkButtonState(false);
}

async function sendMagicLink() {
    const { emailInput } = getGateElements();
    const email = emailInput?.value.trim().toLowerCase();

    if (!email) {
        showGateMessage('error', 'Введите admin email, на который нужно отправить Magic Link.');
        return;
    }

    resetGateMessages();
    setLoginButtonState(true);
    setMagicLinkButtonState(true);
    localStorage.setItem(ADMIN_EMAIL_STORAGE_KEY, email);

    let otpResult;
    try {
        otpResult = await withAuthRetry(() => db.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: getAdminRedirectUrl(),
                shouldCreateUser: false,
            },
        }));
    } catch (error) {
        showGateMessage('error', toAuthUiErrorMessage(error, 'Failed to send magic link.'));
        setLoginButtonState(false);
        setMagicLinkButtonState(false);
        return;
    }

    const { error } = otpResult;

    if (error) {
        const message = error.message && error.message.includes('Signups not allowed for otp')
            ? 'Этот email не зарегистрирован как администратор. Сначала добавьте его через scripts/register_admin_email.js.'
            : (error.message || 'Не удалось отправить ссылку для входа.');
        showGateMessage('error', message);
        setLoginButtonState(false);
        setMagicLinkButtonState(false);
        return;
    }

    showGateMessage('success', 'Письмо отправлено. После перехода по ссылке админка всё равно попросит код из приложения-аутентификатора.');
    setLoginButtonState(false);
    setMagicLinkButtonState(false);
}

async function verifyMfaCode() {
    if (!pendingMfa?.factorId) {
        showGateMessage('error', 'Сначала выполните вход по email и паролю.');
        return;
    }

    const code = getMfaCode();
    if (!/^\d{6}$/.test(code)) {
        showGateMessage('error', 'Введите 6-значный код из приложения-аутентификатора.');
        return;
    }

    resetGateMessages();
    setMfaButtonState(true, pendingMfa.buttonLabel);

    let verifyResult;
    try {
        verifyResult = await withAuthRetry(() => db.auth.mfa.challengeAndVerify({
            factorId: pendingMfa.factorId,
            code,
        }));
    } catch (error) {
        showGateMessage('error', toAuthUiErrorMessage(error, 'Failed to verify code.'));
        setMfaButtonState(false, pendingMfa.buttonLabel);
        return;
    }

    const { error } = verifyResult;

    if (error) {
        let message = error.message === 'Invalid TOTP code entered'
            ? 'Неверный или просроченный код. Попробуйте еще раз.'
            : (error.message || 'Не удалось подтвердить код.');
        showGateMessage('error', message);
        setMfaButtonState(false, pendingMfa.buttonLabel);
        return;
    }

    pendingMfa = null;
    showGateMessage('success', 'Вход подтверждён.');
    setMfaButtonState(false);
    await queueAuthSync(await withAuthRetry(() => getSession()));
}

async function cancelMfaStep() {
    pendingMfa = null;
    await closeAdminSession('cancelled_before_mfa');
    await withAuthRetry(() => db.auth.signOut());
    showGate();
    resetGateMessages();
}

async function logout() {
    pendingMfa = null;
    await closeAdminSession('manual_logout');
    await withAuthRetry(() => db.auth.signOut());
    showGate();
    resetGateMessages();
    setLoginButtonState(false);
}

function switchTab(tab, btn) {
    currentTab = tab;
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    btn.classList.add('active');

    ['names', 'profiles', 'bios', 'leads', 'manage', 'sessions'].forEach((t) => {
        const el = document.getElementById(`content-${t}`);
        if (!el) {
            return;
        }

        el.style.display = t === tab ? 'flex' : 'none';
        el.style.flexDirection = 'column';
    });

    if (tab === 'manage' && (!allData.manage || allData.manage.length === 0)) {
        loadManageProfiles();
    }

    if (tab === 'sessions') {
        loadSessionActivity();
    }
}

async function loadManageProfiles() {
    const listContainer = document.getElementById('manage-profiles-list');
    listContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const payload = await apiRequest('/admin/profiles');
        allData.manage = payload.items || [];
        renderManageTab(allData.manage);
    } catch (err) {
        console.error(err);
        showToast(err.message || 'Ошибка загрузки базы профилей', 'error');
        listContainer.innerHTML = '<div class="empty"><p>Ошибка загрузки</p></div>';
    }
}

function renderManageTab(items) {
    const container = document.getElementById('manage-profiles-list');
    if (!items.length) {
        container.innerHTML = '<div class="empty"><div class="empty-icon">✓</div><p>Профилей пока нет</p></div>';
        return;
    }

    container.innerHTML = '';

    items.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'card';
        div.style.gridTemplateColumns = '1fr auto';

        const years = `${item.birth_date ? item.birth_date.substring(0, 4) : '?'} - ${item.death_date ? item.death_date.substring(0, 4) : '?'}`;
        const name = `${item.last_name || ''} ${item.first_name || ''}`.trim();

        div.innerHTML = `
        <div>
            <div class="card-title">${name}</div>
            <div class="card-meta-row" style="margin-top:8px;">
                <div class="card-meta-item">Годы: <span>${years}</span></div>
                <div class="card-meta-item">Старый ID (slug): <span>${item.epitaph || '-'}</span></div>
            </div>
            <div class="card-meta-row" style="margin-top:4px;">
                <div class="card-meta-item">UUID: <span style="font-family:monospace; font-size:0.75rem;">${item.id}</span></div>
            </div>
        </div>
        <div class="card-actions" style="justify-content:center;">
            <a href="profile.html?id=${item.id}" target="_blank" class="btn-approve" style="text-decoration:none; background:var(--gold-dim); color:var(--gold); border-color:rgba(212,175,55,0.3); padding:10px 16px;">Открыть профиль</a>
        </div>`;
        container.appendChild(div);
    });
}

function formatDateTime(value) {
    if (!value) {
        return '-';
    }
    try {
        return new Date(value).toLocaleString('ru-KZ');
    } catch (e) {
        return value;
    }
}

function isSessionActive(item) {
    if (!item || item.ended_at) {
        return false;
    }

    const lastSeen = item.last_seen_at ? new Date(item.last_seen_at).getTime() : 0;
    if (!lastSeen) {
        return false;
    }

    return (Date.now() - lastSeen) <= ADMIN_ACTIVE_SESSION_WINDOW_MS;
}

function renderSessionList(containerId, items, emptyText) {
    const container = document.getElementById(containerId);
    if (!container) {
        return;
    }

    if (!items.length) {
        container.innerHTML = `<div class="empty"><p>${emptyText}</p></div>`;
        return;
    }

    container.innerHTML = '';
    items.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'card';
        div.style.gridTemplateColumns = '1fr';

        const activeLabel = isSessionActive(item) ? 'Активна' : 'Неактивна';
        const endedLabel = item.ended_at
            ? `${formatDateTime(item.ended_at)} (${item.end_reason || 'reason not set'})`
            : '—';

        div.innerHTML = `
        <div class="card-title">${item.device_name || 'Unknown device'} — ${activeLabel}</div>
        <div class="card-meta-row">
            <div class="card-meta-item">Email: <span>${item.email || '-'}</span></div>
            <div class="card-meta-item">Start: <span>${formatDateTime(item.started_at)}</span></div>
        </div>
        <div class="card-meta-row">
            <div class="card-meta-item">Last seen: <span>${formatDateTime(item.last_seen_at)}</span></div>
            <div class="card-meta-item">End: <span>${endedLabel}</span></div>
        </div>
        <div class="card-detail" style="margin-top:8px; word-break:break-word;">${item.user_agent || '-'}</div>
        `;
        container.appendChild(div);
    });
}

async function terminateOtherSessions() {
    try {
        const session = await withAuthRetry(() => getSession());
        if (!session?.user?.id) {
            showToast('Сессия истекла. Войдите снова.', 'error');
            return;
        }

        const trackId = getOrCreateSessionTrackId();
        const nowIso = new Date().toISOString();

        const result = await withAuthRetry(() => db
            .from('admin_sessions')
            .update({
                ended_at: nowIso,
                end_reason: 'revoked_by_admin',
                last_seen_at: nowIso,
            })
            .eq('user_id', session.user.id)
            .is('ended_at', null)
            .neq('track_id', trackId));

        if (result.error) {
            throw result.error;
        }

        showToast('Все остальные сессии завершены.', 'success');
        await loadSessionActivity();
    } catch (error) {
        if (isAdminRoleRequiredError(error) || isRlsDeniedError(error)) {
            const message = isAdminRoleRequiredError(error)
                ? error.message
                : createAdminRoleRequiredError().message;
            await signOutForAdminRoleRequired(message);
            return;
        }
        console.error(error);
        showToast('Не удалось завершить остальные сессии.', 'error');
    }
}

async function loadSessionActivity() {
    const activeContainer = document.getElementById('sessions-active-list');
    const historyContainer = document.getElementById('sessions-history-list');

    if (!activeContainer || !historyContainer) {
        return;
    }

    activeContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    historyContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const result = await withAuthRetry(() => db
            .from('admin_sessions')
            .select('id, track_id, email, device_name, user_agent, started_at, last_seen_at, ended_at, end_reason')
            .order('started_at', { ascending: false })
            .limit(200));

        if (result.error) {
            throw result.error;
        }

        const items = result.data || [];
        allData.sessions = items;

        const active = items.filter((item) => isSessionActive(item));
        renderSessionList('sessions-active-list', active, 'Сейчас нет активных устройств');
        renderSessionList('sessions-history-list', items, 'История входов пока пуста');
    } catch (error) {
        if (isAdminRoleRequiredError(error) || isRlsDeniedError(error)) {
            const message = isAdminRoleRequiredError(error)
                ? error.message
                : createAdminRoleRequiredError().message;
            await signOutForAdminRoleRequired(message);
            return;
        }
        console.error(error);
        activeContainer.innerHTML = '<div class="empty"><p>Ошибка загрузки активных устройств</p></div>';
        historyContainer.innerHTML = '<div class="empty"><p>Ошибка загрузки истории</p></div>';
        showToast('Не удалось загрузить сессии', 'error');
    }
}

async function handleCreateProfile(e) {
    e.preventDefault();

    const btn = document.getElementById('cp_submitBtn');
    btn.disabled = true;
    btn.textContent = 'Создание...';

    const payload = {
        first_name: document.getElementById('cp_firstName').value,
        last_name: document.getElementById('cp_lastName').value,
        birth_year: document.getElementById('cp_birthYear').value,
        death_year: document.getElementById('cp_deathYear').value,
        biography: document.getElementById('cp_bio').value,
    };

    try {
        await apiRequest('/admin/profiles', { method: 'POST', body: payload });
        showToast('Профиль успешно создан', 'success');
        document.getElementById('createProfileForm').reset();
        loadManageProfiles();
    } catch (err) {
        console.error(err);
        showToast(err.message || 'Ошибка при создании профиля', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Создать профиль';
    }
}

async function loadAllData() {
    showLoading('names');
    showLoading('profiles');
    showLoading('bios');
    showLoading('leads');

    try {
        const payload = await apiRequest('/admin/bootstrap');

        allData.names = payload.names || [];
        allData.profiles = payload.profiles || [];
        allData.bios = payload.bios || [];
        allData.leads = payload.leads || [];

        renderTab('names', allData.names);
        renderTab('profiles', allData.profiles);
        renderTab('bios', allData.bios);
        renderTab('leads', allData.leads);
        updateCounts();
    } catch (err) {
        console.error('Error loading data:', err);
        showToast('Ошибка загрузки данных из Supabase', 'error');
        showEmpty('names', 'Ошибка подключения к базе данных');
        showEmpty('profiles', 'Ошибка подключения к базе данных');
        showEmpty('bios', 'Ошибка подключения к базе данных');
    }
}

function updateCounts() {
    const pendingN = allData.names.filter((x) => x.status === 'pending').length;
    const pendingP = allData.profiles.filter((x) => x.status === 'pending').length;
    const pendingB = allData.bios.filter((x) => x.status === 'pending').length;
    const pendingL = allData.leads.length; // No status in schema, consider all as pending/new
    const total = pendingN + pendingP + pendingB + pendingL;

    document.getElementById('cnt-names').textContent = pendingN;
    document.getElementById('cnt-profiles').textContent = pendingP;
    document.getElementById('cnt-bios').textContent = pendingB;
    document.getElementById('cnt-leads').textContent = pendingL;
    document.getElementById('totalPendingBadge').textContent = `${total} на проверке`;
}

function showLoading(tab) {
    document.getElementById(`content-${tab}`).innerHTML = '<div class="loading"><div class="spinner"></div></div>';
}

function showEmpty(tab, msg = 'Заявок нет') {
    document.getElementById(`content-${tab}`).innerHTML = `<div class="empty"><div class="empty-icon">✓</div><p>${msg}</p></div>`;
}

function renderTab(tab, items) {
    if (!items.length) {
        showEmpty(tab);
        return;
    }

    const container = document.getElementById(`content-${tab}`);
    container.innerHTML = '';
    items.forEach((item) => container.appendChild(createCard(tab, item)));
}

// Region detection helper for Admin Panel
const ADMIN_KZ_REGIONS = [
    { id: 'almaty', n_ru: "Алматы", geo_lt: 43.2, geo_ln: 76.8, radius: 0.2 },
    { id: 'astana', n_ru: "Астана", geo_lt: 51.16, geo_ln: 71.44, radius: 0.2 },
    { id: 'shymkent', n_ru: "Шымкент", geo_lt: 42.34, geo_ln: 69.59, radius: 0.15 },
    { id: 'abai', n_ru: "Абайская область", geo_lt: 48.9, geo_ln: 80.2 },
    { id: 'akmola', n_ru: "Акмолинская область", geo_lt: 51.8, geo_ln: 69.4 },
    { id: 'aktobe', n_ru: "Актюбинская область", geo_lt: 48.8, geo_ln: 58.3 },
    { id: 'almaty_obl', n_ru: "Алматинская область", geo_lt: 44.5, geo_ln: 77.8 },
    { id: 'atyrau', n_ru: "Атырауская область", geo_lt: 47.1, geo_ln: 51.9 },
    { id: 'vko', n_ru: "Восточный Казахстан", geo_lt: 49.9, geo_ln: 82.6 },
    { id: 'zhambyl', n_ru: "Жамбылская область", geo_lt: 43.8, geo_ln: 72.8 },
    { id: 'zhetysu', n_ru: "Жетісу облысы", geo_lt: 45.0, geo_ln: 79.0 },
    { id: 'zko', n_ru: "Западный Казахстан", geo_lt: 50.0, geo_ln: 50.5 },
    { id: 'karaganda', n_ru: "Карагандинская область", geo_lt: 48.5, geo_ln: 72.0 },
    { id: 'kostanay', n_ru: "Костанайская область", geo_lt: 52.5, geo_ln: 63.6 },
    { id: 'kyzylorda', n_ru: "Кызылординская область", geo_lt: 44.8, geo_ln: 63.5 },
    { id: 'mangystau', n_ru: "Мангистауская область", geo_lt: 44.0, geo_ln: 53.0 },
    { id: 'pavlodar', n_ru: "Павлодарская область", geo_lt: 52.3, geo_ln: 76.0 },
    { id: 'sko', n_ru: "Северо-Казахстанская область", geo_lt: 53.5, geo_ln: 68.5 },
    { id: 'turkestan', n_ru: "Туркестанская область", geo_lt: 42.8, geo_ln: 68.3 },
    // Custom bounding for ulytau because it's massive and sparse
    { id: 'ulytau', n_ru: "Ұлытау облысы", geo_lt: 47.8, geo_ln: 66.0, b_min_lt: 46.0, b_max_lt: 49.0, b_min_ln: 64.0, b_max_ln: 69.0 },
    { id: 'zarubezh', n_ru: "Зарубежье", geo_lt: 55.7, geo_ln: 37.6 }
];

function getAdminRegion(lat, lng) {
    if (!lat || !lng) return 'Неизвестно';
    let bestR = null;
    
    // Bounds check first for explicit overriding (e.g. Ulytau)
    for (const r of ADMIN_KZ_REGIONS) {
        if (r.b_min_lt && lat >= r.b_min_lt && lat <= r.b_max_lt && lng >= r.b_min_ln && lng <= r.b_max_ln) {
            return r.n_ru;
        }
    }

    if (lat > 56 || lat < 39 || lng < 45 || lng > 88) {
        bestR = ADMIN_KZ_REGIONS.find(x => x.id === 'zarubezh');
    } else {
        let minD = Infinity;
        ADMIN_KZ_REGIONS.forEach(r => {
            if (r.id === 'zarubezh') return;
            const dx = (r.geo_ln - lng) * Math.cos((r.geo_lt + lat) * Math.PI / 360);
            const dy = (r.geo_lt - lat);
            let d = dx * dx + dy * dy;
            
            // Major city penalty: if beyond ~15-20km (radius^2), do not classify as city
            if (r.radius && d > (r.radius * r.radius)) {
                d += 50.0; // massive penalty ensuring it falls back to the surrounding Oblast
            }

            if (d < minD) { minD = d; bestR = r; }
        });
    }
    return bestR ? bestR.n_ru : 'Неизвестно';
}

function createCard(type, item) {
    const div = document.createElement('div');
    div.className = 'card';
    div.id = `card-${item.id}`;

    const submitted = item.submitted_at || item.created_at;
    const dateStr = submitted ? new Date(submitted).toLocaleString('ru-KZ') : '-';
    const statusClass = item.status ? `status-${item.status}` : '';
    const statusText = item.status === 'pending'
        ? 'На проверке'
        : item.status === 'approved'
            ? 'Одобрено'
            : item.status === 'rejected' ? 'Отклонено' : '';

    let content = '';
    let badgeClass = '';
    let title = '';

    if (type === 'names') {
        badgeClass = 'badge-names';
        title = item.suggested_name;
        const cardUid = `cem-${item.id}`;
        content = `
        <div class="card-meta-row">
            <div class="card-meta-item">Текущее название: <span>${item.current_name || '-'}</span></div>
            <div class="card-meta-item">Координаты: <span>${item.lat || '?'}, ${item.lng || '?'}</span></div>
        </div>
        <div class="card-meta-row">
            <div class="card-meta-item">Область: <span style="color:var(--gold);">${getAdminRegion(item.lat, item.lng)}</span></div>
            <div class="card-meta-item" id="${cardUid}-district" style="display:none;">Аудан: <span style="color:var(--muted);"></span></div>
        </div>
        ${item.comment ? `<div class="card-detail" style="margin-top:8px;">${item.comment}</div>` : ''}`;
        // Async district fetch
        if (item.lat && item.lng) {
            setTimeout(async () => {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${item.lat}&lon=${item.lng}&format=json&accept-language=ru`, { headers: { 'User-Agent': 'Ziratstan.kz/1.0' } });
                    const geo = await res.json();
                    const addr = geo.address || {};
                    const district = addr.county || addr.state_district || addr.city_district || addr.suburb || addr.village || addr.town || '';
                    const el = document.getElementById(`${cardUid}-district`);
                    if (el && district) {
                        el.querySelector('span').textContent = district;
                        el.style.display = 'block';
                    }
                } catch(e) {}
            }, 200);
        }
    } else if (type === 'profiles') {
        badgeClass = 'badge-profiles';
        title = item.full_name;
        const cardUid = `prof-${item.id}`;
        content = `
        <div class="card-meta-row">
            <div class="card-meta-item">Годы: <span>${item.birth_year || '?'} - ${item.death_year || '?'}</span></div>
            <div class="card-meta-item">Кладбище: <span>${item.cemetery_name || '-'}</span></div>
        </div>
        <div class="card-meta-row">
            <div class="card-meta-item">Координаты: <span>${item.lat || '?'}, ${item.lng || '?'}</span></div>
            <div class="card-meta-item">Область: <span style="color:var(--gold);">${getAdminRegion(item.lat, item.lng)}</span></div>
        </div>
        <div class="card-meta-row">
            <div class="card-meta-item" id="${cardUid}-district" style="display:none;">Аудан: <span style="color:var(--muted);"></span></div>
        </div>
        ${item.description ? `<div class="card-detail" style="margin-top:8px;">${item.description}</div>` : ''}`;
        // Async district fetch
        if (item.lat && item.lng) {
            setTimeout(async () => {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${item.lat}&lon=${item.lng}&format=json&accept-language=ru`, { headers: { 'User-Agent': 'Ziratstan.kz/1.0' } });
                    const geo = await res.json();
                    const addr = geo.address || {};
                    const district = addr.county || addr.state_district || addr.city_district || addr.suburb || addr.village || addr.town || '';
                    const el = document.getElementById(`${cardUid}-district`);
                    if (el && district) {
                        el.querySelector('span').textContent = district;
                        el.style.display = 'block';
                    }
                } catch(e) {}
            }, 200);
        }
    } else if (type === 'bios') {
        badgeClass = 'badge-bios';
        title = `Дополнение к профилю #${item.profile_id?.substring(0, 8) || '?'}`;
        content = `
        ${item.author_name ? `<div class="card-detail" style="margin-bottom:6px;">От: <strong>${item.author_name}</strong></div>` : ''}
        <div class="card-detail" style="background:#18181b; border-radius:8px; padding:10px; margin-top:6px; line-height:1.6;">"${item.bio_text}"</div>`;
    } else if (type === 'leads') {
        badgeClass = 'badge-profiles'; // Reuse profile color or custom
        title = `Заказ: ${item.service_type}`;
        content = `
        <div class="card-meta-row">
            <div class="card-meta-item">Клиент: <span>${item.customer_name}</span></div>
            <div class="card-meta-item">Телефон: <span>${item.customer_phone}</span></div>
        </div>
        <div class="card-meta-row">
            <div class="card-meta-item">Профиль: <span>${item.profile_ref || '-'}</span></div>
            <div class="card-meta-item">Цена: <span>${item.price || '-'} ₸</span></div>
        </div>
        ${item.comment ? `<div class="card-detail" style="margin-top:8px;">${item.comment}</div>` : ''}`;
    }

    const typeLabel = type === 'names' ? 'Название' : type === 'profiles' ? 'Личность' : type === 'bios' ? 'Биография' : 'Заказ';

    div.innerHTML = `
    <div>
        <span class="card-type-badge ${badgeClass}">${typeLabel}</span>
        <div class="card-title">${title}</div>
        ${content}
        <div class="card-meta-row" style="margin-top:12px;">
            <div class="card-meta-item">Время: <span>${dateStr}</span></div>
            ${item.status ? `<span class="status-chip ${statusClass}">${statusText}</span>` : ''}
        </div>
    </div>
    <div class="card-actions">
        ${item.status === 'pending' ? `
            <button class="btn-approve" onclick="updateStatus('${type}', '${item.id}', 'approved')">Одобрить</button>
            <button class="btn-reject" onclick="updateStatus('${type}', '${item.id}', 'rejected')">Отклонить</button>
        ` : item.status ? `
            <span style="font-size:0.75rem; color:var(--muted); text-align:right;">Уже обработано</span>
            <button class="btn-reject" style="background:transparent; color:var(--muted); border-color:var(--border); margin-top:5px;" onclick="updateStatus('${type}', '${item.id}', 'pending')">Отменить (Вернуть)</button>
        ` : ''}
    </div>`;

    return div;
}

async function updateStatus(type, id, status) {
    const btnApprove = document.querySelector(`#card-${id} .btn-approve`);
    const btnReject = document.querySelector(`#card-${id} .btn-reject`);
    
    // Disable all buttons in this card while loading
    if (btnApprove) { btnApprove.disabled = true; }
    if (btnReject) { btnReject.disabled = true; btnReject.textContent = '...'; }

    try {
        await apiRequest('/admin/status', {
            method: 'POST',
            body: { type, id, status },
        });

        const item = allData[type].find((x) => x.id === id);
        if (item) {
            item.status = status;
        }

        updateCounts();

        const card = document.getElementById(`card-${id}`);
        if (card && item) {
            const newCard = createCard(type, item);
            card.replaceWith(newCard);
        }

        const approvedMsg = type === 'profiles' ? 'Одобрено и опубликовано' : 'Одобрено';
        showToast(
            status === 'approved' ? approvedMsg : (status === 'pending' ? 'Возвращено на модерацию' : 'Заявка отклонена'),
            status === 'approved' ? 'success' : (status === 'pending' ? 'success' : 'error')
        );
    } catch (err) {
        console.error('Error updating status:', err);
        showToast('Ошибка при обновлении статуса', 'error');

        // Restore buttons if failed
        const card = document.getElementById(`card-${id}`);
        if (card) {
            const item = allData[type].find((x) => x.id === id);
            if (item) {
                const newCard = createCard(type, item);
                card.replaceWith(newCard);
            }
        }
    }
}

function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast toast-${type} show`;
    setTimeout(() => t.classList.remove('show'), 3000);
}
