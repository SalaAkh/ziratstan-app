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
const YEAR_INPUT_PATTERN = /^\d{4}$/;
const HARD_DELETE_CONFIRM_PHRASE_FALLBACK = 'УДАЛИТЬ';
const PROFILE_VISIBILITY_VALUES = new Set(['public', 'private', 'family_only']);
const SHEZHIRE_FIELD_MAX_LENGTH = 120;
const SHEZHIRE_VALUE_MAX_LENGTH = 2000;

let cemeteryCatalog = [];
let cemeteryCatalogLoaded = false;
let cemeteryLabelToIdMap = new Map();
let cemeteryIdToLabelMap = new Map();

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function toSafeDomId(value) {
    const normalized = String(value ?? '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    return normalized || 'item';
}

function getCardDomId(value) {
    return `card-${toSafeDomId(value)}`;
}

function isUuidValue(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function toFiniteNumberOrNull(value) {
    const raw = String(value ?? '').trim();
    if (!raw) {
        return null;
    }
    const number = Number(raw.replace(',', '.'));
    return Number.isFinite(number) ? number : null;
}

function normalizeTextValue(value, maxLen = 4000) {
    const normalized = String(value ?? '').trim();
    if (!normalized) {
        return null;
    }
    return normalized.length > maxLen ? normalized.slice(0, maxLen) : normalized;
}

function validateYearInput(value, label = null) {
    const safeLabel = label || getI18nText('admin_lbl_year', 'Год');
    const raw = String(value ?? '').trim();
    if (!raw) {
        return null;
    }
    if (!YEAR_INPUT_PATTERN.test(raw)) {
        throw new Error(`${safeLabel}: ${getI18nText('admin_year_format_err', 'формат должен быть YYYY')}`);
    }
    return raw;
}

function yearToDateOrNull(value, label = null) {
    const year = validateYearInput(value, label);
    return year ? `${year}-01-01` : null;
}

function parseCoordinate(value, label, min, max) {
    const safeLabel = label || getI18nText('common_unknown', 'Поле');
    const raw = String(value ?? '').trim();
    if (!raw) {
        return null;
    }

    const number = toFiniteNumberOrNull(raw);
    if (number === null) {
        throw new Error(`${safeLabel}: ${getI18nText('admin_number_required', 'введите число')}`);
    }

    if (number < min || number > max) {
        throw new Error(`${safeLabel}: ${getI18nText('admin_number_range_err_prefix', 'значение вне диапазона')} ${min}..${max}`);
    }

    return Number(number.toFixed(7));
}

function parseLocationInput(latValue, lngValue) {
    const lat = parseCoordinate(latValue, getI18nText('admin_lbl_lat', 'Широта (lat)'), -90, 90);
    const lng = parseCoordinate(lngValue, getI18nText('admin_lbl_lng', 'Долгота (lng)'), -180, 180);

    if ((lat === null && lng !== null) || (lat !== null && lng === null)) {
        throw new Error(getI18nText('admin_lat_lng_pair_err', 'Заполните и lat, и lng, либо оставьте оба поля пустыми'));
    }

    return {
        lat,
        lng,
        point: (lat !== null && lng !== null) ? `SRID=4326;POINT(${lng} ${lat})` : null,
    };
}

function extractLocationPoint(locationValue) {
    if (!locationValue) {
        return { lat: null, lng: null };
    }

    if (typeof locationValue === 'object' && Array.isArray(locationValue.coordinates) && locationValue.coordinates.length >= 2) {
        const lng = toFiniteNumberOrNull(locationValue.coordinates[0]);
        const lat = toFiniteNumberOrNull(locationValue.coordinates[1]);
        return {
            lat: lat === null ? null : Number(lat),
            lng: lng === null ? null : Number(lng),
        };
    }

    if (typeof locationValue === 'string') {
        const match = locationValue.match(/POINT\(\s*([-0-9.]+)\s+([-0-9.]+)\s*\)/i);
        if (match) {
            const lng = toFiniteNumberOrNull(match[1]);
            const lat = toFiniteNumberOrNull(match[2]);
            return {
                lat: lat === null ? null : Number(lat),
                lng: lng === null ? null : Number(lng),
            };
        }
    }

    return { lat: null, lng: null };
}

function getI18nText(key, fallback) {
    if (window.i18n && typeof window.i18n.t === 'function') {
        const translated = window.i18n.t(key);
        return translated !== key ? translated : fallback;
    }
    return fallback;
}

function getI18nLocale() {
    const lang = window.i18n && typeof window.i18n.getLang === 'function'
        ? window.i18n.getLang()
        : 'ru';
    return lang === 'kk' ? 'kk-KZ' : 'ru-KZ';
}

function isMissingColumnError(error, columnName) {
    const message = error?.message ? String(error.message) : '';
    return Boolean(columnName) && (message.includes(columnName) || message.includes(`"${columnName}"`));
}

function getDefaultShezhireEntries() {
    return [
        { label: getI18nText('shezhire_default_ru', 'Ру / племя'), value: '' },
        { label: getI18nText('shezhire_default_shezhire', 'Шежіре'), value: '' },
    ];
}

function normalizeShezhireEntry(entry) {
    const source = (entry && typeof entry === 'object') ? entry : {};
    const label = normalizeTextValue(
        source.label ?? source.field ?? source.title ?? source.name,
        SHEZHIRE_FIELD_MAX_LENGTH
    );
    const value = normalizeTextValue(
        source.value ?? source.text ?? source.content ?? source.description,
        SHEZHIRE_VALUE_MAX_LENGTH
    );

    if (!label && !value) {
        return null;
    }

    return {
        label: label || getI18nText('common_field', 'Поле'),
        value: value || '',
    };
}

function normalizeShezhireEntries(value) {
    let source = value;
    if (typeof source === 'string') {
        const trimmed = source.trim();
        if (!trimmed) {
            return [];
        }
        try {
            source = JSON.parse(trimmed);
        } catch (_error) {
            return [];
        }
    }

    if (!Array.isArray(source)) {
        return [];
    }

    return source
        .map((entry) => normalizeShezhireEntry(entry))
        .filter(Boolean);
}

function createShezhireRowMarkup(entry = {}) {
    const safeEntry = normalizeShezhireEntry(entry) || { label: '', value: '' };
    return `
        <div data-shezhire-row style="display:grid; grid-template-columns:minmax(0,0.9fr) minmax(0,1.3fr) auto; gap:8px; align-items:start;">
            <input name="shezhire_label_input" aria-label="Поле шежире" type="text" list="shezhireFieldOptions" class="gate-input" data-shezhire-label
                placeholder="${escapeHtml(getI18nText('shezhire_field_ph', 'Напр. Ру / племя'))}"
                value="${escapeHtml(safeEntry.label)}"
                style="margin-bottom:0; text-align:left; letter-spacing:normal;" />
            <textarea name="shezhire_value_input" aria-label="Значение шежире" class="gate-input" data-shezhire-value rows="2"
                placeholder="${escapeHtml(getI18nText('shezhire_value_ph', 'Введите значение'))}"
                style="margin-bottom:0; text-align:left; letter-spacing:normal; resize:vertical;">${escapeHtml(safeEntry.value)}</textarea>
            <button type="button" class="gate-btn gate-btn-secondary" onclick="removeShezhireEntryRow(this)"
                style="width:auto; padding:10px 12px; align-self:stretch;"><span data-i18n="common_remove_row">${escapeHtml(getI18nText('common_remove_row', 'Удалить'))}</span></button>
        </div>`;
}

function renderShezhireEntryRows(prefix, entries = null) {
    const container = document.getElementById(`${prefix}_shezhireList`);
    if (!container) {
        return;
    }

    const normalizedEntries = normalizeShezhireEntries(entries);
    const rows = normalizedEntries.length ? normalizedEntries : getDefaultShezhireEntries();
    container.innerHTML = rows.map((entry) => createShezhireRowMarkup(entry)).join('');
}

function addShezhireEntryRow(prefix, entry = null) {
    const container = document.getElementById(`${prefix}_shezhireList`);
    if (!container) {
        return;
    }

    container.insertAdjacentHTML('beforeend', createShezhireRowMarkup(entry || { label: '', value: '' }));
}

function removeShezhireEntryRow(trigger) {
    const row = trigger?.closest?.('[data-shezhire-row]');
    if (!row) {
        return;
    }
    row.remove();
}

function collectShezhireEntries(prefix) {
    const container = document.getElementById(`${prefix}_shezhireList`);
    if (!container) {
        return [];
    }

    return Array.from(container.querySelectorAll('[data-shezhire-row]'))
        .map((row) => normalizeShezhireEntry({
            label: row.querySelector('[data-shezhire-label]')?.value,
            value: row.querySelector('[data-shezhire-value]')?.value,
        }))
        .filter((entry) => entry && entry.value);
}

function formatShezhireSummary(entries, maxItems = 2) {
    const normalizedEntries = normalizeShezhireEntries(entries);
    if (!normalizedEntries.length) {
        return '';
    }

    return normalizedEntries
        .slice(0, maxItems)
        .map((entry) => {
            const value = entry.value && entry.value.length > 80
                ? `${entry.value.slice(0, 77)}...`
                : entry.value;
            return `${entry.label}: ${value}`;
        })
        .join(' | ');
}

function getHardDeleteConfirmPhrase() {
    return getI18nText('admin_delete_phrase', HARD_DELETE_CONFIRM_PHRASE_FALLBACK);
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
        return getI18nText(
            'admin_err_network',
            'Не удалось подключиться к Supabase. Проверьте VPN/proxy/антивирус и попробуйте снова.'
        );
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
    const error = new Error(getI18nText(
        'admin_role_required',
        'Для этого аккаунта нужна роль администратора. Запустите scripts/register_admin_email.js и войдите снова.'
    ));
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
        showToast(getI18nText('admin_session_terminated_toast', 'Сессия завершена на другом устройстве.'), 'error');
        showGateMessage('error', getI18nText('admin_session_terminated_msg', 'Эта сессия была завершена с другого устройства.'));
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
            showToast(getI18nText('admin_session_expired_toast', 'Сессия истекла (15 минут). Выполнен выход.'), 'error');
            await closeAdminSession('session_expired');
            await withAuthRetry(() => db.auth.signOut());
            showGate();
            showGateMessage('error', getI18nText('admin_session_expired_msg', 'Сессия истекла. Войдите снова.'));
        }, 0);
        return;
    }

    const msLeft = Math.max(0, deadline - now);
    sessionDeadlineTimer = setTimeout(async () => {
        showToast(getI18nText('admin_session_expired_toast', 'Сессия истекла (15 минут). Выполнен выход.'), 'error');
        await closeAdminSession('session_expired');
        await withAuthRetry(() => db.auth.signOut());
        showGate();
        showGateMessage('error', getI18nText('admin_session_expired_msg', 'Сессия истекла. Войдите снова.'));
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
    loginBtn.textContent = isLoading
        ? getI18nText('admin_gate_login_loading', 'Входим...')
        : getI18nText('admin_gate_login', 'Войти');
}

function setMagicLinkButtonState(isLoading) {
    const { magicLinkBtn } = getGateElements();
    if (!magicLinkBtn) {
        return;
    }

    magicLinkBtn.disabled = isLoading;
    magicLinkBtn.textContent = isLoading
        ? getI18nText('admin_gate_magic_loading', 'Отправляем...')
        : getI18nText('admin_gate_magic', 'Отправить Magic Link');
}

function setMfaButtonState(isLoading, label) {
    const { mfaVerifyBtn, mfaCancelBtn } = getGateElements();

    if (mfaVerifyBtn) {
        mfaVerifyBtn.disabled = isLoading;
        if (label) {
            mfaVerifyBtn.textContent = isLoading
                ? getI18nText('admin_mfa_verify_loading', 'Проверяем...')
                : label;
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

    const toSafeYearDateLoose = (value) => {
        const raw = value === null || value === undefined ? '' : String(value).trim();
        if (!raw) return null;
        const match = raw.match(/\d{4}/);
        return match ? `${match[0]}-01-01` : null;
    };

    if (path === '/admin/bootstrap' && method === 'GET') {
        const [namesRes, profilesRes, biosRes, leadsRes] = await Promise.all([
            db.from('ugc_submissions').select('*').order('submitted_at', { ascending: false, nullsFirst: false }).limit(100),
            db.from('ugc_profile_submissions').select('*').order('submitted_at', { ascending: false, nullsFirst: false }).limit(100),
            db.from('ugc_bio_submissions').select('*').order('submitted_at', { ascending: false, nullsFirst: false }).limit(100),
            db.from('services_leads').select('*').order('submitted_at', { ascending: false, nullsFirst: false }).limit(100),
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

    if (path === '/admin/cemeteries' && method === 'GET') {
        const result = await db
            .from('cemeteries')
            .select('id, name, city, region')
            .order('name', { ascending: true })
            .limit(5000);

        if (result?.error && isTableNotFoundError(result.error)) {
            return { items: [] };
        }

        throwIfError(result, 'Failed to load cemeteries');
        return { items: result.data || [] };
    }

    if (path === '/admin/profiles' && method === 'GET') {
        let result = await db
            .from('profiles')
            .select('id, first_name, last_name, birth_date, death_date, created_at, epitaph, biography, shezhire_entries, visibility_status, cemetery_id, location, cemeteries(id, name, city, region)')
            .order('created_at', { ascending: false })
            .limit(300);

        if (result?.error && isMissingColumnError(result.error, 'shezhire_entries')) {
            result = await db
                .from('profiles')
                .select('id, first_name, last_name, birth_date, death_date, created_at, epitaph, biography, visibility_status, cemetery_id, location, cemeteries(id, name, city, region)')
                .order('created_at', { ascending: false })
                .limit(300);
        }

        throwIfError(result, 'Failed to load profiles');
        const items = (result.data || []).map((item) => {
            const point = extractLocationPoint(item.location);
            return {
                ...item,
                shezhire_entries: normalizeShezhireEntries(item.shezhire_entries),
                lat: point.lat,
                lng: point.lng,
                cemetery_name: item.cemeteries?.name || null,
                cemetery_city: item.cemeteries?.city || null,
                cemetery_region: item.cemeteries?.region || null,
            };
        });

        return { items };
    }

    if (path === '/admin/profiles' && method === 'POST') {
        const firstName = normalizeTextValue(body.first_name, 100);
        if (!firstName) {
            throw toError('first_name is required', 400);
        }

        const locationPayload = parseLocationInput(body.lat, body.lng);
        const cemeteryIdRaw = normalizeTextValue(body.cemetery_id, 80);
        if (cemeteryIdRaw && !isUuidValue(cemeteryIdRaw)) {
            throw toError('Invalid cemetery_id', 400);
        }
        const shezhireEntries = normalizeShezhireEntries(body.shezhire_entries);

        const payload = {
            first_name: firstName,
            last_name: normalizeTextValue(body.last_name, 100),
            birth_date: yearToDateOrNull(body.birth_year, getI18nText('admin_lbl_birth_year', 'Год рождения')),
            death_date: yearToDateOrNull(body.death_year, getI18nText('admin_lbl_death_year', 'Год смерти')),
            biography: normalizeTextValue(body.biography, 6000),
            shezhire_entries: shezhireEntries,
            cemetery_id: cemeteryIdRaw || null,
            location: locationPayload.point,
            visibility_status: 'public',
            owner_id: isUuidValue(approverUserId) ? approverUserId : null,
        };

        let result = await db.from('profiles').insert([payload]).select('id').single();
        if (result?.error && isMissingColumnError(result.error, 'shezhire_entries')) {
            const fallbackPayload = { ...payload };
            delete fallbackPayload.shezhire_entries;
            result = await db.from('profiles').insert([fallbackPayload]).select('id').single();
        }
        throwIfError(result, 'Failed to create profile');
        return { item: result.data };
    }

    if (path === '/admin/profiles' && method === 'PATCH') {
        const profileId = normalizeTextValue(body.id, 80);
        if (!isUuidValue(profileId)) {
            throw toError('Invalid profile id', 400);
        }

        const patch = {};

        if (Object.prototype.hasOwnProperty.call(body, 'first_name')) {
            const firstName = normalizeTextValue(body.first_name, 100);
            if (!firstName) {
                throw toError('first_name is required', 400);
            }
            patch.first_name = firstName;
        }

        if (Object.prototype.hasOwnProperty.call(body, 'last_name')) {
            patch.last_name = normalizeTextValue(body.last_name, 100);
        }

        if (Object.prototype.hasOwnProperty.call(body, 'birth_year')) {
            patch.birth_date = yearToDateOrNull(body.birth_year, getI18nText('admin_lbl_birth_year', 'Год рождения'));
        }

        if (Object.prototype.hasOwnProperty.call(body, 'death_year')) {
            patch.death_date = yearToDateOrNull(body.death_year, getI18nText('admin_lbl_death_year', 'Год смерти'));
        }

        if (Object.prototype.hasOwnProperty.call(body, 'biography')) {
            patch.biography = normalizeTextValue(body.biography, 6000);
        }

        if (Object.prototype.hasOwnProperty.call(body, 'shezhire_entries')) {
            patch.shezhire_entries = normalizeShezhireEntries(body.shezhire_entries);
        }

        if (Object.prototype.hasOwnProperty.call(body, 'visibility_status')) {
            const visibilityStatus = normalizeTextValue(body.visibility_status, 40);
            if (!visibilityStatus || !PROFILE_VISIBILITY_VALUES.has(visibilityStatus)) {
                throw toError('Invalid visibility_status', 400);
            }
            patch.visibility_status = visibilityStatus;
        }

        if (Object.prototype.hasOwnProperty.call(body, 'cemetery_id')) {
            const cemeteryIdRaw = normalizeTextValue(body.cemetery_id, 80);
            if (cemeteryIdRaw && !isUuidValue(cemeteryIdRaw)) {
                throw toError('Invalid cemetery_id', 400);
            }
            patch.cemetery_id = cemeteryIdRaw || null;
        }

        const hasLat = Object.prototype.hasOwnProperty.call(body, 'lat');
        const hasLng = Object.prototype.hasOwnProperty.call(body, 'lng');
        if (hasLat || hasLng) {
            const locationPayload = parseLocationInput(body.lat, body.lng);
            patch.location = locationPayload.point;
        }

        if (!Object.keys(patch).length) {
            throw toError('No fields to update', 400);
        }

        let result = await db
            .from('profiles')
            .update(patch)
            .eq('id', profileId)
            .select('id')
            .maybeSingle();

        if (result?.error && isMissingColumnError(result.error, 'shezhire_entries') && Object.prototype.hasOwnProperty.call(patch, 'shezhire_entries')) {
            const fallbackPatch = { ...patch };
            delete fallbackPatch.shezhire_entries;
            if (!Object.keys(fallbackPatch).length) {
                throw toError('shezhire_entries column is missing', 500);
            }
            result = await db
                .from('profiles')
                .update(fallbackPatch)
                .eq('id', profileId)
                .select('id')
                .maybeSingle();
        }

        throwIfError(result, 'Failed to update profile');
        if (!result.data) {
            throw toError('Profile not found', 404);
        }

        return { item: result.data };
    }

    if (path === '/admin/profiles' && method === 'DELETE') {
        const profileId = normalizeTextValue(body.id, 80);
        if (!isUuidValue(profileId)) {
            throw toError('Invalid profile id', 400);
        }

        if (body.mode === 'soft') {
            const result = await db
                .from('profiles')
                .update({ visibility_status: 'private' })
                .eq('id', profileId)
                .select('id')
                .maybeSingle();

            throwIfError(result, 'Failed to hide profile');
            if (!result.data) {
                throw toError('Profile not found', 404);
            }
            return { ok: true, mode: 'soft' };
        }

        if (body.mode === 'hard') {
            const result = await db
                .from('profiles')
                .delete()
                .eq('id', profileId)
                .select('id')
                .maybeSingle();

            throwIfError(result, 'Failed to delete profile');
            if (!result.data) {
                throw toError('Profile not found', 404);
            }
            return { ok: true, mode: 'hard' };
        }

        throw toError('Invalid delete mode', 400);
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
            const fetchSubmission = async (fields) => db
                .from('ugc_profile_submissions')
                .select(fields.join(', '))
                .eq('id', body.id)
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
                'shezhire_entries',
                'published_profile_id',
            ];
            let hasPublishedIdColumn = true;
            let hasShezhireEntriesColumn = true;
            let subRes = await fetchSubmission(submissionFields);

            if (subRes?.error && isMissingColumnError(subRes.error, 'published_profile_id')) {
                hasPublishedIdColumn = false;
                submissionFields = submissionFields.filter((field) => field !== 'published_profile_id');
                subRes = await fetchSubmission(submissionFields);
            }
            if (subRes?.error && isMissingColumnError(subRes.error, 'shezhire_entries')) {
                hasShezhireEntriesColumn = false;
                submissionFields = submissionFields.filter((field) => field !== 'shezhire_entries');
                subRes = await fetchSubmission(submissionFields);
            }

            throwIfError(subRes, 'Failed to load profile submission');
            if (!subRes.data) {
                throw toError('Submission not found', 404);
            }

            const submission = subRes.data;
            let publishedProfileId = submission.published_profile_id || null;
            const lng = toFiniteNumberOrNull(submission.lng);
            const lat = toFiniteNumberOrNull(submission.lat);
            const ownerId = isUuidValue(submission.owner_id)
                ? submission.owner_id
                : (isUuidValue(approverUserId) ? approverUserId : null);
            const submissionShezhireEntries = hasShezhireEntriesColumn
                ? normalizeShezhireEntries(submission.shezhire_entries)
                : [];

            if (publishedProfileId && isUuidValue(publishedProfileId)) {
                const existingProfileRes = await db
                    .from('profiles')
                    .select('id, owner_id')
                    .eq('id', publishedProfileId)
                    .maybeSingle();

                throwIfError(existingProfileRes, 'Failed to sync existing published profile');

                if (existingProfileRes.data) {
                    const profilePatch = { visibility_status: 'private' };
                    if (!existingProfileRes.data.owner_id && ownerId) {
                        profilePatch.owner_id = ownerId;
                    }

                    const syncProfileRes = await db
                        .from('profiles')
                        .update(profilePatch)
                        .eq('id', publishedProfileId);
                    throwIfError(syncProfileRes, 'Failed to lock profile visibility');
                } else {
                    // Stale reference: recreate profile and relink submission.
                    publishedProfileId = null;
                }
            }

            if (!publishedProfileId) {

                const profilePayload = {
                    first_name: (submission.full_name || '').trim() || getI18nText('common_unknown', 'Unknown'),
                    last_name: null,
                    patronymic: null,
                    birth_date: toSafeYearDateLoose(submission.birth_year),
                    death_date: toSafeYearDateLoose(submission.death_year),
                    biography: submission.description ? String(submission.description).trim() : null,
                    shezhire_entries: submissionShezhireEntries,
                    visibility_status: 'private',
                    owner_id: ownerId,
                    cemetery_id: isUuidValue(submission.cemetery_id) ? submission.cemetery_id : null,
                    location: (lng !== null && lat !== null) ? `SRID=4326;POINT(${lng} ${lat})` : null,
                };
                let createRes = await db.from('profiles').insert([profilePayload]).select('id').single();
                if (createRes?.error && isMissingColumnError(createRes.error, 'shezhire_entries')) {
                    const fallbackPayload = { ...profilePayload };
                    delete fallbackPayload.shezhire_entries;
                    createRes = await db.from('profiles').insert([fallbackPayload]).select('id').single();
                }

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
        mfaQrImage.alt = config.qrCode
            ? getI18nText('admin_mfa_qr_alt', 'QR-код для приложения-аутентификатора')
            : '';
    }

    if (mfaSecretWrap) {
        mfaSecretWrap.style.display = config.secret ? 'block' : 'none';
    }

    if (mfaSecret) {
        mfaSecret.textContent = config.secret || '';
    }

    if (mfaVerifyBtn) {
        mfaVerifyBtn.textContent = config.buttonLabel || getI18nText('admin_mfa_verify', 'Подтвердить код');
    }

    if (mfaCancelBtn) {
        mfaCancelBtn.textContent = config.cancelLabel || getI18nText('admin_nav_logout', 'Выйти');
    }

    if (mfaCodeInput) {
        mfaCodeInput.value = '';
        mfaCodeInput.focus();
    }

    setMfaButtonState(false, config.buttonLabel || getI18nText('admin_mfa_verify', 'Подтвердить код'));
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
        buttonLabel: getI18nText('admin_mfa_setup_btn', 'Включить защиту'),
    };

    showMfaStep({
        title: getI18nText('admin_mfa_setup_title', 'Подключите приложение-аутентификатор'),
        text: getI18nText('admin_mfa_setup_text', 'Отсканируйте QR-код в Google Authenticator или аналогичном приложении, затем введите 6-значный код.'),
        qrCode: data.totp?.qr_code || '',
        secret: data.totp?.secret || '',
        buttonLabel: pendingMfa.buttonLabel,
        cancelLabel: getI18nText('admin_nav_logout', 'Выйти'),
    });
}

async function promptForMfaVerification(factorId) {
    pendingMfa = {
        mode: 'verify',
        factorId,
        buttonLabel: getI18nText('admin_mfa_verify_login_btn', 'Подтвердить вход'),
    };

    showMfaStep({
        title: getI18nText('admin_mfa_title', 'Подтвердите вход'),
        text: getI18nText('admin_mfa_login_text', 'Введите 6-значный код из Google Authenticator, чтобы открыть админку.'),
        qrCode: '',
        secret: '',
        buttonLabel: pendingMfa.buttonLabel,
        cancelLabel: getI18nText('admin_nav_logout', 'Выйти'),
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
            showGateMessage('success', getI18nText('admin_mfa_password_ok_verify', 'Пароль принят. Подтвердите вход кодом из приложения-аутентификатора.'));
            await promptForMfaVerification(verifiedTotpFactor.id);
            return;
        }

        showGateMessage('success', getI18nText('admin_mfa_password_ok_setup', 'Пароль принят. Теперь нужно один раз включить двухфакторную защиту.'));
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
        showGateMessage('error', error.message || getI18nText('admin_mfa_prepare_failed', 'Не удалось подготовить двухфакторную проверку.'));
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.db || !window.getSession) {
        console.error('[Admin] Supabase client is not initialized. Check src/js/config.public.js / src/js/config.js.');
        showGate();
        showGateMessage('error', getI18nText('admin_supabase_not_configured', 'Supabase client не настроен. Проверьте SUPABASE_URL и SUPABASE_ANON_KEY.'));
        return;
    }

    const { emailInput } = getGateElements();
    const savedEmail = localStorage.getItem(ADMIN_EMAIL_STORAGE_KEY);

    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
    }

    setupManageBindings();
    document.addEventListener('langchange', () => {
        if (currentTab === 'manage') {
            renderManageTab(allData.manage || []);
        }
    });

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
                showGateMessage('error', toAuthUiErrorMessage(error, getI18nText('admin_auth_network_err', 'Сетевая ошибка авторизации.')));
                return;
            }
            if (isSupabaseLockAbortError(error)) {
                showGateMessage('error', getI18nText('admin_auth_parallel_err', 'Повторите вход. Обнаружены параллельные запросы авторизации.'));
                return;
            }

            showGateMessage('error', error.message || getI18nText('admin_auth_generic_err', 'Ошибка авторизации.'));
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
        showGateMessage('error', getI18nText('admin_gate_email_required', 'Введите admin email.'));
        return;
    }

    if (!password) {
        showGateMessage('error', getI18nText('admin_gate_pass_required', 'Введите пароль администратора.'));
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
        showGateMessage('error', toAuthUiErrorMessage(error, getI18nText('admin_gate_signin_failed', 'Не удалось выполнить вход.')));
        setLoginButtonState(false);
        setMagicLinkButtonState(false);
        return;
    }

    const { error } = loginResult;

    if (error) {
        const message = error.message === 'Invalid login credentials'
            ? getI18nText('admin_gate_invalid_creds', 'Неверный email или пароль.')
            : (error.message || getI18nText('admin_gate_signin_failed', 'Не удалось выполнить вход.'));
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
        showGateMessage('error', getI18nText('admin_gate_magic_email_required', 'Введите admin email, на который нужно отправить Magic Link.'));
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
        showGateMessage('error', toAuthUiErrorMessage(error, getI18nText('admin_gate_magic_failed', 'Не удалось отправить Magic Link.')));
        setLoginButtonState(false);
        setMagicLinkButtonState(false);
        return;
    }

    const { error } = otpResult;

    if (error) {
        const message = error.message && error.message.includes('Signups not allowed for otp')
            ? getI18nText('admin_gate_magic_not_admin', 'Этот email не зарегистрирован как администратор. Сначала добавьте его через scripts/register_admin_email.js.')
            : (error.message || getI18nText('admin_gate_magic_failed', 'Не удалось отправить Magic Link.'));
        showGateMessage('error', message);
        setLoginButtonState(false);
        setMagicLinkButtonState(false);
        return;
    }

    showGateMessage('success', getI18nText('admin_gate_magic_sent', 'Письмо отправлено. После перехода по ссылке админка всё равно попросит код из приложения-аутентификатора.'));
    setLoginButtonState(false);
    setMagicLinkButtonState(false);
}

async function verifyMfaCode() {
    if (!pendingMfa?.factorId) {
        showGateMessage('error', getI18nText('admin_mfa_signin_first', 'Сначала выполните вход по email и паролю.'));
        return;
    }

    const code = getMfaCode();
    if (!/^\d{6}$/.test(code)) {
        showGateMessage('error', getI18nText('admin_mfa_code_invalid', 'Введите 6-значный код из приложения-аутентификатора.'));
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
        showGateMessage('error', toAuthUiErrorMessage(error, getI18nText('admin_mfa_verify_failed', 'Не удалось проверить код.')));
        setMfaButtonState(false, pendingMfa.buttonLabel);
        return;
    }

    const { error } = verifyResult;

    if (error) {
        let message = error.message === 'Invalid TOTP code entered'
            ? getI18nText('admin_mfa_code_wrong', 'Неверный или просроченный код. Попробуйте еще раз.')
            : (error.message || getI18nText('admin_mfa_code_failed', 'Не удалось подтвердить код.'));
        showGateMessage('error', message);
        setMfaButtonState(false, pendingMfa.buttonLabel);
        return;
    }

    pendingMfa = null;
    showGateMessage('success', getI18nText('admin_mfa_signed_in', 'Вход подтверждён.'));
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

function formatCemeteryOptionLabel(item) {
    const name = normalizeTextValue(item?.name, 200) || getI18nText('admin_cemetery_unnamed', 'Без названия');
    const city = normalizeTextValue(item?.city, 120);
    const region = normalizeTextValue(item?.region, 120);
    const parts = [name];
    if (city) {
        parts.push(city);
    }
    if (region) {
        parts.push(region);
    }
    return parts.join(' — ');
}

function rebuildCemeteryMaps() {
    cemeteryLabelToIdMap = new Map();
    cemeteryIdToLabelMap = new Map();

    const duplicateCounter = new Map();
    cemeteryCatalog.forEach((item) => {
        const base = formatCemeteryOptionLabel(item);
        duplicateCounter.set(base, (duplicateCounter.get(base) || 0) + 1);
    });

    cemeteryCatalog.forEach((item) => {
        const base = formatCemeteryOptionLabel(item);
        const isDuplicate = (duplicateCounter.get(base) || 0) > 1;
        const label = isDuplicate
            ? `${base} · ${String(item.id || '').slice(0, 8)}`
            : base;

        if (isUuidValue(item.id)) {
            cemeteryLabelToIdMap.set(label, item.id);
            cemeteryIdToLabelMap.set(item.id, label);
        }
    });
}

function renderCemeteryDatalist(listId) {
    const list = document.getElementById(listId);
    if (!list) {
        return;
    }

    list.innerHTML = '';
    cemeteryCatalog.forEach((item) => {
        const label = cemeteryIdToLabelMap.get(item.id);
        if (!label) {
            return;
        }
        const option = document.createElement('option');
        option.value = label;
        list.appendChild(option);
    });
}

function syncCemeterySelection(prefix) {
    const input = document.getElementById(`${prefix}_cemeteryInput`);
    const hidden = document.getElementById(`${prefix}_cemeteryId`);
    if (!input || !hidden) {
        return;
    }

    const value = String(input.value || '').trim();
    if (!value) {
        hidden.value = '';
        return;
    }

    hidden.value = cemeteryLabelToIdMap.get(value) || '';
}

function setCemeterySelection(prefix, cemeteryId, fallbackLabel = '') {
    const input = document.getElementById(`${prefix}_cemeteryInput`);
    const hidden = document.getElementById(`${prefix}_cemeteryId`);
    if (!input || !hidden) {
        return;
    }

    if (isUuidValue(cemeteryId) && cemeteryIdToLabelMap.has(cemeteryId)) {
        input.value = cemeteryIdToLabelMap.get(cemeteryId);
        hidden.value = cemeteryId;
        return;
    }

    hidden.value = '';
    input.value = fallbackLabel || '';
}

function getSelectedCemeteryId(prefix) {
    const input = document.getElementById(`${prefix}_cemeteryInput`);
    const hidden = document.getElementById(`${prefix}_cemeteryId`);
    if (!input || !hidden) {
        return null;
    }

    syncCemeterySelection(prefix);

    const typedValue = String(input.value || '').trim();
    const cemeteryId = String(hidden.value || '').trim();

    if (!typedValue) {
        return null;
    }

    if (!isUuidValue(cemeteryId)) {
        throw new Error(getI18nText('admin_cemetery_choose_from_list', 'Выберите место захоронения из списка'));
    }

    return cemeteryId;
}

function bindCemeteryInput(prefix) {
    const input = document.getElementById(`${prefix}_cemeteryInput`);
    if (!input || input.dataset.bound === '1') {
        return;
    }

    input.addEventListener('input', () => syncCemeterySelection(prefix));
    input.addEventListener('change', () => syncCemeterySelection(prefix));
    input.dataset.bound = '1';
}

async function ensureCemeteryCatalogLoaded(force = false) {
    if (cemeteryCatalogLoaded && !force) {
        return;
    }

    const response = await apiRequest('/admin/cemeteries');
    cemeteryCatalog = (response.items || [])
        .filter((item) => isUuidValue(item.id))
        .sort((a, b) => formatCemeteryOptionLabel(a).localeCompare(formatCemeteryOptionLabel(b), 'ru'));
    cemeteryCatalogLoaded = true;
    rebuildCemeteryMaps();
    renderCemeteryDatalist('cp_cemeteryOptions');
    renderCemeteryDatalist('ep_cemeteryOptions');
}

function buildProfilePayloadFromForm(prefix, { includeId = false } = {}) {
    const firstName = normalizeTextValue(document.getElementById(`${prefix}_firstName`)?.value, 100);
    if (!firstName) {
        throw new Error(getI18nText('admin_name_required', 'Имя обязательно'));
    }

    const birthYear = validateYearInput(
        document.getElementById(`${prefix}_birthYear`)?.value,
        getI18nText('admin_lbl_birth_year', 'Год рождения')
    );
    const deathYear = validateYearInput(
        document.getElementById(`${prefix}_deathYear`)?.value,
        getI18nText('admin_lbl_death_year', 'Год смерти')
    );

    const locationPayload = parseLocationInput(
        document.getElementById(`${prefix}_lat`)?.value,
        document.getElementById(`${prefix}_lng`)?.value
    );

    const payload = {
        first_name: firstName,
        last_name: normalizeTextValue(document.getElementById(`${prefix}_lastName`)?.value, 100),
        birth_year: birthYear,
        death_year: deathYear,
        biography: normalizeTextValue(document.getElementById(`${prefix}_bio`)?.value, 6000),
        shezhire_entries: collectShezhireEntries(prefix),
        cemetery_id: getSelectedCemeteryId(prefix),
        lat: locationPayload.lat,
        lng: locationPayload.lng,
    };

    if (includeId) {
        const profileId = normalizeTextValue(document.getElementById(`${prefix}_id`)?.value, 80);
        if (!isUuidValue(profileId)) {
            throw new Error(getI18nText('admin_profile_id_invalid', 'Некорректный ID профиля'));
        }
        payload.id = profileId;
    }

    return payload;
}

function resetProfileForm(prefix, formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }
    renderShezhireEntryRows(prefix);
    setCemeterySelection(prefix, null, '');
}

function getVisibilityLabel(status) {
    if (status === 'private') {
        return getI18nText('admin_vis_private', 'Скрыт');
    }
    if (status === 'family_only') {
        return getI18nText('admin_vis_family', 'Семья');
    }
    return getI18nText('admin_vis_public', 'Публичный');
}

function getVisibilityClass(status) {
    if (status === 'private') {
        return 'visibility-private';
    }
    if (status === 'family_only') {
        return 'visibility-family';
    }
    return 'visibility-public';
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
    if (!listContainer) {
        return;
    }

    listContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        try {
            await ensureCemeteryCatalogLoaded();
        } catch (cemError) {
            console.warn('Cemetery catalog is not available:', cemError);
            cemeteryCatalog = [];
            cemeteryCatalogLoaded = true;
            rebuildCemeteryMaps();
            renderCemeteryDatalist('cp_cemeteryOptions');
            renderCemeteryDatalist('ep_cemeteryOptions');
        }

        const payload = await apiRequest('/admin/profiles');
        allData.manage = payload.items || [];
        renderManageTab(allData.manage);
    } catch (err) {
        console.error(err);
        showToast(err.message || getI18nText('admin_manage_load_err', 'Ошибка загрузки базы профилей'), 'error');
        listContainer.innerHTML = `<div class="empty"><p>${escapeHtml(getI18nText('admin_load_error', 'Ошибка загрузки'))}</p></div>`;
    }
}

function renderManageTab(items) {
    const container = document.getElementById('manage-profiles-list');
    if (!container) {
        return;
    }

    if (!items.length) {
        container.innerHTML = `<div class="empty"><div class="empty-icon">✓</div><p>${escapeHtml(getI18nText('admin_manage_empty', 'Профилей пока нет'))}</p></div>`;
        return;
    }

    container.innerHTML = '';

    items.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'card';
        div.style.gridTemplateColumns = '1fr auto';

        const years = `${item.birth_date ? String(item.birth_date).substring(0, 4) : '?'} - ${item.death_date ? String(item.death_date).substring(0, 4) : '?'}`;
        const name = `${item.last_name || ''} ${item.first_name || ''}`.trim();
        const cemeteryLabel = item.cemetery_name || '-';
        const locationLabel = (Number.isFinite(item.lat) && Number.isFinite(item.lng))
            ? `${Number(item.lat).toFixed(6)}, ${Number(item.lng).toFixed(6)}`
            : '-';
        const visibilityStatus = item.visibility_status || 'public';
        const isPrivate = visibilityStatus === 'private';
        const safeName = escapeHtml(name || getI18nText('common_unknown', 'Unknown'));
        const safeYears = escapeHtml(years);
        const safeLegacySlug = escapeHtml(item.epitaph || '-');
        const safeUuid = escapeHtml(item.id || '-');
        const safeCemetery = escapeHtml(cemeteryLabel);
        const safeLocation = escapeHtml(locationLabel);
        const shezhireSummary = formatShezhireSummary(item.shezhire_entries);
        const safeShezhire = escapeHtml(shezhireSummary || '-');
        const safeVisibility = escapeHtml(getVisibilityLabel(visibilityStatus));
        const visibilityClass = getVisibilityClass(visibilityStatus);
        const profileUrl = `profile.html?id=${encodeURIComponent(String(item.id || ''))}`;

        div.innerHTML = `
        <div>
            <div class="card-title">${safeName}</div>
            <div class="card-meta-row" style="margin-top:8px;">
                <div class="card-meta-item">${escapeHtml(getI18nText('admin_lbl_years', 'Годы'))}: <span>${safeYears}</span></div>
                <div class="card-meta-item">${escapeHtml(getI18nText('admin_lbl_legacy_slug', 'Старый ID (slug)'))}: <span>${safeLegacySlug}</span></div>
            </div>
            <div class="card-meta-row" style="margin-top:4px;">
                <div class="card-meta-item">${escapeHtml(getI18nText('admin_lbl_cemetery', 'Место захоронения'))}: <span>${safeCemetery}</span></div>
                <div class="card-meta-item">${escapeHtml(getI18nText('admin_lbl_shezhire', 'Шежіре / род'))}: <span>${safeShezhire}</span></div>
            </div>
            <div class="card-meta-row" style="margin-top:4px;">
                <div class="card-meta-item">${escapeHtml(getI18nText('admin_lbl_coords', 'Координаты'))}: <span>${safeLocation}</span></div>
            </div>
            <div class="card-meta-row" style="margin-top:4px;">
                <div class="card-meta-item">UUID: <span style="font-family:monospace; font-size:0.75rem;">${safeUuid}</span></div>
                <span class="visibility-chip ${visibilityClass}">${safeVisibility}</span>
            </div>
        </div>
        <div class="card-actions" style="justify-content:center;">
            <a href="${profileUrl}" target="_blank" class="btn-approve" style="text-decoration:none; background:var(--gold-dim); color:var(--gold); border-color:rgba(212,175,55,0.3); padding:10px 16px;">${escapeHtml(getI18nText('admin_mp_open', 'Открыть профиль'))}</a>
            <button type="button" class="btn-neutral btn-edit-profile">${escapeHtml(getI18nText('admin_mp_edit', 'Изменить'))}</button>
            <button type="button" class="${isPrivate ? 'btn-approve' : 'btn-warning'} btn-toggle-visibility">${escapeHtml(isPrivate ? getI18nText('admin_mp_restore', 'Вернуть') : getI18nText('admin_mp_hide', 'Скрыть'))}</button>
            <button type="button" class="btn-reject btn-hard-delete">${escapeHtml(getI18nText('admin_mp_delete_hard', 'Удалить навсегда'))}</button>
        </div>`;

        div.querySelector('.btn-edit-profile')?.addEventListener('click', () => openEditProfileModal(item.id));
        div.querySelector('.btn-toggle-visibility')?.addEventListener('click', () => {
            if (isPrivate) {
                restoreProfile(item.id);
            } else {
                softDeleteProfile(item.id);
            }
        });
        div.querySelector('.btn-hard-delete')?.addEventListener('click', () => hardDeleteProfile(item.id));

        container.appendChild(div);
    });
}

