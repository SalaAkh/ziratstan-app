// ─────────────────────────────────────────────
//  ADMIN PANEL LOGIC — src/js/admin.js
//  Extracted from inline <script> in admin.html
// ─────────────────────────────────────────────

let currentTab = 'names';
let allData = { names: [], profiles: [], bios: [], manage: [] };

// ── INIT AUTH ──
document.addEventListener('DOMContentLoaded', async () => {
    const session = await getSession(); // From supabase/client.js
    if (session) {
        document.getElementById('gate').style.display = 'none';
        document.getElementById('panel').style.display = 'block';
        loadAllData();
    }
});

// ── GATE ──
async function loginUser() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const btn = document.getElementById('loginBtn');
    const err = document.getElementById('gateError');

    if (!email || !password) {
        err.textContent = 'Введите email и пароль';
        err.style.display = 'block';
        return;
    }

    btn.textContent = 'Вход...';
    btn.disabled = true;

    const { data, error } = await db.auth.signInWithPassword({ email, password });

    if (error) {
        err.textContent = error.message === 'Invalid login credentials' ? 'Неверный логин или пароль.' : error.message;
        err.style.display = 'block';
        document.getElementById('passwordInput').style.borderColor = 'var(--red)';
        btn.textContent = 'Войти';
        btn.disabled = false;
    } else {
        err.style.display = 'none';
        document.getElementById('gate').style.display = 'none';
        document.getElementById('panel').style.display = 'block';
        loadAllData();
    }
}

async function logout() {
    await db.auth.signOut();
    document.getElementById('gate').style.display = 'flex';
    document.getElementById('panel').style.display = 'none';
    document.getElementById('passwordInput').value = '';
    document.getElementById('gateError').style.display = 'none';
    document.getElementById('loginBtn').textContent = 'Войти';
    document.getElementById('loginBtn').disabled = false;
}

// ── TABS ──
function switchTab(tab, btn) {
    currentTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    ['names', 'profiles', 'bios', 'manage'].forEach(t => {
        const el = document.getElementById(`content-${t}`);
        if (el) {
            el.style.display = t === tab ? 'flex' : 'none';
            el.style.flexDirection = 'column';
        }
    });

    if (tab === 'manage' && (!allData.manage || allData.manage.length === 0)) {
        loadManageProfiles();
    }
}

async function loadManageProfiles() {
    const listContainer = document.getElementById('manage-profiles-list');
    listContainer.innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
    try {
        if (typeof fetchAllAdminProfiles === 'function') {
            const data = await fetchAllAdminProfiles();
            allData.manage = data || [];
            renderManageTab(allData.manage);
        }
    } catch (err) {
        console.error(err);
        showToast('❌ Ошибка загрузки базы профилей', 'error');
        listContainer.innerHTML = `<div class="empty"><p>Ошибка загрузки</p></div>`;
    }
}

