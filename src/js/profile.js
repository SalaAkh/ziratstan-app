// ─────────────────────────────────────────────
//  PROFILE PAGE LOGIC — src/js/profile.js
//  Extracted from inline <script> in profile.html
// ─────────────────────────────────────────────

// ── TOGGLE BIO ──
function toggleBio() {
    const fullBio = document.getElementById('fullBioSection');
    const shortBio = document.getElementById('biographyText');
    const btn = document.getElementById('readBioBtn');
    if (fullBio.style.display === 'none') {
        fullBio.style.display = 'block';
        shortBio.style.display = 'none';
        btn.textContent = 'Collapse biography';
    } else {
        fullBio.style.display = 'none';
        shortBio.style.display = '-webkit-box';
        btn.textContent = 'Read biography';
    }
}

// ── LOAD PROFILE ──
async function initProfile() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        showError();
        return;
    }

    let p = null;
    let realProfileId = id;

    // Попытка получить настоящий UUID базы (для всех профилей, включая статические)
    try {
        if (typeof fetchProfileIdBySlug === 'function') {
            const resolvedId = await fetchProfileIdBySlug(id);
            if (resolvedId) realProfileId = resolvedId;
        }
    } catch (err) {
        console.warn('[Ziratstan] Could not resolve profile UUID:', err);
    }

    // 1. Сначала ищем в PROFILES_STATIC (для slug-идов с карты: 'mirzhakyp_24' и т.д.)
    if (typeof PROFILES_STATIC !== 'undefined') {
        const staticMatch = PROFILES_STATIC.find(x => x.id === id);
        if (staticMatch) {
            p = {
                id: staticMatch.id,
                fullName: staticMatch.fullName || staticMatch.name || '—',
                name: staticMatch.name || staticMatch.fullName || '—',
                lastName: '',
                birth: staticMatch.birth || '?',
                death: staticMatch.death || '?',
                cemetery: staticMatch.cemetery || 'Белгісіз',
                city: staticMatch.city || '',
                photo: staticMatch.photo || '',
                bio: staticMatch.bio || '',
                epitaph: staticMatch.epitaph || '',
                filter: staticMatch.filter || 'historical'
            };
        }
    }

    // 2. Если в статике не нашли — пробуем Supabase (только для настоящих UUID)
    if (!p) {
        try {
            if (typeof fetchProfileById === 'function') {
                p = await fetchProfileById(realProfileId);
            } else {
                console.error('[Ziratstan] fetchProfileById missing');
            }
        } catch (err) {
            console.error('[Ziratstan] Error fetching profile:', err);
        }
    }

    if (!p) {
        showError();
        return;
    }

    // Set SEO tags
    document.getElementById('pageTitle').textContent = `${p.fullName} | Зиратстан`;
    document.getElementById('pageDesc').setAttribute('content', `Мемориалдық парақша: ${p.fullName} (${p.birth}–${p.death}). ${p.cemetery}, ${p.city}.`);

    // Hero section
    if (p.photo) {
        document.getElementById('heroImg').src = p.photo;
        document.getElementById('heroImg').alt = p.fullName;
        document.getElementById('heroImg').style.display = 'block';
        document.getElementById('heroPlaceholder').style.display = 'none';
    } else {
        document.getElementById('heroImg').style.display = 'none';
        document.getElementById('heroPlaceholder').style.display = 'flex';
    }

    const nameParts = p.fullName.split(' ');
    const lastName = nameParts[0];
    const restName = nameParts.slice(1).join(' ');
    document.getElementById('heroName').innerHTML = `${lastName}<br><span class="accent">${restName}</span>`;
    document.getElementById('heroDates').textContent = `📅 ${p.birth} — ${p.death}`;
    document.getElementById('heroLocation').textContent = `📍 ${p.cemetery}, ${p.city}`;

    // Info Grid
    document.getElementById('infoFullName').textContent = p.fullName;
    document.getElementById('infoBirth').textContent = p.birth;
    document.getElementById('infoDeath').textContent = p.death;
    document.getElementById('infoCemetery').textContent = p.cemetery;
    document.getElementById('infoCity').textContent = p.city;

    // Biography placeholder
    const bioDefault = `${p.fullName} (${p.birth} — ${p.death}) — көрнекті қайраткер, ${p.city}, ${p.cemetery} зиратында жерленген.\n\nТолық тарихи өмірбаян цифрландыру үстінде. Егер сізде бұл тұлға туралы мәліметтер болса — «Өмірбаянды толықтыру» түймесін басып, тарихи жадты сақтауға көмектесіңіз.`;
    document.getElementById('biographyText').textContent = p.bio || bioDefault;
    if (document.getElementById('expandedBioText')) {
        document.getElementById('expandedBioText').textContent = p.bio || bioDefault;
    }

    // Badge
    const badge = document.getElementById('heroBadge');
    if (p.filter === 'almaty') badge.textContent = 'Алматы';
    else if (p.filter === 'historical') badge.textContent = 'Тарихи тұлға';

    document.getElementById('profileContent').style.display = '';
    document.getElementById('notFound').style.display = 'none';
    document.getElementById('generateQrBtn').href = 'qr.html?slug=' + realProfileId + '&generate=true';

    // Load Family Tree
    loadFamilyTree(realProfileId, p);

    // Load QR Code
    loadQrSection(realProfileId);
}

