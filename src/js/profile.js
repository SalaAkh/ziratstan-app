// ─────────────────────────────────────────────
//  PROFILE PAGE LOGIC — src/js/profile.js
//  Extracted from inline <script> in profile.html
// ─────────────────────────────────────────────

// Current bio lang state
let _bioDataKK = null;
let _bioDataRU = null;
let _bioExpanded = false;
let _bioLang = 'kk';

// ── LOAD ENRICHED BIO FROM JSON ──
async function loadEnrichedBio(profileId) {
    try {
        const res = await fetch(`/public/data/profiles/${profileId}.json`);
        if (!res.ok) return null;
        return await res.json();
    } catch(e) {
        return null;
    }
}

// ── RENDER BIO SECTION ──
function renderBio(data) {
    const bioSection = document.getElementById('bioSection');
    if (!bioSection) return;

    _bioDataKK = data.bio_kk || null;
    _bioDataRU = data.bio_ru || null;

    if (!_bioDataKK && !_bioDataRU) return;

    const activeLang = _bioDataKK ? 'kk' : 'ru';
    _bioLang = activeLang;

    const wikiKK = data.wiki_link_kk ? `<a href="${data.wiki_link_kk}" target="_blank" rel="noopener" id="wikiLinkKK" style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.25);border-radius:99px;color:var(--gold);font-size:0.78rem;font-weight:600;text-decoration:none;transition:opacity 0.2s;" onmouseover="this.style.opacity=0.75" onmouseout="this.style.opacity=1">📚 Wikipedia (ҚАЗ)</a>` : '';
    const wikiRU = data.wiki_link_ru ? `<a href="${data.wiki_link_ru}" target="_blank" rel="noopener" id="wikiLinkRU" style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.25);border-radius:99px;color:var(--gold);font-size:0.78rem;font-weight:600;text-decoration:none;transition:opacity 0.2s;" onmouseover="this.style.opacity=0.75" onmouseout="this.style.opacity=1">📚 Wikipedia (РУС)</a>` : '';

    const langSwitcher = (_bioDataKK && _bioDataRU) ? `
        <div id="bioLangSwitch" style="display:flex;gap:6px;margin-bottom:1rem;">
            <button id="btnLangKK" onclick="switchBioLang('kk')" style="padding:5px 14px;border-radius:99px;border:1px solid var(--gold);background:var(--gold);color:#09090b;font-size:0.75rem;font-weight:700;cursor:pointer;font-family:inherit;">ҚАЗ</button>
            <button id="btnLangRU" onclick="switchBioLang('ru')" style="padding:5px 14px;border-radius:99px;border:1px solid rgba(255,255,255,0.12);background:transparent;color:var(--muted);font-size:0.75rem;font-weight:600;cursor:pointer;font-family:inherit;">РУС</button>
        </div>` : '';

    const bioText = _bioDataKK || _bioDataRU;

    const videoHTML = data.video_link ? `
        <div style="margin-top:2rem;">
            <h3 style="font-size:1.1rem;margin-bottom:1rem;display:flex;align-items:center;gap:6px;"><span class="s-icon">🎥</span> Бейнематериал</h3>
            <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;border:1px solid var(--border);">
                <iframe src="${data.video_link.replace('watch?v=', 'embed/')}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe>
            </div>
        </div>
    ` : '';

    const galleryHTML = data.photos && data.photos.length > 0 ? `
        <div style="margin-top:2rem;">
            <h3 style="font-size:1.1rem;margin-bottom:1rem;display:flex;align-items:center;gap:6px;"><span class="s-icon">📸</span> Фотогалерея</h3>
            <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:10px;scrollbar-width:thin;">
                ${data.photos.map(url => `<img src="${url}" style="height:160px;min-width:120px;border-radius:8px;object-fit:cover;border:1px solid var(--border);">`).join('')}
            </div>
        </div>
    ` : '';

    bioSection.innerHTML = `
        <h2><span class="s-icon">📖</span> Өмірбаян</h2>
        ${langSwitcher}
        <div id="bioTextWrapper" style="position:relative;">
            <p id="biographyText" style="font-size:1rem;line-height:1.8;color:var(--text);opacity:0.82;white-space:pre-wrap;overflow:hidden;display:-webkit-box;-webkit-line-clamp:5;line-clamp:5;-webkit-box-orient:vertical;margin-bottom:1rem;">${bioText}</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
            <button id="readBioBtn" class="btn-action btn-outline" onclick="toggleBio()" style="font-size:0.82rem;">📖 Толығырақ оқу</button>
            ${wikiKK}
            ${wikiRU}
        </div>
        ${galleryHTML}
        ${videoHTML}
    `;
}