function formatDateTime(value) {
    if (!value) {
        return '-';
    }
    try {
        return new Date(value).toLocaleString(getI18nLocale());
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
        container.innerHTML = `<div class="empty"><p>${escapeHtml(emptyText)}</p></div>`;
        return;
    }

    container.innerHTML = '';
    items.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'card';
        div.style.gridTemplateColumns = '1fr';

        const activeLabel = isSessionActive(item)
            ? getI18nText('admin_session_active', 'Активна')
            : getI18nText('admin_session_inactive', 'Неактивна');
        const endedLabel = item.ended_at
            ? `${formatDateTime(item.ended_at)} (${item.end_reason || getI18nText('admin_session_reason_not_set', 'причина не указана')})`
            : '—';
        const safeDeviceName = escapeHtml(item.device_name || getI18nText('admin_unknown_device', 'Неизвестное устройство'));
        const safeActiveLabel = escapeHtml(activeLabel);
        const safeEmail = escapeHtml(item.email || '-');
        const safeStartedAt = escapeHtml(formatDateTime(item.started_at));
        const safeLastSeen = escapeHtml(formatDateTime(item.last_seen_at));
        const safeEndedLabel = escapeHtml(endedLabel);
        const safeUserAgent = escapeHtml(item.user_agent || '-');

        div.innerHTML = `
        <div class="card-title">${safeDeviceName} — ${safeActiveLabel}</div>
        <div class="card-meta-row">
            <div class="card-meta-item">Email: <span>${safeEmail}</span></div>
            <div class="card-meta-item">${escapeHtml(getI18nText('admin_lbl_start', 'Начало'))}: <span>${safeStartedAt}</span></div>
        </div>
        <div class="card-meta-row">
            <div class="card-meta-item">${escapeHtml(getI18nText('admin_lbl_last_seen', 'Последняя активность'))}: <span>${safeLastSeen}</span></div>
            <div class="card-meta-item">${escapeHtml(getI18nText('admin_lbl_end', 'Завершена'))}: <span>${safeEndedLabel}</span></div>
        </div>
        <div class="card-detail" style="margin-top:8px; word-break:break-word;">${safeUserAgent}</div>
        `;
        container.appendChild(div);
    });
}