async function loadFamilyTree(profileId, currentProfile) {
    try {
        if (typeof fetchFamilyRelations !== 'function') return;
        const relations = await fetchFamilyRelations(profileId);

        if (!relations || relations.length === 0) {
            document.getElementById('familySection').style.display = 'none';
            return;
        }

        document.getElementById('familySection').style.display = 'block';
        renderTree(relations, currentProfile);
    } catch (err) {
        console.error('[Ziratstan] Family tree error:', err);
        document.getElementById('familySection').style.display = 'none';
    }
}

function renderTree(relations, self) {
    const treeEl = document.getElementById('familyTree');
    treeEl.innerHTML = '';

    const parents = relations.filter(r => r.relation_type === 'parent');
    const children = relations.filter(r => r.relation_type === 'child');

    if (parents.length > 0) {
        const pLevel = document.createElement('div');
        pLevel.className = 'tree-level';
        parents.forEach(r => pLevel.appendChild(createNode(r.profiles, 'Ата-анасы')));
        treeEl.appendChild(pLevel);
    }

    const selfLevel = document.createElement('div');
    selfLevel.className = 'tree-level';
    const selfNode = createNode(self, 'Өзі');
    selfNode.classList.add('active');
    selfLevel.appendChild(selfNode);
    treeEl.appendChild(selfLevel);

    if (children.length > 0) {
        const cLevel = document.createElement('div');
        cLevel.className = 'tree-level';
        children.forEach(r => cLevel.appendChild(createNode(r.profiles, 'Баласы')));
        treeEl.appendChild(cLevel);
    }
}

function createNode(p, role) {
    const node = document.createElement('div');
    node.className = 'tree-node';
    node.onclick = () => { window.location.href = `profile.html?id=${p.id}`; };

    const birth = p.birth_date ? p.birth_date.substring(0, 4) : (p.birth || '?');
    const death = p.death_date ? p.death_date.substring(0, 4) : (p.death || '?');
    const initials = p.fullName ? p.fullName.split(' ').map(n => n[0]).join('') : (p.name ? p.name[0] : '?');

    node.innerHTML = `
        <div class="node-avatar">
            ${p.main_photo_url || p.photo ? `<img src="${p.main_photo_url || p.photo}" />` : initials}
        </div>
        <div class="node-name">${p.fullName || p.name}</div>
        <div class="node-dates">${birth} — ${death}</div>
        <div style="font-size:0.6rem; color:var(--gold); margin-top:4px; opacity:0.7;">${role}</div>
    `;
    return node;
}

function showError() {
    document.getElementById('heroSection').style.display = 'none';
    document.getElementById('profileContent').style.display = 'none';
    document.getElementById('notFound').style.display = 'block';
}

