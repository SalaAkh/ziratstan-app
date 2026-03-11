// ------------------------------------------------------------
// ADMIN PANEL LOGIC - src/js/admin.js
// ------------------------------------------------------------

let currentTab = 'names';
let allData = { names: [], profiles: [], bios: [], manage: [] };
let hasLoadedDashboard = false;

const ADMIN_EMAIL_STORAGE_KEY = 'ziratstan_admin_email';
const MFA_FACTOR_NAME = 'Ziratstan Admin';

let pendingMfa = null;
let authFlowId = 0;
let authSyncQueue = Promise.resolve();

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

async function withAuthRetry(fn) {
    let attempt = 0;

    while (attempt < AUTH_RETRY_MAX_ATTEMPTS) {
        try {
            return await fn();
        } catch (error) {
            attempt += 1;
            if (!isSupabaseLockAbortError(error) || attempt >= AUTH_RETRY_MAX_ATTEMPTS) {
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

    if (path === '/admin/bootstrap' && method === 'GET') {
        const [namesRes, profilesRes, biosRes] = await Promise.all([
            db.from('ugc_submissions').select('*').order('submitted_at', { ascending: false }).limit(100),
            db.from('ugc_profile_submissions').select('*').order('submitted_at', { ascending: false }).limit(100),
            db.from('ugc_bio_submissions').select('*').order('submitted_at', { ascending: false }).limit(100),
        ]);

        throwIfError(namesRes, 'Failed to load name submissions');
        throwIfError(profilesRes, 'Failed to load profile submissions');
        throwIfError(biosRes, 'Failed to load biography submissions');

        return {
            names: namesRes.data || [],
            profiles: profilesRes.data || [],
            bios: biosRes.data || [],
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
        };

        const table = tableMap[body.type];
        if (!table || !body.id || !['approved', 'rejected'].includes(body.status)) {
            throw toError('Invalid payload', 400);
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
    showLoginStep();
}

function getMfaCode() {
    const { mfaCodeInput } = getGateElements();
    return (mfaCodeInput?.value || '').replace(/\s+/g, '');
}

async function getAuthenticatorAssuranceLevel() {
    const { data, error } = await withAuthRetry(() => db.auth.mfa.getAuthenticatorAssuranceLevel());
    if (error) {
        throw error;
    }

    return data || { currentLevel: null, nextLevel: null };
}

async function getVerifiedTotpFactor() {
    const { data, error } = await withAuthRetry(() => db.auth.mfa.listFactors());
    if (error) {
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
        showGate();
        resetGateMessages();
        return;
    }

    cleanupAuthUrl();

    try {
        const aal = await getAuthenticatorAssuranceLevel();
        if (flowId !== authFlowId) {
            return;
        }

        if (aal.currentLevel === 'aal2') {
            pendingMfa = null;
            resetGateMessages();
            showPanel();
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
        console.error(error);
        showGate();
        showGateMessage('error', error.message || 'Не удалось подготовить двухфакторную проверку.');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const { emailInput } = getGateElements();
    const savedEmail = localStorage.getItem(ADMIN_EMAIL_STORAGE_KEY);

    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
    }

    db.auth.onAuthStateChange((_event, session) => {
        queueAuthSync(session).catch((error) => {
            console.error(error);
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

    const { error } = await withAuthRetry(() => db.auth.signInWithPassword({ email, password }));

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

    const { error } = await withAuthRetry(() => db.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: getAdminRedirectUrl(),
            shouldCreateUser: false,
        },
    }));

    if (error) {
        const message = error.message && error.message.includes('Signups not allowed for otp')
            ? 'Этот email не зарегистрирован как администратор. Сначала добавьте его через register_admin_email.js.'
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

    const { error } = await withAuthRetry(() => db.auth.mfa.challengeAndVerify({
        factorId: pendingMfa.factorId,
        code,
    }));

    if (error) {
        showGateMessage('error', error.message || 'Не удалось подтвердить код.');
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
    await withAuthRetry(() => db.auth.signOut());
    showGate();
    resetGateMessages();
}

async function logout() {
    pendingMfa = null;
    await withAuthRetry(() => db.auth.signOut());
    showGate();
    resetGateMessages();
    setLoginButtonState(false);
}

function switchTab(tab, btn) {
    currentTab = tab;
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    btn.classList.add('active');

    ['names', 'profiles', 'bios', 'manage'].forEach((t) => {
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

    try {
        const payload = await apiRequest('/admin/bootstrap');

        allData.names = payload.names || [];
        allData.profiles = payload.profiles || [];
        allData.bios = payload.bios || [];

        renderTab('names', allData.names);
        renderTab('profiles', allData.profiles);
        renderTab('bios', allData.bios);
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
    const total = pendingN + pendingP + pendingB;

    document.getElementById('cnt-names').textContent = pendingN;
    document.getElementById('cnt-profiles').textContent = pendingP;
    document.getElementById('cnt-bios').textContent = pendingB;
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

function createCard(type, item) {
    const div = document.createElement('div');
    div.className = 'card';
    div.id = `card-${item.id}`;

    const submitted = new Date(item.submitted_at).toLocaleString('ru-KZ');
    const statusClass = `status-${item.status}`;
    const statusText = item.status === 'pending'
        ? 'На проверке'
        : item.status === 'approved'
            ? 'Одобрено'
            : 'Отклонено';

    let content = '';
    let badgeClass = '';
    let title = '';

    if (type === 'names') {
        badgeClass = 'badge-names';
        title = item.suggested_name;
        content = `
        <div class="card-meta-row">
            <div class="card-meta-item">Текущее название: <span>${item.current_name || '-'}</span></div>
            <div class="card-meta-item">Координаты: <span>${item.lat || '?'}, ${item.lng || '?'}</span></div>
        </div>
        ${item.comment ? `<div class="card-detail" style="margin-top:8px;">${item.comment}</div>` : ''}`;
    } else if (type === 'profiles') {
        badgeClass = 'badge-profiles';
        title = item.full_name;
        content = `
        <div class="card-meta-row">
            <div class="card-meta-item">Годы: <span>${item.birth_year || '?'} - ${item.death_year || '?'}</span></div>
            <div class="card-meta-item">Кладбище: <span>${item.cemetery_name || '-'}</span></div>
        </div>
        ${item.description ? `<div class="card-detail" style="margin-top:8px;">${item.description}</div>` : ''}`;
    } else if (type === 'bios') {
        badgeClass = 'badge-bios';
        title = `Дополнение к профилю #${item.profile_id?.substring(0, 8) || '?'}`;
        content = `
        ${item.author_name ? `<div class="card-detail" style="margin-bottom:6px;">От: <strong>${item.author_name}</strong></div>` : ''}
        <div class="card-detail" style="background:#18181b; border-radius:8px; padding:10px; margin-top:6px; line-height:1.6;">"${item.bio_text}"</div>`;
    }

    const typeLabel = type === 'names' ? 'Название' : type === 'profiles' ? 'Личность' : 'Биография';

    div.innerHTML = `
    <div>
        <span class="card-type-badge ${badgeClass}">${typeLabel}</span>
        <div class="card-title">${title}</div>
        ${content}
        <div class="card-meta-row" style="margin-top:12px;">
            <div class="card-meta-item">Время: <span>${submitted}</span></div>
            <span class="status-chip ${statusClass}">${statusText}</span>
        </div>
    </div>
    <div class="card-actions">
        ${item.status === 'pending' ? `
            <button class="btn-approve" onclick="updateStatus('${type}', '${item.id}', 'approved')">Одобрить</button>
            <button class="btn-reject" onclick="updateStatus('${type}', '${item.id}', 'rejected')">Отклонить</button>
        ` : '<span style="font-size:0.75rem; color:var(--muted); text-align:right;">Уже обработано</span>'}
    </div>`;

    return div;
}

async function updateStatus(type, id, status) {
    const btn = document.querySelector(`#card-${id} .btn-${status === 'approved' ? 'approve' : 'reject'}`);
    if (btn) {
        btn.disabled = true;
        btn.textContent = '...';
    }

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

        showToast(
            status === 'approved' ? 'Одобрено и опубликовано' : 'Заявка отклонена',
            status === 'approved' ? 'success' : 'error'
        );
    } catch (err) {
        console.error('Error updating status:', err);
        showToast('Ошибка при обновлении статуса', 'error');

        if (btn) {
            btn.disabled = false;
            btn.textContent = status === 'approved' ? 'Одобрить' : 'Отклонить';
        }
    }
}

function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast toast-${type} show`;
    setTimeout(() => t.classList.remove('show'), 3000);
}