async function terminateOtherSessions() {
    try {
        const session = await withAuthRetry(() => getSession());
        if (!session?.user?.id) {
            showToast(getI18nText('admin_session_expired_msg', 'Сессия истекла. Войдите снова.'), 'error');
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

        showToast(getI18nText('admin_sessions_terminated', 'Все остальные сессии завершены.'), 'success');
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
        showToast(getI18nText('admin_sessions_terminate_failed', 'Не удалось завершить остальные сессии.'), 'error');
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
        renderSessionList(
            'sessions-active-list',
            active,
            getI18nText('admin_sessions_active_empty', 'Сейчас нет активных устройств')
        );
        renderSessionList(
            'sessions-history-list',
            items,
            getI18nText('admin_sessions_history_empty', 'История входов пока пуста')
        );
    } catch (error) {
        if (isAdminRoleRequiredError(error) || isRlsDeniedError(error)) {
            const message = isAdminRoleRequiredError(error)
                ? error.message
                : createAdminRoleRequiredError().message;
            await signOutForAdminRoleRequired(message);
            return;
        }
        console.error(error);
        activeContainer.innerHTML = `<div class="empty"><p>${escapeHtml(getI18nText('admin_sessions_active_load_err', 'Ошибка загрузки активных устройств'))}</p></div>`;
        historyContainer.innerHTML = `<div class="empty"><p>${escapeHtml(getI18nText('admin_sessions_history_load_err', 'Ошибка загрузки истории'))}</p></div>`;
        showToast(getI18nText('admin_sessions_load_err', 'Не удалось загрузить сессии'), 'error');
    }
}

function setupManageBindings() {
    bindCemeteryInput('cp');
    bindCemeteryInput('ep');
    renderShezhireEntryRows('cp');
    renderShezhireEntryRows('ep');

    const modal = document.getElementById('editProfileModal');
    if (modal && modal.dataset.bound !== '1') {
        modal.addEventListener('click', handleEditModalBackdrop);
        modal.dataset.bound = '1';
    }

    if (window.PhotoPicker) {
        window.PhotoPicker.init('cp-photo-picker-mount', { maxPhotos: 10 });
        // 'ep-photo-picker-mount' is initialized when openEditProfileModal is called
    }
}

async function handleCreateProfile(e) {
    e.preventDefault();

    const btn = document.getElementById('cp_submitBtn');
    const defaultLabel = getI18nText('admin_cp_submit', 'Создать профиль');
    const loadingLabel = getI18nText('admin_cp_submit_loading', 'Создание...');

    if (btn) {
        btn.disabled = true;
        btn.textContent = loadingLabel;
    }

    try {
        try {
            await ensureCemeteryCatalogLoaded();
        } catch (error) {
            console.warn('Cemetery catalog failed before create:', error);
        }
        const payload = buildProfilePayloadFromForm('cp');
        const { data: createdProfile } = await apiRequest('/admin/profiles', { method: 'POST', body: payload });
        
        // Upload Photos if any
        if (window.PhotoPicker && createdProfile?.id) {
            try {
                const session = await db.auth.getSession();
                const userId = session?.data?.session?.user?.id;
                if (userId) {
                    const photoRows = await window.PhotoPicker.uploadAllForContainer('cp-photo-picker-mount', db, userId, createdProfile.id);
                    await window.PhotoPicker.saveAndUpdateProfile(db, createdProfile.id, userId, photoRows);
                }
            } catch (err) {
                console.error('[Admin Photo Upload Error]', err);
                showToast('Профиль создан, но возникла ошибка при загрузке фото', 'warning');
            }
        }

        showToast(getI18nText('admin_toast_created', 'Профиль успешно создан'), 'success');
        resetProfileForm('cp', 'createProfileForm');
        if (window.PhotoPicker) {
            window.PhotoPicker.reset('cp-photo-picker-mount');
        }
        await loadManageProfiles();
    } catch (err) {
        console.error(err);
        showToast(err.message || getI18nText('admin_toast_create_err', 'Ошибка при создании профиля'), 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = defaultLabel;
        }
    }
}

async function openEditProfileModal(profileId) {
    const item = (allData.manage || []).find((entry) => entry.id === profileId);
    if (!item) {
        showToast(getI18nText('admin_profile_not_found', 'Профиль не найден'), 'error');
        return;
    }

    try {
        await ensureCemeteryCatalogLoaded();
    } catch (error) {
        console.warn('Cemetery catalog failed before edit:', error);
    }

    if (window.PhotoPicker) {
        // Load existing photos from DB
        try {
            const { data: existingPhotos } = await db
                .from('profile_photos')
                .select('*')
                .eq('profile_id', profileId)
                .order('sort_order', { ascending: true });
            
            window.PhotoPicker.init('ep-photo-picker-mount', { 
                maxPhotos: 10,
                existingPhotos: existingPhotos || []
            });
        } catch (err) {
            console.error('Failed to load photos for edit:', err);
            window.PhotoPicker.init('ep-photo-picker-mount', { maxPhotos: 10 });
        }
    }

    const modal = document.getElementById('editProfileModal');
    if (!modal) {
        return;
    }

    const firstNameInput = document.getElementById('ep_firstName');
    const lastNameInput = document.getElementById('ep_lastName');
    const birthYearInput = document.getElementById('ep_birthYear');
    const deathYearInput = document.getElementById('ep_deathYear');
    const bioInput = document.getElementById('ep_bio');
    const latInput = document.getElementById('ep_lat');
    const lngInput = document.getElementById('ep_lng');
    const idInput = document.getElementById('ep_id');

    if (idInput) idInput.value = item.id || '';
    if (firstNameInput) firstNameInput.value = item.first_name || '';
    if (lastNameInput) lastNameInput.value = item.last_name || '';
    if (birthYearInput) birthYearInput.value = item.birth_date ? String(item.birth_date).substring(0, 4) : '';
    if (deathYearInput) deathYearInput.value = item.death_date ? String(item.death_date).substring(0, 4) : '';
    if (bioInput) bioInput.value = item.biography || '';
    renderShezhireEntryRows('ep', item.shezhire_entries);
    if (latInput) latInput.value = Number.isFinite(item.lat) ? String(item.lat) : '';
    if (lngInput) lngInput.value = Number.isFinite(item.lng) ? String(item.lng) : '';

    setCemeterySelection('ep', item.cemetery_id, item.cemetery_name || '');
    modal.style.display = 'flex';
}

function closeEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (!modal) {
        return;
    }

    modal.style.display = 'none';
    resetProfileForm('ep', 'editProfileForm');
    if (window.PhotoPicker) {
        window.PhotoPicker.reset('ep-photo-picker-mount');
    }
}