// ── UGC ──
function openAddBioModal() {
    document.getElementById('addBioModal').style.display = 'flex';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

async function submitBio(event) {
    event.preventDefault();
    const text = document.getElementById('bioText').value.trim();
    const authorName = document.getElementById('bioAuthorName').value.trim();
    const profileId = new URLSearchParams(window.location.search).get('id');

    if (!text || !profileId) return;

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText = 'Жіберілуде...';
    submitBtn.disabled = true;

    try {
        if (typeof submitUgcBio === 'function') {
            await submitUgcBio({ profileId, authorName, text });
        } else {
            console.warn('[Ziratstan] submitUgcBio function not found. Did you forget to include supabase/client.js?');
        }

        document.getElementById('addBioModal').innerHTML = `
            <div style="background:var(--surface); padding:32px; border-radius:14px; border:1px solid var(--border); width:90%; max-width:460px; text-align:center;">
                <div style="font-size:3rem; margin-bottom:12px;">✨</div>
                <h3 style="color:var(--gold); margin-bottom:10px; font-family:Outfit;">МашаАллах, Рахмет!</h3>
                <p style="color:var(--muted); font-size:0.9rem; margin-bottom:20px;">Сіздің мәліметтеріңіз тексеруге жіберілді. Модерациядан кейін олар осы парақшада пайда болады.</p>
                <button onclick="closeModal('addBioModal')" style="padding:12px 24px; background:var(--gold); color:var(--bg); border:none; border-radius:9px; font-weight:700; cursor:pointer; font-family:inherit;">Жабу</button>
            </div>`;
    } catch (err) {
        console.error('[Ziratstan] Error submitting bio:', err);
        submitBtn.innerText = originalBtnText;
        submitBtn.disabled = false;
        const toast = document.getElementById('toast');
        toast.textContent = '❌ Жіберу кезінде қате шықты. Кейінірек қайталап көріңіз.';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

// ── SHARE ──
function shareProfile() {
    const url = window.location.href;
    const title = document.getElementById('pageTitle').textContent;
    if (navigator.share) {
        navigator.share({ title, url }).catch(() => { });
    } else {
        navigator.clipboard.writeText(url).then(() => {
            const toast = document.getElementById('toast');
            toast.textContent = '✅ Сілтеме көшірілді!';
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2500);
        }).catch(() => { prompt('Сілтемені көшіріңіз:', url); });
    }
}

// ── QR MEMORIAL ──
async function loadQrSection(profileId) {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(profileId)) {
        const content = document.getElementById('qrContent');
        renderQrDisplay(content, { slug: profileId + '-mock', scan_count: 0 }, profileId);
        return;
    }

    try {
        if (typeof fetchQrByProfile !== 'function') return;
        const qr = await fetchQrByProfile(profileId);
        const section = document.getElementById('qrSection');
        const content = document.getElementById('qrContent');
        section.style.display = 'block';

        if (qr && qr.slug) {
            renderQrDisplay(content, qr, profileId);
        } else {
            renderQrCreate(content, profileId);
        }
    } catch (err) {
        console.warn('[Ziratstan QR] Error loading QR section:', err);
    }
}

function renderQrDisplay(container, qr, profileId) {
    const qrUrl = window.location.origin + '/qr.html?s=' + qr.slug;

    container.innerHTML = `
        <div class="qr-code-wrapper">
            <canvas id="qrCanvas"></canvas>
        </div>
        <br>
        <div class="qr-slug-display">📲 ${qr.slug}</div>
        <br>
        <div class="qr-scan-count">
            👁️ Скан жасалды: <strong>${qr.scan_count || 0}</strong> рет
        </div>
        <div class="qr-actions">
            <button class="btn-action btn-fill" onclick="downloadQrPng()">📥 PNG жүктеп алу</button>
            <button class="btn-action btn-outline" onclick="downloadQrSvg('${qrUrl}', '${qr.slug}')">📐 SVG жүктеп алу</button>
            <button class="btn-action btn-outline" onclick="copyQrLink('${qrUrl}')">🔗 Сілтемені көшіру</button>
        </div>
        <p class="qr-hint">
            QR-кодты басып шығарып, құлпытасқа тақтайша жасауға тапсырыс беріңіз.<br>
            Скан жасалғанда осы естелік парақшасы ашылады.
        </p>
    `;

    if (typeof QRCode !== 'undefined') {
        QRCode.toCanvas(document.getElementById('qrCanvas'), qrUrl, {
            width: 180,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
            errorCorrectionLevel: 'H'
        });
    }
}

function renderQrCreate(container, profileId) {
    container.innerHTML = `
        <p style="color:var(--muted); margin-bottom:1.5rem; font-size:0.9rem; line-height:1.7;">
            Бұл профильде әлі QR-код жоқ. Оны құлпытасқа орналастыру үшін жасаңыз.
            Камерамен скан жасағанда осы мемориалдық парақша ашылады.
        </p>
        <button class="qr-create-btn" id="createQrBtn" onclick="createQrForProfile('${profileId}')">
            📲 QR-код жасау
        </button>
    `;
}

async function createQrForProfile(profileId) {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(profileId)) {
        const content = document.getElementById('qrContent');
        content.innerHTML = `<p style="color:var(--muted); font-size:0.88rem; line-height:1.7;">
            📋 QR-код тек Supabase дерекқорында тіркелген профильдер үшін қол жетімді.<br>
            Бұл тарихи тұлға статикалық дерекқорда сақталған.
        </p>`;
        return;
    }

    const btn = document.getElementById('createQrBtn');
    btn.textContent = '⏳ Генерациялануда...';
    btn.disabled = true;

    try {
        const result = await generateQrSlug(profileId);
        const content = document.getElementById('qrContent');
        renderQrDisplay(content, { slug: result.slug, scan_count: 0 }, profileId);

        const toast = document.getElementById('toast');
        toast.textContent = '✅ QR-код жасалды: ' + result.slug;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    } catch (err) {
        console.error('[Ziratstan QR] Create error:', err);
        btn.textContent = '❌ Қате, қайталап көріңіз';
        btn.disabled = false;
        setTimeout(() => {
            btn.textContent = '📲 QR-код жасау';
        }, 2000);
    }
}

function downloadQrPng() {
    const canvas = document.getElementById('qrCanvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'ziratstan-qr-memorial.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

async function downloadQrSvg(url, slug) {
    if (typeof QRCode === 'undefined') return;
    try {
        const svgString = await QRCode.toString(url, {
            type: 'svg',
            width: 300,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
            errorCorrectionLevel: 'H'
        });
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const link = document.createElement('a');
        link.download = 'ziratstan-qr-' + slug + '.svg';
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    } catch (e) {
        console.error('[Ziratstan QR] SVG generation error:', e);
    }
}

function copyQrLink(url) {
    navigator.clipboard.writeText(url).then(() => {
        const toast = document.getElementById('toast');
        toast.textContent = '✅ Сілтеме көшірілді!';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }).catch(() => {
        prompt('Сілтемені көшіріңіз:', url);
    });
}

// Run
initProfile();
