// ─────────────────────────────────────────────
//  PROFILE PAGE LOGIC — src/js/profile.js
//  Extracted from inline <script> in profile.html
// ─────────────────────────────────────────────

// Current bio lang state
let _bioDataKK = null;
let _bioDataRU = null;
let _bioExpanded = false;
let _bioLang = 'kk';
let _currentProfile = null;
let _currentProfileId = null;
let _currentProfileUuid = null;
let _enrichedData = null;
let _familyRelations = null;
let _lastQrData = null;
let _lastQrProfileId = null;
let _lastQrHasSession = false;
let _lastQrMode = null; // 'display' | 'create' | 'admin' | 'supabase_only' | 'mock' | 'public_fallback'

function t(key) {
    return (window.i18n && typeof i18n.t === 'function') ? i18n.t(key) : key;
}

function getLang() {
    return (window.i18n && typeof i18n.getLang === 'function') ? i18n.getLang() : 'kk';
}

// Tiny template helper: replaces "{token}" placeholders with values.
function tf(key, vars) {
    let s = t(key);
    if (!vars) return s;
    Object.keys(vars).forEach(function (k) {
        const token = '{' + k + '}';
        const val = (vars[k] === undefined || vars[k] === null) ? '' : String(vars[k]);
        s = s.split(token).join(val);
    });
    return s;
}

function displayOrUnknown(val) {
    const s = (val === undefined || val === null) ? '' : String(val).trim();
    return s ? s : t('common_unknown');
}

function getPublicProfileUrl(profileId) {
    return window.location.origin + '/profile.html?id=' + encodeURIComponent(profileId);
}

function updateSeo(p) {
    const titleEl = document.getElementById('pageTitle');
    const descEl = document.getElementById('pageDesc');
    if (!p) {
        if (titleEl) titleEl.textContent = t('prof_page_title');
        if (descEl) descEl.setAttribute('content', t('prof_page_desc'));
        return;
    }
    if (titleEl) titleEl.textContent = `${p.fullName} | Зиратстан`;
    if (descEl) {
        const desc = tf('prof_meta_desc_tpl', {
            name: p.fullName,
            birth: p.birth,
            death: p.death,
            cemetery: displayOrUnknown(p.cemetery),
            city: displayOrUnknown(p.city)
        });
        descEl.setAttribute('content', desc);
    }
}