function handleEditModalBackdrop(event) {
    const modal = document.getElementById('editProfileModal');
    if (!modal) {
        return;
    }
    if (event.target === modal) {
        closeEditProfileModal();
    }
}

async function handleEditProfile(event) {
    event.preventDefault();

    const btn = document.getElementById('ep_submitBtn');
    const defaultLabel = getI18nText('admin_ep_submit', 'Сохранить изменения');
    const loadingLabel = getI18nText('admin_ep_submit_loading', 'Сохраняем...');

    if (btn) {
        btn.disabled = true;
        btn.textContent = loadingLabel;
    }

    try {
        try {
            await ensureCemeteryCatalogLoaded();
        } catch (error) {
            console.warn('Cemetery catalog failed before update:', error);
        }
        const payload = buildProfilePayloadFromForm('ep', { includeId: true });
        await apiRequest('/admin/profiles', { method: 'PATCH', body: payload });

        // Handle Photo edits
        if (window.PhotoPicker) {
            try {
                const session = await db.auth.getSession();
                const userId = session?.data?.session?.user?.id;
                if (userId && payload.id) {
                    const photoRows = await window.PhotoPicker.uploadAllForContainer('ep-photo-picker-mount', db, userId, payload.id);
                    
                    // Delete old photos from DB to recreate them
                    await db.from('profile_photos').delete().eq('profile_id', payload.id);
                    
                    await window.PhotoPicker.saveAndUpdateProfile(db, payload.id, userId, photoRows);
                }
            } catch (err) {
                console.error('[Admin Photo Edit Error]', err);
                showToast('Данные сохранены, но ошибка при обновлении фото', 'warning');
            }
        }

        showToast(getI18nText('admin_toast_updated', 'Профиль обновлен'), 'success');
        closeEditProfileModal();
        await loadManageProfiles();
    } catch (error) {
        console.error(error);
        showToast(error.message || getI18nText('admin_toast_update_err', 'Ошибка при обновлении профиля'), 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = defaultLabel;
        }
    }
}