function switchBioLang(lang) {
    _bioLang = lang;
    const bioText = lang === 'kk' ? (_bioDataKK || _bioDataRU) : (_bioDataRU || _bioDataKK);
    const bioEl = document.getElementById('biographyText');
    if (bioEl) bioEl.textContent = bioText;

    const btnKK = document.getElementById('btnLangKK');
    const btnRU = document.getElementById('btnLangRU');
    if (btnKK && btnRU) {
        const activeStyle = 'padding:5px 14px;border-radius:99px;border:1px solid var(--gold);background:var(--gold);color:#09090b;font-size:0.75rem;font-weight:700;cursor:pointer;font-family:inherit;';
        const inactiveStyle = 'padding:5px 14px;border-radius:99px;border:1px solid rgba(255,255,255,0.12);background:transparent;color:var(--muted);font-size:0.75rem;font-weight:600;cursor:pointer;font-family:inherit;';
        btnKK.style.cssText = lang === 'kk' ? activeStyle : inactiveStyle;
        btnRU.style.cssText = lang === 'ru' ? activeStyle : inactiveStyle;
    }

    // Reset expand state
    _bioExpanded = false;
    if (bioEl) {
        bioEl.style.overflow = 'hidden';
        bioEl.style.display = '-webkit-box';
        bioEl.style.webkitLineClamp = '5';
        bioEl.style.webkitBoxOrient = 'vertical';
    }
    const btn = document.getElementById('readBioBtn');
    if (btn) btn.textContent = '📖 Толығырақ оқу';
}

// ── TOGGLE BIO ──
function toggleBio() {
    const bioEl = document.getElementById('biographyText');
    const btn = document.getElementById('readBioBtn');
    if (!bioEl) return;
    _bioExpanded = !_bioExpanded;
    if (_bioExpanded) {
        bioEl.style.overflow = 'visible';
        bioEl.style.display = 'block';
        bioEl.style.webkitLineClamp = 'unset';
        if (btn) btn.textContent = '🔼 Жию';
    } else {
        bioEl.style.overflow = 'hidden';
        bioEl.style.display = '-webkit-box';
        bioEl.style.webkitLineClamp = '5';
        bioEl.style.webkitBoxOrient = 'vertical';
        if (btn) btn.textContent = '📖 Толығырақ оқу';
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

    // Badge
    const badge = document.getElementById('heroBadge');
    if (p.filter === 'almaty') badge.textContent = 'Алматы';
    else if (p.filter === 'historical') badge.textContent = 'Тарихи тұлға';

    document.getElementById('profileContent').style.display = '';
    document.getElementById('notFound').style.display = 'none';
    document.getElementById('generateQrBtn').href = 'qr.html?slug=' + realProfileId + '&generate=true';

    // Load enriched bio from JSON (Wikipedia data)
    const enriched = await loadEnrichedBio(p.id);
    if (enriched && (enriched.bio_kk || enriched.bio_ru)) {
        renderBio(enriched);
    } else {
        // Fallback biography placeholder
        const bioSection = document.getElementById('bioSection');
        if (bioSection) {
            const bioDefault = `${p.fullName} (${p.birth} — ${p.death}) — көрнекті қайраткер, ${p.city}, ${p.cemetery} зиратында жерленген.\n\nТолық тарихи өмірбаян цифрландыру үстінде. Егер сізде бұл тұлға туралы мәліметтер болса — «Өмірбаянды толықтыру» түймесін басып, тарихи жадты сақтауға көмектесіңіз.`;
            document.getElementById('biographyText') && (document.getElementById('biographyText').textContent = p.bio || bioDefault);
        }
    }

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
            const session = await getSession();
            if (session) {
                renderQrCreate(content, profileId);
            } else {
                content.innerHTML = `<p style="color:var(--muted); font-size:0.9rem; line-height:1.7;">Бұл профильде әлі QR-код жасалмаған. Орнату үшін әкімшіге хабарласыңыз.</p>`;
            }
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