function updateBadge(p) {
    const badge = document.getElementById('heroBadge');
    if (!badge) return;
    if (p.filter === 'almaty') badge.textContent = t('prof_badge_almaty');
    else if (p.filter === 'historical') badge.textContent = t('prof_badge_historical');
    else badge.textContent = '';
}

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

    const hasKK = !!_bioDataKK;
    const hasRU = !!_bioDataRU;
    if (hasKK && hasRU) {
        if (_bioLang !== 'kk' && _bioLang !== 'ru') _bioLang = 'kk';
    } else if (hasKK) {
        _bioLang = 'kk';
    } else {
        _bioLang = 'ru';
    }

    const wikiKK = data.wiki_link_kk ? `<a href="${data.wiki_link_kk}" target="_blank" rel="noopener" id="wikiLinkKK" style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.25);border-radius:99px;color:var(--gold);font-size:0.78rem;font-weight:600;text-decoration:none;transition:opacity 0.2s;" onmouseover="this.style.opacity=0.75" onmouseout="this.style.opacity=1">${t('prof_wikipedia_kk')}</a>` : '';
    const wikiRU = data.wiki_link_ru ? `<a href="${data.wiki_link_ru}" target="_blank" rel="noopener" id="wikiLinkRU" style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.25);border-radius:99px;color:var(--gold);font-size:0.78rem;font-weight:600;text-decoration:none;transition:opacity 0.2s;" onmouseover="this.style.opacity=0.75" onmouseout="this.style.opacity=1">${t('prof_wikipedia_ru')}</a>` : '';

    const langSwitcher = (_bioDataKK && _bioDataRU) ? `
        <div id="bioLangSwitch" style="display:flex;gap:6px;margin-bottom:1rem;">
            <button id="btnLangKK" onclick="switchBioLang('kk')" style="padding:5px 14px;border-radius:99px;border:1px solid var(--gold);background:var(--gold);color:#09090b;font-size:0.75rem;font-weight:700;cursor:pointer;font-family:inherit;">${t('lang_kk')}</button>
            <button id="btnLangRU" onclick="switchBioLang('ru')" style="padding:5px 14px;border-radius:99px;border:1px solid rgba(255,255,255,0.12);background:transparent;color:var(--muted);font-size:0.75rem;font-weight:600;cursor:pointer;font-family:inherit;">${t('lang_ru')}</button>
        </div>` : '';

    const bioText = _bioLang === 'kk' ? (_bioDataKK || _bioDataRU) : (_bioDataRU || _bioDataKK);

    const videoHTML = data.video_link ? `
        <div style="margin-top:2rem;">
            <h3 style="font-size:1.1rem;margin-bottom:1rem;display:flex;align-items:center;gap:6px;"><span class="s-icon">🎥</span> ${t('prof_video_title')}</h3>
            <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;border:1px solid var(--border);">
                <iframe src="${data.video_link.replace('watch?v=', 'embed/')}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen></iframe>
            </div>
        </div>
    ` : '';

    const galleryHTML = data.photos && data.photos.length > 0 ? `
        <div style="margin-top:2rem;">
            <h3 style="font-size:1.1rem;margin-bottom:1rem;display:flex;align-items:center;gap:6px;"><span class="s-icon">📸</span> ${t('prof_gallery_title')}</h3>
            <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:10px;scrollbar-width:thin;">
                ${data.photos.map(url => `<img src="${url}" style="height:160px;min-width:120px;border-radius:8px;object-fit:cover;border:1px solid var(--border);">`).join('')}
            </div>
        </div>
    ` : '';

    bioSection.innerHTML = `
        <h2><span class="s-icon">📖</span> ${t('prof_bio_title')}</h2>
        ${langSwitcher}
        <div id="bioTextWrapper" style="position:relative;">
            <p id="biographyText" style="font-size:1rem;line-height:1.8;color:var(--text);opacity:0.82;white-space:pre-wrap;overflow:hidden;display:-webkit-box;-webkit-line-clamp:5;line-clamp:5;-webkit-box-orient:vertical;margin-bottom:1rem;">${bioText}</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
            <button id="readBioBtn" class="btn-action btn-outline" onclick="toggleBio()" style="font-size:0.82rem;">${t('prof_read_more')}</button>
            ${wikiKK}
            ${wikiRU}
        </div>
        ${galleryHTML}
        ${videoHTML}
    `;

    // Ensure UI matches current selected bio language and reset expand button.
    if (_bioDataKK && _bioDataRU) switchBioLang(_bioLang);
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
    if (btn) btn.textContent = t('prof_read_more');
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
        if (btn) btn.textContent = t('prof_collapse');
    } else {
        bioEl.style.overflow = 'hidden';
        bioEl.style.display = '-webkit-box';
        bioEl.style.webkitLineClamp = '5';
        bioEl.style.webkitBoxOrient = 'vertical';
        if (btn) btn.textContent = t('prof_read_more');
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
                cemetery: staticMatch.cemetery || '',
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

    _currentProfile = p;
    _currentProfileId = id;
    _currentProfileUuid = realProfileId;

    // SEO tags (localized meta description)
    updateSeo(p);

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
    document.getElementById('heroLocation').textContent = `📍 ${displayOrUnknown(p.cemetery)}, ${displayOrUnknown(p.city)}`;

    // Info Grid
    document.getElementById('infoFullName').textContent = p.fullName;
    document.getElementById('infoBirth').textContent = p.birth;
    document.getElementById('infoDeath').textContent = p.death;
    document.getElementById('infoCemetery').textContent = displayOrUnknown(p.cemetery);
    document.getElementById('infoCity').textContent = displayOrUnknown(p.city);

    // Badge
    updateBadge(p);

    document.getElementById('profileContent').style.display = '';
    document.getElementById('notFound').style.display = 'none';
    document.getElementById('generateQrBtn').href = '#qrSection';

    // Load enriched bio from JSON (Wikipedia data)
    const enriched = await loadEnrichedBio(p.id);
    if (enriched && (enriched.bio_kk || enriched.bio_ru)) {
        _enrichedData = enriched;
        renderBio(enriched);
    } else {
        _enrichedData = null;
        // Fallback biography placeholder
        const bioSection = document.getElementById('bioSection');
        if (bioSection) {
            const bioDefault = tf('prof_bio_fallback_tpl', {
                name: p.fullName,
                birth: p.birth,
                death: p.death,
                city: displayOrUnknown(p.city),
                cemetery: displayOrUnknown(p.cemetery),
                add_bio: t('prof_add_bio')
            });
            const el = document.getElementById('biographyText');
            if (el) el.textContent = p.bio || bioDefault;
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
        _familyRelations = relations || null;

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
        parents.forEach(r => pLevel.appendChild(createNode(r.profiles, t('prof_role_parent'))));
        treeEl.appendChild(pLevel);
    }

    const selfLevel = document.createElement('div');
    selfLevel.className = 'tree-level';
    const selfNode = createNode(self, t('prof_role_self'));
    selfNode.classList.add('active');
    selfLevel.appendChild(selfNode);
    treeEl.appendChild(selfLevel);

    if (children.length > 0) {
        const cLevel = document.createElement('div');
        cLevel.className = 'tree-level';
        children.forEach(r => cLevel.appendChild(createNode(r.profiles, t('prof_role_child'))));
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
    submitBtn.innerText = t('prof_submit_loading');
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
                <h3 style="color:var(--gold); margin-bottom:10px; font-family:Outfit;">${t('map_modal_thanks_title')}</h3>
                <p style="color:var(--muted); font-size:0.9rem; margin-bottom:20px;">${t('prof_modal_thanks_desc')}</p>
                <button onclick="closeModal('addBioModal')" style="padding:12px 24px; background:var(--gold); color:var(--bg); border:none; border-radius:9px; font-weight:700; cursor:pointer; font-family:inherit;">${t('common_close')}</button>
            </div>`;
    } catch (err) {
        console.error('[Ziratstan] Error submitting bio:', err);
        submitBtn.innerText = originalBtnText;
        submitBtn.disabled = false;
        const toast = document.getElementById('toast');
        toast.textContent = t('prof_toast_err');
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
            toast.textContent = t('prof_share_copied');
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2500);
        }).catch(() => { prompt(t('prof_share_prompt'), url); });
    }
}

// ── QR MEMORIAL ──
async function loadQrSection(profileId) {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const section = document.getElementById('qrSection');
    const content = document.getElementById('qrContent');
    section.style.display = 'block';
    if (!UUID_REGEX.test(profileId)) {
        _lastQrMode = 'mock';
        _lastQrProfileId = profileId;
        _lastQrData = { slug: profileId + '-mock', scan_count: 0, url: getPublicProfileUrl(profileId) };
        renderQrDisplay(content, _lastQrData, profileId);
        return;
    }

    try {
        if (typeof fetchQrByProfile !== 'function') {
            _lastQrMode = 'public_fallback';
            _lastQrProfileId = profileId;
            _lastQrData = { url: getPublicProfileUrl(profileId) };
            renderQrDisplay(content, _lastQrData, profileId);
            return;
        }
        const qr = await fetchQrByProfile(profileId);

        if (qr && qr.slug) {
            _lastQrMode = 'display';
            _lastQrProfileId = profileId;
            _lastQrData = qr;
            renderQrDisplay(content, qr, profileId);
        } else {
            _lastQrMode = 'public_fallback';
            _lastQrProfileId = profileId;
            _lastQrData = { url: getPublicProfileUrl(profileId) };
            renderQrDisplay(content, _lastQrData, profileId);
        }
    } catch (err) {
        console.warn('[Ziratstan QR] Error loading QR section:', err);
        _lastQrMode = 'public_fallback';
        _lastQrProfileId = profileId;
        _lastQrData = { url: getPublicProfileUrl(profileId) };
        renderQrDisplay(content, _lastQrData, profileId);
    }
}

function renderQrDisplayLegacy(container, qr, profileId) {
    const qrUrl = window.location.origin + '/qr.html?s=' + qr.slug;

    container.innerHTML = `
        <div class="qr-code-wrapper">
            <canvas id="qrCanvas"></canvas>
        </div>
        <br>
        <div class="qr-slug-display">📲 ${qr.slug}</div>
        <br>
        <div class="qr-scan-count">
            ${tf('prof_qr_scan_count_tpl', { count: (qr.scan_count || 0) })}
        </div>
        <div class="qr-actions">
            <button class="btn-action btn-fill" onclick="downloadQrJpg('${qrUrl}', '${qr.slug}')">${t('prof_qr_download')}</button>
            <button class="btn-action btn-outline" onclick="downloadQrHtml('${qrUrl}', '${qr.slug}')">${t('prof_qr_html')}</button>
            <button class="btn-action btn-outline" onclick="downloadQrPdf('${qrUrl}', '${qr.slug}')">${t('prof_qr_pdf')}</button>
            <button class="btn-action btn-outline" onclick="copyQrLink('${qrUrl}')">${t('prof_qr_copy_link')}</button>
        </div>
        <p class="qr-hint">
            ${t('prof_qr_hint')}
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

function renderQrDisplay(container, qr, profileId) {
    const qrUrl = qr.url || (window.location.origin + '/qr.html?s=' + qr.slug);
    const slugHtml = qr.slug ? `
        <br>
        <div class="qr-slug-display">📲 ${qr.slug}</div>
    ` : '';
    const scanHtml = Number.isFinite(qr.scan_count) ? `
        <br>
        <div class="qr-scan-count">
            ${tf('prof_qr_scan_count_tpl', { count: (qr.scan_count || 0) })}
        </div>
    ` : '';

    container.innerHTML = `
        <div class="qr-code-wrapper">
            <canvas id="qrCanvas"></canvas>
        </div>
        ${slugHtml}
        ${scanHtml}
        <div class="qr-actions">
            <button class="btn-action btn-fill" onclick="downloadQrJpg('${qrUrl}', '${qr.slug || profileId}')">${t('prof_qr_download')}</button>
            <button class="btn-action btn-outline" onclick="downloadQrHtml('${qrUrl}', '${qr.slug || profileId}')">${t('prof_qr_html')}</button>
            <button class="btn-action btn-outline" onclick="downloadQrPdf('${qrUrl}', '${qr.slug || profileId}')">${t('prof_qr_pdf')}</button>
            <button class="btn-action btn-outline" onclick="copyQrLink('${qrUrl}')">${t('prof_qr_copy_link')}</button>
        </div>
        <p class="qr-hint">
            ${t('prof_qr_hint')}
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
            ${t('prof_qr_create_desc')}
        </p>
        <button class="qr-create-btn" id="createQrBtn" onclick="createQrForProfile('${profileId}')">
            ${t('prof_qr_create_btn')}
        </button>
    `;
}

async function createQrForProfile(profileId) {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(profileId)) {
        const content = document.getElementById('qrContent');
        _lastQrMode = 'supabase_only';
        _lastQrProfileId = profileId;
        _lastQrData = null;
        content.innerHTML = `<p style="color:var(--muted); font-size:0.88rem; line-height:1.7;">${t('prof_qr_only_supabase')}</p>`;
        return;
    }

    const btn = document.getElementById('createQrBtn');
    btn.textContent = t('prof_qr_generating');
    btn.disabled = true;

    try {
        const result = await generateQrSlug(profileId);
        const content = document.getElementById('qrContent');
        _lastQrMode = 'display';
        _lastQrProfileId = profileId;
        _lastQrData = { slug: result.slug, scan_count: 0 };
        renderQrDisplay(content, _lastQrData, profileId);

        const toast = document.getElementById('toast');
        toast.textContent = tf('prof_qr_created_toast_tpl', { slug: result.slug });
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    } catch (err) {
        console.error('[Ziratstan QR] Create error:', err);
        btn.textContent = t('prof_qr_error_retry');
        btn.disabled = false;
        setTimeout(() => {
            btn.textContent = t('prof_qr_create_btn');
        }, 2000);
    }
}

function downloadQrPng() {
    downloadQrJpg();
}

function getSafeQrSlug(slug) {
    return String(slug || 'memorial').replace(/[^a-zA-Z0-9_-]/g, '-');
}

async function buildQrExportCanvas(url, size) {
    if (typeof QRCode === 'undefined') throw new Error('QRCode library is missing');
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, url, {
        width: size,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'H'
    });
    return canvas;
}

function triggerDownloadFromBlob(blob, fileName) {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = fileName;
    link.href = objectUrl;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        link.remove();
    }, 1000);
}

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