async function softDeleteProfile(profileId) {
    try {
        await apiRequest('/admin/profiles', {
            method: 'DELETE',
            body: { id: profileId, mode: 'soft' },
        });

        showToast(getI18nText('admin_toast_hidden', 'Профиль скрыт'), 'success');
        await loadManageProfiles();
    } catch (error) {
        console.error(error);
        showToast(error.message || getI18nText('admin_toast_hide_err', 'Не удалось скрыть профиль'), 'error');
    }
}

async function restoreProfile(profileId) {
    try {
        await apiRequest('/admin/profiles', {
            method: 'PATCH',
            body: { id: profileId, visibility_status: 'public' },
        });

        showToast(getI18nText('admin_toast_restored', 'Профиль снова публичный'), 'success');
        await loadManageProfiles();
    } catch (error) {
        console.error(error);
        showToast(error.message || getI18nText('admin_toast_restore_err', 'Не удалось вернуть профиль'), 'error');
    }
}

async function hardDeleteProfile(profileId) {
    const confirmPhrase = getHardDeleteConfirmPhrase();
    const promptText = `${getI18nText('admin_mp_delete_confirm', 'Для удаления введите:')} ${confirmPhrase}`;
    const confirmation = window.prompt(promptText, '');
    if (confirmation !== confirmPhrase) {
        showToast(getI18nText('admin_toast_delete_cancelled', 'Удаление отменено'), 'error');
        return;
    }

    try {
        await apiRequest('/admin/profiles', {
            method: 'DELETE',
            body: { id: profileId, mode: 'hard' },
        });

        showToast(getI18nText('admin_toast_deleted', 'Профиль удален навсегда'), 'success');
        await loadManageProfiles();
    } catch (error) {
        console.error(error);
        showToast(error.message || getI18nText('admin_toast_delete_err', 'Не удалось удалить профиль'), 'error');
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
        showToast(getI18nText('admin_data_load_err', 'Ошибка загрузки данных из Supabase'), 'error');
        showEmpty('names', getI18nText('admin_data_connect_err', 'Ошибка подключения к базе данных'));
        showEmpty('profiles', getI18nText('admin_data_connect_err', 'Ошибка подключения к базе данных'));
        showEmpty('bios', getI18nText('admin_data_connect_err', 'Ошибка подключения к базе данных'));
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
    const pendingSuffix = getI18nText('admin_nav_pending_suffix', 'на проверке');
    document.getElementById('totalPendingBadge').textContent = `${total} ${pendingSuffix}`;
}

function showLoading(tab) {
    document.getElementById(`content-${tab}`).innerHTML = '<div class="loading"><div class="spinner"></div></div>';
}

function showEmpty(tab, msg = getI18nText('admin_empty_requests', 'Заявок нет')) {
    document.getElementById(`content-${tab}`).innerHTML = `<div class="empty"><div class="empty-icon">✓</div><p>${escapeHtml(msg)}</p></div>`;
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
    if (!lat || !lng) return getI18nText('common_unknown', 'Неизвестно');
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
    return bestR ? bestR.n_ru : getI18nText('common_unknown', 'Неизвестно');
}

function createCard(type, item) {
    const div = document.createElement('div');
    div.className = 'card';
    div.id = getCardDomId(item.id);

    const submitted = item.submitted_at || item.created_at;
    const dateStr = submitted ? new Date(submitted).toLocaleString(getI18nLocale()) : '-';
    const safeDateStr = escapeHtml(dateStr);
    const normalizedStatus = ['pending', 'approved', 'rejected'].includes(item.status) ? item.status : '';
    const statusClass = normalizedStatus ? `status-${normalizedStatus}` : '';
    const statusText = normalizedStatus === 'pending'
        ? getI18nText('admin_status_pending', 'На проверке')
        : normalizedStatus === 'approved'
            ? getI18nText('admin_status_approved', 'Одобрено')
            : normalizedStatus === 'rejected' ? getI18nText('admin_status_rejected', 'Отклонено') : '';

    let content = '';
    let badgeClass = '';
    let title = '';

    if (type === 'names') {
        badgeClass = 'badge-names';
        title = item.suggested_name || '';
        const cardUid = `cem-${toSafeDomId(item.id)}`;
        const safeCurrentName = escapeHtml(item.current_name || '-');
        const safeLat = escapeHtml(item.lat || '?');
        const safeLng = escapeHtml(item.lng || '?');
        const safeRegion = escapeHtml(getAdminRegion(item.lat, item.lng));
        const safeComment = item.comment ? `<div class="card-detail" style="margin-top:8px;">${escapeHtml(item.comment)}</div>` : '';

        content = `
        <div class="card-meta-row">
            <div class="card-meta-item">${escapeHtml(getI18nText('admin_lbl_current_name', 'Текущее название'))}: <span>${safeCurrentName}</span></div>
            <div class="card-meta-item">${escapeHtml(getI18nText('admin_lbl_coords', 'Координаты'))}: <span>${safeLat}, ${safeLng}</span></div>
        </div>
        <div class="card-meta-row">
            <div class="card-meta-item">${escapeHtml(getI18nText('admin_lbl_region', 'Область'))}: <span style="color:var(--gold);">${safeRegion}</span></div>
            <div class="card-meta-item" id="${cardUid}-district" style="display:none;">${escapeHtml(getI18nText('admin_lbl_district', 'Район'))}: <span style="color:var(--muted);"></span></div>
        </div>
        ${safeComment}`;

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
                } catch (e) { }
            }, 200);
        }
    } else if (type === 'profiles') {
        badgeClass = 'badge-profiles';
        title = item.full_name || '';
        const cardUid = `prof-${toSafeDomId(item.id)}`;
        const safeBirthYear = escapeHtml(item.birth_year || '?');
        const safeDeathYear = escapeHtml(item.death_year || '?');
        const safeShezhire = escapeHtml(formatShezhireSummary(item.shezhire_entries) || '-');
        const safeCemeteryName = escapeHtml(item.cemetery_name || '-');
        const safeLat = escapeHtml(item.lat || '?');
        const safeLng = escapeHtml(item.lng || '?');
        const safeRegion = escapeHtml(getAdminRegion(item.lat, item.lng));
        const safeDescription = item.description ? `<div class="card-detail" style="margin-top:8px;">${escapeHtml(item.description)}</div>` : '';

        content = `
        <div class="card-meta-row">
            <div class="card-meta-item">${escapeHtml(getI18nText('admin_lbl_years', 'Годы'))}: <span>${safeBirthYear} - ${safeDeathYear}</span></div>
            <div class="card-meta-item">${escapeHtml(getI18nText('admin_lbl_shezhire', 'Шежіре / род'))}: <span>${safeShezhire}</span></div>
        </div>
        <div class="card-meta-row">
            <div class="card-meta-item">${escapeHtml(getI18nText('admin_lbl_cemetery', 'Кладбище'))}: <span>${safeCemeteryName}</span></div>
            <div class="card-meta-item">${escapeHtml(getI18nText('admin_lbl_coords', 'Координаты'))}: <span>${safeLat}, ${safeLng}</span></div>
        </div>
        <div class="card-meta-row">
            <div class="card-meta-item">${escapeHtml(getI18nText('admin_lbl_region', 'Область'))}: <span style="color:var(--gold);">${safeRegion}</span></div>
        </div>
        <div class="card-meta-row">
            <div class="card-meta-item" id="${cardUid}-district" style="display:none;">${escapeHtml(getI18nText('admin_lbl_district', 'Район'))}: <span style="color:var(--muted);"></span></div>
        </div>
        ${safeDescription}`;

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
                } catch (e) { }
            }, 200);
        }
    } else if (type === 'bios') {
        badgeClass = 'badge-bios';
        const shortProfileId = (item.profile_id || '').substring(0, 8) || '?';
        title = `${getI18nText('admin_lbl_bio_addition', 'Дополнение к профилю')} #${shortProfileId}`;
        const safeAuthor = item.author_name ? `<div class="card-detail" style="margin-bottom:6px;">${escapeHtml(getI18nText('admin_lbl_author', 'Автор'))}: <strong>${escapeHtml(item.author_name)}</strong></div>` : '';
        const safeBioText = escapeHtml(item.bio_text || '');
        content = `
        ${safeAuthor}
        <div class="card-detail" style="background:#18181b; border-radius:8px; padding:10px; margin-top:6px; line-height:1.6;">"${safeBioText}"</div>`;
    } else if (type === 'leads') {
        badgeClass = 'badge-profiles';
        title = `${getI18nText('admin_lbl_order', 'Заказ')}: ${item.service_type || ''}`;
        const safeCustomerName = escapeHtml(item.customer_name || '-');
        const safeCustomerPhone = escapeHtml(item.customer_phone || '-');
        const safeProfileRef = escapeHtml(item.profile_ref || '-');
        const safePrice = escapeHtml(item.price || '-');
        const safeComment = item.comment ? `<div class="card-detail" style="margin-top:8px;">${escapeHtml(item.comment)}</div>` : '';

        content = `
        <div class="card-meta-row">
            <div class="card-meta-item">${escapeHtml(getI18nText('admin_lbl_customer', 'Клиент'))}: <span>${safeCustomerName}</span></div>
            <div class="card-meta-item">${escapeHtml(getI18nText('admin_lbl_phone', 'Телефон'))}: <span>${safeCustomerPhone}</span></div>
        </div>
        <div class="card-meta-row">
            <div class="card-meta-item">${escapeHtml(getI18nText('admin_lbl_profile', 'Профиль'))}: <span>${safeProfileRef}</span></div>
            <div class="card-meta-item">${escapeHtml(getI18nText('admin_lbl_price', 'Цена'))}: <span>${safePrice} ₸</span></div>
        </div>
        ${safeComment}`;
    }

    const typeLabel = type === 'names'
        ? getI18nText('admin_type_name', 'Название')
        : type === 'profiles'
            ? getI18nText('admin_type_profile', 'Личность')
            : type === 'bios'
                ? getI18nText('admin_type_bio', 'Биография')
                : getI18nText('admin_type_lead', 'Заказ');
    const safeTitle = escapeHtml(title || '');

    let actionsHtml = '';
    if (normalizedStatus === 'pending') {
        actionsHtml = `
            <button class="btn-approve">${escapeHtml(getI18nText('admin_btn_approve', 'Одобрить'))}</button>
            <button class="btn-reject">${escapeHtml(getI18nText('admin_btn_reject', 'Отклонить'))}</button>`;
    } else if (normalizedStatus) {
        actionsHtml = `
            <span style="font-size:0.75rem; color:var(--muted); text-align:right;">${escapeHtml(getI18nText('admin_status_already_processed', 'Уже обработано'))}</span>
            <button class="btn-reject btn-reset-status" style="background:transparent; color:var(--muted); border-color:var(--border); margin-top:5px;">${escapeHtml(getI18nText('admin_btn_reset_status', 'Отменить (Вернуть)'))}</button>`;
    }

    div.innerHTML = `
    <div>
        <span class="card-type-badge ${badgeClass}">${escapeHtml(typeLabel)}</span>
        <div class="card-title">${safeTitle}</div>
        ${content}
        <div class="card-meta-row" style="margin-top:12px;">
            <div class="card-meta-item">${escapeHtml(getI18nText('admin_lbl_time', 'Время'))}: <span>${safeDateStr}</span></div>
            ${normalizedStatus ? `<span class="status-chip ${statusClass}">${escapeHtml(statusText)}</span>` : ''}
        </div>
    </div>
    <div class="card-actions">
        ${actionsHtml}
    </div>`;

    const approveBtn = div.querySelector('.btn-approve');
    if (approveBtn) {
        approveBtn.addEventListener('click', () => updateStatus(type, item.id, 'approved'));
    }

    const rejectBtn = div.querySelector('.btn-reject');
    if (rejectBtn && !rejectBtn.classList.contains('btn-reset-status')) {
        rejectBtn.addEventListener('click', () => updateStatus(type, item.id, 'rejected'));
    }

    const resetBtn = div.querySelector('.btn-reset-status');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => updateStatus(type, item.id, 'pending'));
    }

    return div;
}

async function updateStatus(type, id, status) {
    const cardDomId = getCardDomId(id);
    const btnApprove = document.querySelector(`#${cardDomId} .btn-approve`);
    const btnReject = document.querySelector(`#${cardDomId} .btn-reject`);
    
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

        const card = document.getElementById(cardDomId);
        if (card && item) {
            const newCard = createCard(type, item);
            card.replaceWith(newCard);
        }

        const approvedMsg = type === 'profiles'
            ? getI18nText('admin_status_approved_profile_private', 'Одобрено и добавлено в кабинет (приватно)')
            : getI18nText('admin_status_approved_short', 'Одобрено');
        showToast(
            status === 'approved'
                ? approvedMsg
                : (status === 'pending'
                    ? getI18nText('admin_status_returned', 'Возвращено на модерацию')
                    : getI18nText('admin_status_rejected_short', 'Заявка отклонена')),
            status === 'approved' ? 'success' : (status === 'pending' ? 'success' : 'error')
        );
    } catch (err) {
        console.error('Error updating status:', err);
        showToast(getI18nText('admin_status_update_err', 'Ошибка при обновлении статуса'), 'error');

        // Restore buttons if failed
        const card = document.getElementById(cardDomId);
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