function renderManageTab(items) {
    const container = document.getElementById('manage-profiles-list');
    if (!items.length) {
        container.innerHTML = `<div class="empty"><div class="empty-icon">✅</div><p>Профилей пока нет</p></div>`;
        return;
    }
    container.innerHTML = '';
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'card';
        div.style.gridTemplateColumns = '1fr auto';

        const years = `${item.birth_date ? item.birth_date.substring(0, 4) : '?'} — ${item.death_date ? item.death_date.substring(0, 4) : '?'}`;
        const name = `${item.last_name || ''} ${item.first_name || ''}`.trim();

        div.innerHTML = `
        <div>
            <div class="card-title">${name}</div>
            <div class="card-meta-row" style="margin-top:8px;">
                <div class="card-meta-item">📅 <span>${years}</span></div>
                <div class="card-meta-item">Старый ID (slug): <span>${item.epitaph || '—'}</span></div>
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
        biography: document.getElementById('cp_bio').value
    };

    try {
        if (typeof createAdminProfile === 'function') {
            await createAdminProfile(payload);
            showToast('✅ Профиль успешно создан!', 'success');
            document.getElementById('createProfileForm').reset();
            loadManageProfiles();
        }
    } catch (err) {
        console.error(err);
        showToast('❌ Ошибка при создании профиля', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Создать профиль';
    }
}

// ── LOAD DATA ──
async function loadAllData() {
    showLoading('names'); showLoading('profiles'); showLoading('bios');

    try {
        const [namesRes, profilesRes, biosRes] = await Promise.all([
            db.from('ugc_submissions').select('*').order('submitted_at', { ascending: false }).limit(100),
            db.from('ugc_profile_submissions').select('*').order('submitted_at', { ascending: false }).limit(100),
            db.from('ugc_bio_submissions').select('*').order('submitted_at', { ascending: false }).limit(100),
        ]);

        allData.names = namesRes.data || [];
        allData.profiles = profilesRes.data || [];
        allData.bios = biosRes.data || [];

        renderTab('names', allData.names);
        renderTab('profiles', allData.profiles);
        renderTab('bios', allData.bios);

        updateCounts();
    } catch (err) {
        console.error('Error loading data:', err);
        showToast('❌ Ошибка загрузки данных из Supabase', 'error');
        showEmpty('names', 'Ошибка подключения к базе данных');
        showEmpty('profiles', 'Ошибка подключения к базе данных');
        showEmpty('bios', 'Ошибка подключения к базе данных');
    }
}

function updateCounts() {
    const pendingN = allData.names.filter(x => x.status === 'pending').length;
    const pendingP = allData.profiles.filter(x => x.status === 'pending').length;
    const pendingB = allData.bios.filter(x => x.status === 'pending').length;
    const total = pendingN + pendingP + pendingB;

    document.getElementById('cnt-names').textContent = pendingN;
    document.getElementById('cnt-profiles').textContent = pendingP;
    document.getElementById('cnt-bios').textContent = pendingB;
    document.getElementById('totalPendingBadge').textContent = `${total} на проверке`;
}

// ── RENDER ──
function showLoading(tab) {
    document.getElementById(`content-${tab}`).innerHTML = `<div class="loading"><div class="spinner"></div></div>`;
}

function showEmpty(tab, msg = 'Заявок нет') {
    document.getElementById(`content-${tab}`).innerHTML = `<div class="empty"><div class="empty-icon">✅</div><p>${msg}</p></div>`;
}

function renderTab(tab, items) {
    if (!items.length) { showEmpty(tab); return; }
    const container = document.getElementById(`content-${tab}`);
    container.innerHTML = '';
    items.forEach(item => container.appendChild(createCard(tab, item)));
}

function createCard(type, item) {
    const div = document.createElement('div');
    div.className = 'card';
    div.id = `card-${item.id}`;

    const submitted = new Date(item.submitted_at).toLocaleString('ru-KZ');
    const statusClass = `status-${item.status}`;
    const statusText = item.status === 'pending' ? 'На проверке' : item.status === 'approved' ? 'Одобрено' : 'Отклонено';

    let content = '';
    let badgeClass = '';
    let title = '';

    if (type === 'names') {
        badgeClass = 'badge-names';
        title = item.suggested_name;
        content = `
        <div class="card-meta-row">
            <div class="card-meta-item">Текущее название: <span>${item.current_name || '—'}</span></div>
            <div class="card-meta-item">Координаты: <span>${item.lat || '?'}, ${item.lng || '?'}</span></div>
        </div>
        ${item.comment ? `<div class="card-detail" style="margin-top:8px;">💬 ${item.comment}</div>` : ''}`;
    } else if (type === 'profiles') {
        badgeClass = 'badge-profiles';
        title = item.full_name;
        content = `
        <div class="card-meta-row">
            <div class="card-meta-item">Годы: <span>${item.birth_year || '?'} — ${item.death_year || '?'}</span></div>
            <div class="card-meta-item">Кладбище: <span>${item.cemetery_name || '—'}</span></div>
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
            <div class="card-meta-item">🕐 <span>${submitted}</span></div>
            <span class="status-chip ${statusClass}">${statusText}</span>
        </div>
    </div>
    <div class="card-actions">
        ${item.status === 'pending' ? `
            <button class="btn-approve" onclick="updateStatus('${type}', '${item.id}', 'approved')">✅ Одобрить</button>
            <button class="btn-reject" onclick="updateStatus('${type}', '${item.id}', 'rejected')">❌ Отклонить</button>
        ` : `<span style="font-size:0.75rem; color:var(--muted); text-align:right;">Уже обработано</span>`}
    </div>`;
    return div;
}

// ── ACTIONS ──
async function updateStatus(type, id, status) {
    const tableMap = {
        names: 'ugc_submissions',
        profiles: 'ugc_profile_submissions',
        bios: 'ugc_bio_submissions'
    };
    const table = tableMap[type];
    const btn = document.querySelector(`#card-${id} .btn-${status === 'approved' ? 'approve' : 'reject'}`);
    if (btn) { btn.disabled = true; btn.textContent = '⏳...'; }

    try {
        const { error } = await db.from(table).update({ status }).eq('id', id);
        if (error) throw error;

        const item = allData[type].find(x => x.id === id);
        if (item) item.status = status;
        updateCounts();

        const card = document.getElementById(`card-${id}`);
        if (card) {
            const newCard = createCard(type, item);
            card.replaceWith(newCard);
        }

        showToast(status === 'approved' ? '✅ Одобрено и опубликовано!' : '❌ Заявка отклонена', status === 'approved' ? 'success' : 'error');
    } catch (err) {
        console.error('Error updating status:', err);
        showToast('❌ Ошибка при обновлении статуса', 'error');
        if (btn) { btn.disabled = false; btn.textContent = status === 'approved' ? '✅ Одобрить' : '❌ Отклонить'; }
    }
}

// ── TOAST ──
function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast toast-${type} show`;
    setTimeout(() => t.classList.remove('show'), 3000);
}