async function downloadQrJpg(url, slug) {
    try {
        const safeSlug = getSafeQrSlug(slug);
        const fileName = 'ziratstan-qr-' + safeSlug + '.jpg';

        if (url) {
            const exportCanvas = await buildQrExportCanvas(url, 1024);
            const link = document.createElement('a');
            link.download = fileName;
            link.href = exportCanvas.toDataURL('image/jpeg', 0.95);
            link.click();
            return;
        }

        const canvas = document.getElementById('qrCanvas');
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.click();
    } catch (e) {
        console.error('[Ziratstan QR] JPG export error:', e);
    }
}

async function downloadQrHtml(url, slug) {
    if (!url) return;
    try {
        const safeSlug = getSafeQrSlug(slug);
        const exportCanvas = await buildQrExportCanvas(url, 1024);
        const pngDataUrl = exportCanvas.toDataURL('image/png');
        const safeUrl = escapeHtml(url);
        const html =
            '<!doctype html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
            '<title>Ziratstan QR</title><style>body{margin:0;padding:40px 20px;background:#0b0b0e;color:#f4f4f5;font:16px Inter,Arial,sans-serif;text-align:center}' +
            '.wrap{max-width:760px;margin:0 auto}.card{background:#111113;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:24px}' +
            '.qr{width:min(520px,90vw);height:auto;background:#fff;border-radius:12px;display:block;margin:0 auto}.url{margin-top:14px;word-break:break-all;color:#9ca3af}</style></head><body>' +
            '<div class="wrap"><div class="card"><h1>QR Code</h1><img class="qr" src="' + pngDataUrl + '" alt="QR"><p class="url">' + safeUrl + '</p></div></div></body></html>';

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        triggerDownloadFromBlob(blob, 'ziratstan-qr-' + safeSlug + '.html');
    } catch (e) {
        console.error('[Ziratstan QR] HTML export error:', e);
    }
}

async function downloadQrPdf(url, slug) {
    if (!url) return;
    try {
        const safeSlug = getSafeQrSlug(slug);
        const exportCanvas = await buildQrExportCanvas(url, 1024);
        const jpgData = exportCanvas.toDataURL('image/jpeg', 0.95);

        if (window.jspdf && window.jspdf.jsPDF) {
            const jsPDF = window.jspdf.jsPDF;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
            const pageW = doc.internal.pageSize.getWidth();
            const pageH = doc.internal.pageSize.getHeight();
            const qrSize = Math.min(pageW, pageH) * 0.65;
            const x = (pageW - qrSize) / 2;
            const y = 18;

            doc.setFontSize(14);
            doc.text('Ziratstan QR', pageW / 2, 10, { align: 'center' });
            doc.addImage(jpgData, 'JPEG', x, y, qrSize, qrSize);
            doc.setFontSize(8);
            doc.text(String(url), pageW / 2, y + qrSize + 8, { align: 'center', maxWidth: pageW - 20 });
            doc.save('ziratstan-qr-' + safeSlug + '.pdf');
            return;
        }

        const printWindow = window.open('', '_blank', 'width=900,height=1200');
        if (!printWindow) return;
        const safeUrl = escapeHtml(url);
        printWindow.document.write(
            '<!doctype html><html><head><meta charset="UTF-8"><title>QR PDF</title><style>body{text-align:center;padding:20px}img{max-width:80vw}</style></head><body>' +
            '<h2>Ziratstan QR</h2><img src="' + jpgData + '" alt="QR"><p>' + safeUrl + '</p></body></html>'
        );
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    } catch (e) {
        console.error('[Ziratstan QR] PDF export error:', e);
    }
}

async function downloadQrSvg(url, slug) {
    if (typeof QRCode === 'undefined') return;
    try {
        const safeSlug = getSafeQrSlug(slug);
        const size = 1024;
        const canvas = document.createElement('canvas');

        await QRCode.toCanvas(canvas, url, {
            width: size,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
            errorCorrectionLevel: 'H'
        });

        const pngDataUrl = canvas.toDataURL('image/png');
        const svgString =
            `<?xml version="1.0" encoding="UTF-8"?>\n` +
            `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
            `<rect width="${size}" height="${size}" fill="#ffffff"/>` +
            `<image href="${pngDataUrl}" x="0" y="0" width="${size}" height="${size}" />` +
            `</svg>`;

        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        triggerDownloadFromBlob(blob, 'ziratstan-qr-' + safeSlug + '.svg');
    } catch (e) {
        console.error('[Ziratstan QR] SVG generation error:', e);
    }
}

function copyQrLink(url) {
    navigator.clipboard.writeText(url).then(() => {
        const toast = document.getElementById('toast');
        toast.textContent = t('prof_share_copied');
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }).catch(() => {
        prompt(t('prof_share_prompt'), url);
    });
}

// Re-render dynamic content on language change (titles/meta, badges, bio blocks, tree roles, QR text).
document.addEventListener('langchange', function () {
    if (!_currentProfile) {
        updateSeo(null);
        return;
    }

    updateSeo(_currentProfile);
    updateBadge(_currentProfile);

    if (_enrichedData) {
        renderBio(_enrichedData);
    } else if (!_currentProfile.bio) {
        const bioDefault = tf('prof_bio_fallback_tpl', {
            name: _currentProfile.fullName,
            birth: _currentProfile.birth,
            death: _currentProfile.death,
            city: displayOrUnknown(_currentProfile.city),
            cemetery: displayOrUnknown(_currentProfile.cemetery),
            add_bio: t('prof_add_bio')
        });
        const el = document.getElementById('biographyText');
        if (el) el.textContent = bioDefault;
    }

    if (_familyRelations) renderTree(_familyRelations, _currentProfile);

    // QR section rerender without re-fetching
    const content = document.getElementById('qrContent');
    if (content && _lastQrProfileId) {
        if (_lastQrMode === 'display' || _lastQrMode === 'mock') {
            renderQrDisplay(content, _lastQrData || { slug: _lastQrProfileId + '-mock', scan_count: 0 }, _lastQrProfileId);
        } else if (_lastQrMode === 'public_fallback') {
            renderQrDisplay(content, _lastQrData || { url: getPublicProfileUrl(_lastQrProfileId) }, _lastQrProfileId);
        } else if (_lastQrMode === 'create') {
            renderQrCreate(content, _lastQrProfileId);
        } else if (_lastQrMode === 'admin') {
            content.innerHTML = `<p style="color:var(--muted); font-size:0.9rem; line-height:1.7;">${t('prof_qr_no_qr_admin')}</p>`;
        } else if (_lastQrMode === 'supabase_only') {
            content.innerHTML = `<p style="color:var(--muted); font-size:0.88rem; line-height:1.7;">${t('prof_qr_only_supabase')}</p>`;
        }
    }
});

// Run
updateSeo(null);
initProfile();
