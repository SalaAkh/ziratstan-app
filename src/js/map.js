// ─────────────────────────────────────────────
//  MAP PAGE LOGIC — src/js/map.js
//  Extracted from inline <script> in map.html
// ─────────────────────────────────────────────

        // ── DATA ──
        let PROFILES = [];
        let PRIVATE_CEMETERY_PROFILES = [];
        let PENDING_CEMETERY_PROFILES = [];
        const CEMETERY_PROFILE_MATCH_EPS = 0.0012; // ~100-130m depending on latitude

        let currentFilter = 'all';
        let activeId = null;
        let pMarkers = {};
        let refreshRegionsUI = function () { };

        /* ─── UTILS (P2.5) ─── */
        function debounce(fn, ms) {
            let timeout;
            return function (...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => fn.apply(this, args), ms);
            };
        }

        function t(key) {
            return (window.i18n && typeof i18n.t === 'function') ? i18n.t(key) : key;
        }

        function getLang() {
            return (window.i18n && typeof i18n.getLang === 'function') ? i18n.getLang() : 'kk';
        }

        function regionName(r) {
            const lang = getLang();
            const kk = r.n_kk || r.n || '';
            const ru = r.n_ru || r.n || '';
            return (lang === 'ru') ? (ru || kk) : (kk || ru);
        }

        /* Get region label by id — used to show oblast under cemetery cards */
        function getRegionNameById(regionId) {
            if (!regionId || regionId === 'unknown') return '';
            const r = KZ_REGIONS.find(x => x.id === regionId);
            return r ? regionName(r) : '';
        }

        function escapeHtml(value) {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function isNearSameCemetery(latA, lngA, latB, lngB) {
            if (!Number.isFinite(latA) || !Number.isFinite(lngA) || !Number.isFinite(latB) || !Number.isFinite(lngB)) {
                return false;
            }
            return Math.abs(latA - latB) <= CEMETERY_PROFILE_MATCH_EPS
                && Math.abs(lngA - lngB) <= CEMETERY_PROFILE_MATCH_EPS;
        }

        function isSameCemetery(cemeteryIdA, cemeteryIdB) {
            if (!cemeteryIdA || !cemeteryIdB) return false;
            return String(cemeteryIdA) === String(cemeteryIdB);
        }

        function getCemeteryProfilesForPoint(cemeteryId, lat, lng) {
            const approved = PRIVATE_CEMETERY_PROFILES
                .filter(p => isSameCemetery(p.cemetery_id, cemeteryId) || isNearSameCemetery(p.lat, p.lng, lat, lng))
                .map(p => ({
                    id: p.id,
                    name: p.name || p.fullName || '',
                    birth: p.birth || '?',
                    death: p.death || '?',
                    visibility_status: p.visibility_status || 'private',
                    pending: false
                }));

            const pending = PENDING_CEMETERY_PROFILES
                .filter(p => isSameCemetery(p.cemetery_id, cemeteryId) || isNearSameCemetery(p.lat, p.lng, lat, lng))
                .map(p => ({
                    id: p.id,
                    name: p.name || p.fullName || '',
                    birth: p.birth || '?',
                    death: p.death || '?',
                    visibility_status: 'private',
                    pending: true
                }));

            return [...approved, ...pending];
        }

        function renderCemeteryProfilesHtml(cemeteryId, lat, lng) {
            const rows = getCemeteryProfilesForPoint(cemeteryId, lat, lng);
            if (!rows.length) return '';

            const lang = getLang();
            const sectionTitle = lang === 'ru'
                ? '🕯️ Доступные вам захоронения'
                : '🕯️ Осы зираттағы қолжетімді тұлғалар';
            const privateLabel = lang === 'ru' ? 'Приватно' : 'Жеке';
            const familyLabel = lang === 'ru' ? 'Семейный' : 'Отбасылық';
            const pendingLabel = lang === 'ru' ? 'На модерации' : 'Модерацияда';

            const items = rows.map(p => {
                const badge = p.pending
                    ? pendingLabel
                    : (p.visibility_status === 'family_only' ? familyLabel : privateLabel);
                const badgeStyle = p.pending
                    ? 'background:rgba(234,179,8,0.14); color:#eab308; border:1px solid rgba(234,179,8,0.35);'
                    : (p.visibility_status === 'family_only'
                        ? 'background:rgba(59,130,246,0.14); color:#93c5fd; border:1px solid rgba(59,130,246,0.35);'
                        : 'background:rgba(163,163,163,0.14); color:#d4d4d8; border:1px solid rgba(113,113,122,0.5);');

                return `
                  <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px 8px; background:var(--surface-light); border:1px solid var(--border); border-radius:6px;">
                    <div style="min-width:0;">
                      <div style="font-size:0.78rem; color:var(--text); font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(p.name || t('map_not_found'))}</div>
                      <div style="font-size:0.72rem; color:var(--muted);">${escapeHtml(String(p.birth || '?'))} - ${escapeHtml(String(p.death || '?'))}</div>
                    </div>
                    <span style="flex-shrink:0; font-size:0.64rem; font-weight:700; padding:2px 6px; border-radius:999px; ${badgeStyle}">${escapeHtml(badge)}</span>
                  </div>`;
            }).join('');

            return `
              <div style="margin:10px 0 0; border-top:1px dashed var(--border); padding-top:8px;">
                <div style="font-size:0.76rem; color:var(--gold); font-weight:700; margin-bottom:6px;">${sectionTitle}</div>
                <div style="display:flex; flex-direction:column; gap:5px;">${items}</div>
              </div>`;
        }

        // ── MOBILE NAVIGATION ──
        // Defensive layout fix: if .layout wrapper is missing in HTML,
        // map appears "empty" because it renders below the viewport.
        function ensureMapLayoutContainer() {
            const sidebar = document.getElementById('sidebar');
            const mapEl = document.getElementById('map');
            if (!sidebar || !mapEl) return;

            const sidebarParent = sidebar.parentElement;
            const mapParent = mapEl.parentElement;
            if (!sidebarParent || sidebarParent !== mapParent) return;
            if (sidebarParent.classList && sidebarParent.classList.contains('layout')) return;

            const layout = document.createElement('div');
            layout.className = 'layout';
            sidebarParent.insertBefore(layout, sidebar);
            layout.appendChild(sidebar);
            layout.appendChild(mapEl);

            const regionBackBtn = document.getElementById('regionBackBtn');
            if (regionBackBtn && regionBackBtn.parentElement === sidebarParent) {
                layout.appendChild(regionBackBtn);
            }
        }
        ensureMapLayoutContainer();

        function showMobileMap() {
            document.getElementById('sidebar').classList.remove('open');
            document.getElementById('mapNavBtn').classList.add('active');
            document.getElementById('listNavBtn').classList.remove('active');
            setTimeout(() => map.invalidateSize(), 320); // re-render map after animation
        }

        function showMobileList() {
            document.getElementById('sidebar').classList.add('open');
            document.getElementById('listNavBtn').classList.add('active');
            document.getElementById('mapNavBtn').classList.remove('active');
        }

        // Initial state from URL
        const urlParams = new URLSearchParams(window.location.search);
        const urlLat = parseFloat(urlParams.get('lat'));
        const urlLng = parseFloat(urlParams.get('lng'));
        const urlZoom = parseInt(urlParams.get('zoom'), 10);

        const map = L.map('map', {
            zoomControl: false,
            preferCanvas: true,
            minZoom: 5,
            maxZoom: 16
        });

        if (!isNaN(urlLat) && !isNaN(urlLng)) {
            map.setView([urlLat, urlLng], !isNaN(urlZoom) ? urlZoom : 12);
        } else {
            map.setView([48.0196, 66.9237], 5);
        }

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
            maxZoom: 19
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // ── ICONS ──
        function makeGraveIcon(active = false) {
            const bg = active ? '#d4af37' : '#2d3748';
            const ring = active ? '#2d3748' : '#d4af37';
            return L.divIcon({
                html: `<div style="
        width:34px; height:34px; border-radius:50%;
        background:${bg}; border:3px solid ${ring};
        display:flex; align-items:center; justify-content:center;
        color:${active ? '#09090b' : '#d4af37'}; font-size:14px;
        box-shadow:0 2px 12px rgba(0,0,0,0.5);
        transition:transform 0.2s;
      ">☽</div>`,
                iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -20], className: ''
            });
        }

        const cemIconOpts = {
            radius: 5,
            fillColor: '#71717a',
            color: '#09090b',
            weight: 2,
            opacity: 1,
            fillOpacity: 1
        };

        const userIcon = L.divIcon({
            html: `<div style="width:20px; height:20px; border-radius:50%; background:#d4af37; border:3px solid #09090b; box-shadow:0 0 0 4px rgba(212,175,55,0.3), 0 2px 8px rgba(0,0,0,0.4);"></div>`,
            iconSize: [20, 20], iconAnchor: [10, 10], className: ''
        });

        // ── CLUSTER ──
        const markersCluster = L.markerClusterGroup({
            chunkedLoading: true,
            iconCreateFunction: function (cluster) {
                const count = cluster.getChildCount();
                let sizeClass = 'marker-cluster-small';
                let size = 40;
                if (count > 100) { sizeClass = 'marker-cluster-large'; size = 60; }
                else if (count > 20) { sizeClass = 'marker-cluster-medium'; size = 50; }

                return L.divIcon({
                    html: `<div><span>${count}</span></div>`,
                    className: `marker-cluster-custom ${sizeClass}`,
                    iconSize: L.point(size, size)
                });
            },
            maxClusterRadius: 50,
            disableClusteringAtZoom: 15
        });
        markersCluster.addTo(map); 
        
        // ── REGIONS & CLUSTERS ──
        const regionsLayer = L.layerGroup();
        const KZ_REGIONS = [
            { id: 'almaty', n_kk: "Алматы", n_ru: "Алматы", lt: 43.2380, ln: 76.9458, geo_lt: 43.2, geo_ln: 76.8, count: 0 },
            { id: 'astana', n_kk: "Астана", n_ru: "Астана", lt: 51.1282, ln: 71.4307, geo_lt: 51.16, geo_ln: 71.44, count: 0 },
            { id: 'shymkent', n_kk: "Шымкент", n_ru: "Шымкент", lt: 42.3154, ln: 69.5967, geo_lt: 42.34, geo_ln: 69.59, count: 0 },
            { id: 'abai', n_kk: "Абай облысы", n_ru: "Абайская область", lt: 50.4111, ln: 80.2275, geo_lt: 48.9, geo_ln: 80.2, count: 0 },
            { id: 'akmola', n_kk: "Ақмола облысы", n_ru: "Акмолинская область", lt: 52.9500, ln: 69.3833, geo_lt: 51.8, geo_ln: 69.4, count: 0 },
            { id: 'aktobe', n_kk: "Ақтөбе облысы", n_ru: "Актюбинская область", lt: 50.2839, ln: 57.2100, geo_lt: 48.8, geo_ln: 58.3, count: 0 },
            { id: 'almaty_obl', n_kk: "Алматы облысы", n_ru: "Алматинская область", lt: 44.8488, ln: 77.0900, geo_lt: 44.5, geo_ln: 77.8, count: 0 },
            { id: 'atyrau', n_kk: "Атырау облысы", n_ru: "Атырауская область", lt: 47.1076, ln: 51.9139, geo_lt: 47.1, geo_ln: 51.9, count: 0 },
            { id: 'vko', n_kk: "Шығыс Қазақстан", n_ru: "Восточный Казахстан", lt: 49.9481, ln: 82.6282, geo_lt: 49.9, geo_ln: 82.6, count: 0 },
            { id: 'zhambyl', n_kk: "Жамбыл облысы", n_ru: "Жамбылская область", lt: 42.9000, ln: 71.3667, geo_lt: 43.8, geo_ln: 72.8, count: 0 },
            { id: 'zhetysu', n_kk: "Жетісу облысы", n_ru: "Жетісу облысы", lt: 45.0178, ln: 78.3738, geo_lt: 45.0, geo_ln: 79.0, count: 0 },
            { id: 'zko', n_kk: "Батыс Қазақстан", n_ru: "Западный Казахстан", lt: 50.0000, ln: 51.5000, geo_lt: 50.0, geo_ln: 50.5, count: 0 },
            { id: 'karaganda', n_kk: "Қарағанды облысы", n_ru: "Карагандинская область", lt: 49.8019, ln: 73.1021, geo_lt: 48.5, geo_ln: 72.0, count: 0 },
            { id: 'kostanay', n_kk: "Қостанай облысы", n_ru: "Костанайская область", lt: 52.9000, ln: 63.6246, geo_lt: 52.5, geo_ln: 63.6, count: 0 },
            { id: 'kyzylorda', n_kk: "Қызылорда облысы", n_ru: "Кызылординская область", lt: 44.8531, ln: 65.5092, geo_lt: 44.8, geo_ln: 63.5, count: 0 },
            { id: 'mangystau', n_kk: "Маңғыстау облысы", n_ru: "Мангистауская область", lt: 43.6353, ln: 51.1479, geo_lt: 44.0, geo_ln: 53.0, count: 0 },
            { id: 'pavlodar', n_kk: "Павлодар облысы", n_ru: "Павлодарская область", lt: 52.2873, ln: 76.9674, geo_lt: 52.3, geo_ln: 76.0, count: 0 },
            { id: 'sko', n_kk: "Солтүстік Қазақстан", n_ru: "Северо-Казахстанская область", lt: 53.0000, ln: 69.5000, geo_lt: 53.5, geo_ln: 68.5, count: 0 },
            { id: 'turkestan', n_kk: "Түркістан облысы", n_ru: "Туркестанская область", lt: 43.3017, ln: 68.2522, geo_lt: 42.8, geo_ln: 68.3, count: 0 },
            { id: 'ulytau', n_kk: "Ұлытау облысы", n_ru: "Ұлытау облысы", lt: 47.7845, ln: 67.7144, geo_lt: 47.8, geo_ln: 66.0, count: 0 },
            { id: 'zarubezh', n_kk: "Шет елдер", n_ru: "Зарубежье", lt: 55.75, ln: 37.61, geo_lt: 55.7, geo_ln: 37.6, count: 0 }
        ];

        function makeRegionLabelIcon(name, count) {
            const size = count > 300 ? 54 : count > 100 ? 46 : 40;
            const fontSize = count > 300 ? 14 : count > 100 ? 12 : 11;
            return L.divIcon({
                html: `<div style="
                    display:flex; flex-direction:column; align-items:center; gap:3px;
                    transform: translate(-50%, -50%); cursor:pointer;
                ">
                    <div style="
                        width:${size}px; height:${size}px; border-radius:50%;
                        background: linear-gradient(135deg, #d4af37, #b8941e);
                        border: 3px solid #09090b;
                        display:flex; align-items:center; justify-content:center;
                        font-family:'Inter',sans-serif; font-weight:800;
                        font-size:${fontSize}px; color:#09090b;
                        box-shadow: 0 3px 10px rgba(0,0,0,0.5), 0 0 0 2px rgba(212,175,55,0.3);
                        transition: transform 0.2s;
                    ">${count}</div>
                    <div style="
                        background: rgba(9,9,11,0.85);
                        color: #e4e4e7;
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-family:'Inter',sans-serif;
                        font-size: 9px;
                        font-weight: 600;
                        white-space: nowrap;
                        letter-spacing: 0.02em;
                        max-width: 100px;
                        text-align: center;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    ">${name}</div>
                </div>`,
                className: '',
                iconSize: [size + 10, size + 20],
                iconAnchor: [(size + 10) / 2, (size + 20) / 2]
            });
        }

        const cemeteriesLayer = L.layerGroup();
        let superclusterIndex = null;
        let allFeatures = []; 
        let activeRegionId = null;

        if (typeof CEMETERIES_DATA !== 'undefined' && typeof Supercluster !== 'undefined') {
            CEMETERIES_DATA.forEach(c => {
                    let bestR = null;

                    // 1. Strict bounds check
                    for (const r of KZ_REGIONS) {
                        if (r.b_min_lt && c.lt >= r.b_min_lt && c.lt <= r.b_max_lt && c.ln >= r.b_min_ln && c.ln <= r.b_max_ln) {
                            if (bestR === null) bestR = r; // If multiple match, we might take the first (e.g. city bounds before oblast)
                        }
                    }

                    // 2. Fallback distance calculation
                    if (!bestR) {
                        if (c.lt > 56 || c.lt < 39 || c.ln < 45 || c.ln > 88) {
                            bestR = KZ_REGIONS.find(x => x.id === 'zarubezh');
                        } else {
                            let minD = Infinity;
                            KZ_REGIONS.forEach(r => {
                                if (r.id === 'zarubezh') return;
                                const dx = (r.geo_ln - c.ln) * Math.cos((r.geo_lt + c.lt) * Math.PI / 360);
                                const dy = (r.geo_lt - c.lt);
                                let d = dx * dx + dy * dy;

                                if (r.radius && d > (r.radius * r.radius)) {
                                    d += 50.0; // Large penalty for cities if outside radius
                                }

                                if (d < minD) { minD = d; bestR = r; }
                            });
                        }
                    }
                    if (bestR) bestR.count++;

                allFeatures.push({
                    type: "Feature",
                    properties: {
                        id: c.id,
                        n: c.n,
                        n_ru: c.n_ru || c.n,
                        n_kk: c.n_kk || c.n,
                        region_id: bestR ? bestR.id : 'unknown',
                        region_name_ru: bestR ? (bestR.n_ru || bestR.n || '') : '',
                        region_name_kk: bestR ? (bestR.n_kk || bestR.n || '') : '',
                        isPending: false
                    },
                    geometry: { type: "Point", coordinates: [c.ln, c.lt] }
                });
            });

            superclusterIndex = new Supercluster({ radius: 50, maxZoom: 15 });
            superclusterIndex.load(allFeatures);

            function drillIntoRegion(regionId) {
                activeRegionId = regionId;
                const filtered = allFeatures.filter(f => f.properties.region_id === regionId);
                superclusterIndex = new Supercluster({ radius: 50, maxZoom: 15 });
                superclusterIndex.load(filtered);
                const r = KZ_REGIONS.find(x => x.id === regionId);
                document.getElementById('regionBackBtn').style.display = 'flex';
                document.getElementById('regionBackLabel').textContent = r ? regionName(r) : regionId;
                
                const sel = document.getElementById('regionSelect');
                if (sel) sel.value = regionId;
                if (typeof renderList === 'function') renderList();
            }

            function resetToAllRegions() {
                activeRegionId = null;
                superclusterIndex = new Supercluster({ radius: 50, maxZoom: 15 });
                superclusterIndex.load(allFeatures);
                document.getElementById('regionBackBtn').style.display = 'none';
                const sel = document.getElementById('regionSelect');
                if (sel) sel.value = '';
                if (typeof renderList === 'function') renderList();
            }
            window.resetToAllRegions = resetToAllRegions;
            document.getElementById('regionBackBtn').addEventListener('click', () => {
                resetToAllRegions();
                map.flyTo([48.0196, 66.9237], 5, { duration: 1 });
            });

            refreshRegionsUI = function () {
                const regionSel = document.getElementById('regionSelect');
                if (regionSel) {
                    while (regionSel.options.length > 1) regionSel.remove(1);
                    KZ_REGIONS.forEach(r => {
                        if (r.count > 0) {
                            const opt = document.createElement('option');
                            opt.value = r.id;
                            opt.textContent = `${regionName(r)} (${r.count})`;
                            regionSel.appendChild(opt);
                        }
                    });
                }

                regionsLayer.clearLayers();
                KZ_REGIONS.forEach(r => {
                    if (r.count > 0) {
                        const m = L.marker([r.lt, r.ln], { icon: makeRegionLabelIcon(regionName(r), r.count) });
                        m._regionId = r.id;
                        m.on('click', () => {
                            drillIntoRegion(r.id);
                            map.flyTo([r.lt, r.ln], 8, { duration: 1.2 });
                        });
                        regionsLayer.addLayer(m);
                    }
                });

                if (activeRegionId) {
                    const r = KZ_REGIONS.find(x => x.id === activeRegionId);
                    if (r) document.getElementById('regionBackLabel').textContent = regionName(r);
                }
            };
            refreshRegionsUI();

            window.handleRegionSelect = function (regionId) {
                if (regionId) {
                    drillIntoRegion(regionId);
                    const r = KZ_REGIONS.find(x => x.id === regionId);
                    if (r) map.flyTo([r.lt, r.ln], 8, { duration: 1.2 });
                } else {
                    resetToAllRegions();
                    map.flyTo([48.0196, 66.9237], 5, { duration: 1 });
                }
            };

            const KZ_BOUNDS = { latMin: 40.5, latMax: 55.5, lngMin: 46.5, lngMax: 87.5 };

            function renderClusters() {
                cemeteriesLayer.clearLayers();
                const bounds = map.getBounds();
                const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
                const zoom = map.getZoom();
                const clusters = superclusterIndex.getClusters(bbox, zoom);

                clusters.forEach(f => {
                    const [lng, lat] = f.geometry.coordinates;
                    if (lat < KZ_BOUNDS.latMin || lat > KZ_BOUNDS.latMax || lng < KZ_BOUNDS.lngMin || lng > KZ_BOUNDS.lngMax) return;

                    if (f.properties.cluster) {
                        const count = f.properties.point_count;
                        let sizeClass = 'marker-cluster-small';
                        let size = 40;
                        if (count > 100) { sizeClass = 'marker-cluster-large'; size = 60; }
                        else if (count > 20) { sizeClass = 'marker-cluster-medium'; size = 50; }

                        const icon = L.divIcon({
                            html: `<div><span>${count}</span></div>`,
                            className: `marker-cluster-custom ${sizeClass}`,
                            iconSize: L.point(size, size)
                        });

                        const m = L.marker([lat, lng], { icon });
                        m.on('click', () => {
                            const expZoom = superclusterIndex.getClusterExpansionZoom(f.properties.cluster_id);
                            map.flyTo([lat, lng], expZoom, { duration: 0.8 });
                        });
                        cemeteriesLayer.addLayer(m);
                    } else {
                        const c = f.properties;
                        const regionLabel = getRegionNameById(c.region_id);
                        
                        // Bilingual cemetery name based on current UI language
                        const lang = window.i18n ? window.i18n.getLang() : 'kk';
                        const localizedName = lang === 'kk' ? (c.n_kk || c.n) : (c.n_ru || c.n);
                        const encodedLocalizedName = encodeURIComponent(localizedName || '');

                        // Custom style for pending UGC
                        let markerOpts = cemIconOpts;
                        const isPending = c.isPending;
                        if (isPending) {
                            markerOpts = { radius: 6, fillColor: "#71717a", color: "#27272a", weight: 2, opacity: 0.8, fillOpacity: 0.6 };
                        }

                        const m = L.circleMarker([lat, lng], markerOpts);
                        m.on('popupopen', async (e) => {
                            const districtEl = e.popup.getElement().querySelector('.cem-district');
                            if (!districtEl) return;
                            try {
                                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=${lang}`, { headers: { 'User-Agent': 'Ziratstan.kz/1.0' } });
                                const geo = await res.json();
                                const addr = geo.address || {};
                                // District = county, suburb, quarter, village, town, city_district — first available
                                const district = addr.county || addr.state_district || addr.suburb || addr.quarter || addr.city_district || addr.village || addr.town || '';
                                if (district) {
                                    districtEl.textContent = `🏘️ ${district}`;
                                    districtEl.style.display = 'block';
                                }
                            } catch (err) { /* silently ignore if offline */ }
                        });
                        m.bindPopup(`<div style="padding:10px;font-family:Inter;background:var(--surface);">
                            <div style="font-weight:700; color:${isPending ? 'var(--muted)' : 'var(--text)'}; margin-bottom:3px;">
                                ${isPending ? '<span style="color:var(--yellow); font-size:0.75rem; vertical-align:middle; margin-right:4px;">⏱️ На модерации</span><br/>' : ''}
                                ${localizedName}
                            </div>
                            ${regionLabel ? `<div style="font-size:0.75rem; color:var(--gold); margin-bottom:2px; font-weight:600;">🗺️ ${regionLabel}</div>` : ''}
                            <div class="cem-district" style="font-size:0.75rem; color:var(--muted); margin-bottom:4px; display:none;"></div>
                            <div style="font-size:0.8rem; color:var(--muted); margin-bottom:10px;">${t('map_coords_label')}: ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
                            ${!isPending ? renderCemeteryProfilesHtml(c.id, lat, lng) : ''}
                            ${!isPending ? `
                            <div style="display:flex; flex-direction:column; gap:5px; margin-top:8px;">
                              <a href="#" onclick="openUgcModal('${c.id}', decodeURIComponent('${encodedLocalizedName}'), ${lat}, ${lng}); return false;" style="display:block; text-align:center; background:var(--surface-light); border:1px solid var(--border); border-radius:6px; padding:6px; color:var(--text); text-decoration:none; font-size:0.8rem; font-weight:600;">${t('map_popup_refine_name')}</a>
                              <a href="#" onclick="openAddProfileModal('${c.id}', decodeURIComponent('${encodedLocalizedName}'), ${lat}, ${lng}); return false;" style="display:block; text-align:center; background:rgba(212,175,55,0.1); border:1px solid var(--gold); border-radius:6px; padding:6px; color:var(--gold); text-decoration:none; font-size:0.8rem; font-weight:600;">➕ ${t('map_add_profile')}</a>
                            </div>` : ''}
                        </div>`);
                        cemeteriesLayer.addLayer(m);
                    }
                });
            }

            function updateMapLayers() {
                const z = map.getZoom();
                if (z < 7) {
                    if (activeRegionId) resetToAllRegions();
                    cemeteriesLayer.clearLayers();
                    if (map.hasLayer(cemeteriesLayer)) map.removeLayer(cemeteriesLayer);
                    if (!map.hasLayer(regionsLayer)) map.addLayer(regionsLayer);
                } else {
                    if (map.hasLayer(regionsLayer)) map.removeLayer(regionsLayer);
                    if (!map.hasLayer(cemeteriesLayer)) map.addLayer(cemeteriesLayer);
                    renderClusters();
                    if (typeof renderList === 'function') renderList();
                }
            }

            function updateUrl() {
                const center = map.getCenter();
                const zoom = map.getZoom();
                const url = new URL(window.location);
                url.searchParams.set('lat', center.lat.toFixed(6));
                url.searchParams.set('lng', center.lng.toFixed(6));
                url.searchParams.set('zoom', zoom);
                window.history.replaceState({}, '', url);
            }

            map.on('moveend', debounce(() => {
                updateMapLayers();
                updateUrl();
            }, 300));
            updateMapLayers();
        }

        // ── RENDER SIDEBAR ──
        function renderList() {
            const qCode = document.getElementById('searchInput').value.toLowerCase().trim();
            const filteredVip = PROFILES.filter(p => {
                const matchFilter = currentFilter === 'all' || (currentFilter === 'historical' && p.filter === 'historical');
                const matchEra = (currentFilter === 'all') || (currentEra === 'all') || (p.era === currentEra);
                
                let matchRegion = true;
                if (activeRegionId && activeRegionId !== 'zarubezh') {
                    const r = KZ_REGIONS.find(x => x.id === activeRegionId);
                    if (r) {
                        const dx = (r.geo_ln - p.lng) * Math.cos((r.geo_lt + p.lat) * Math.PI / 360);
                        const dy = (r.geo_lt - p.lat);
                        matchRegion = (dx * dx + dy * dy) < 25.0;
                    }
                } else if (activeRegionId === 'zarubezh') {
                    matchRegion = (p.lat > 56 || p.lat < 39 || p.lng < 45 || p.lng > 88);
                }

                const pName = (p.name || p.fullName || '').toLowerCase();
                const pCem = (p.cemetery || '').toLowerCase();
                const pCity = (p.city || '').toLowerCase();
                const pId = (p.id || '').toLowerCase();
                const searchQ = !qCode || pName.includes(qCode) || pCem.includes(qCode) || pCity.includes(qCode) || pId.includes(qCode);

                return matchFilter && matchEra && matchRegion && searchQ;
            }).filter(p => currentFilter !== 'cemeteries');

            const filteredGen = [];
            if (typeof CEMETERIES_DATA !== 'undefined' && (currentFilter === 'all' || currentFilter === 'cemeteries')) {
                CEMETERIES_DATA.forEach(c => {
                    let matchRegion = true;
                    if (activeRegionId) {
                        const r = KZ_REGIONS.find(x => x.id === activeRegionId);
                        if (r && activeRegionId !== 'zarubezh') {
                            const dx = (r.geo_ln - c.ln) * Math.cos((r.geo_lt + c.lt) * Math.PI / 360);
                            const dy = (r.geo_lt - c.lt);
                            matchRegion = (dx * dx + dy * dy) < 25.0;
                        } else if (activeRegionId === 'zarubezh') {
                            matchRegion = (c.lt > 56 || c.lt < 39 || c.ln < 45 || c.ln > 88);
                        }
                    }
                    /* Also search by oblast name so user can type "Алматы" etc. */
                    const feat = allFeatures.find(f => f.properties.id === c.id);
                    const oblastName = feat ? getRegionNameById(feat.properties.region_id).toLowerCase() : '';
                    if (matchRegion && (!qCode || c.n.toLowerCase().includes(qCode) || oblastName.includes(qCode))) {
                        // Pass along isPending flag if it exists on the feature
                        if (feat && feat.properties.isPending) {
                            filteredGen.push({ ...c, isPending: true });
                        } else {
                            filteredGen.push(c);
                        }
                    }
                });
            }

            const total = filteredVip.length + filteredGen.length;
            const resCountEl = document.getElementById('resultsCount');
            if (resCountEl) resCountEl.textContent = `${t('map_results_found')}: ${total}`;

            let displayList = '';
            if (total === 0 && qCode) {
                displayList += `
                <div style="padding: 2rem 1rem; text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 1rem; color: var(--muted);">🔍</div>
                    <div style="color: var(--text); margin-bottom: 0.5rem; font-weight: 600;">${t('map_not_found')}</div>
                    <div style="color: var(--muted); font-size: 0.85rem; margin-bottom: 1.5rem;">${t('map_empty_desc')}</div>
                    <button class="geo-btn" style="background: var(--gold); color: #09090b; border: none; font-weight: 700;" onclick="openAddProfileModal(null, null, null, null)">➕ ${t('map_add_profile')}</button>
                </div>`;
            }

            filteredVip.forEach(p => {
                const displayName = p.name || p.fullName || 'Белгісіз';
                const initials = displayName[0] || '?';
                displayList += `
      <a class="profile-card ${activeId === p.id ? 'active' : ''}" onclick="selectProfile('${p.id}'); return false;" href="profile.html?id=${p.id}">
        <div class="card-avatar">
          ${p.photo ? `<img src="${p.photo}" alt="${displayName}" />` : initials}
        </div>
        <div class="card-info">
          <div class="card-name">${displayName}</div>
          <div class="card-meta">📅 ${p.birth} — ${p.death}</div>
          <div class="card-cemetery">📍 ${p.cemetery || ''}${p.city ? `, ${p.city}` : ''}</div>
        </div>
        <span class="card-arrow">›</span>
      </a>`;
            });

            const genLimit = Math.min(filteredGen.length, 50);
            for (let i = 0; i < genLimit; i++) {
                const c = filteredGen[i];
                /* Find the feature to get cached region_id */
                const feat = allFeatures.find(f => f.properties.id === c.id);
                const regionLabel = feat ? getRegionNameById(feat.properties.region_id) : '';
                const isPending = c.isPending || (feat && feat.properties.isPending);
                
                // Bilingual cemetery name for sidebar
                const lang = window.i18n ? window.i18n.getLang() : 'kk';
                const localizedName = lang === 'kk'
                    ? (feat ? feat.properties.n_kk : (c.n_kk || c.n))
                    : (feat ? feat.properties.n_ru : (c.n_ru || c.n));

                displayList += `
      <a class="profile-card" onclick="map.flyTo([${c.lt}, ${c.ln}], 16); return false;" href="#" style="opacity: ${isPending ? '0.6' : '1'};">
        <div class="card-avatar" style="color:var(--muted); border-color:var(--border);">🪦</div>
        <div class="card-info">
          <div class="card-name" style="color:${isPending ? 'var(--muted)' : 'var(--text)'}">
            ${isPending ? '<span style="color:var(--yellow); font-size:0.7rem; font-weight:700;">⏱️ На модерации</span><br/>' : ''}
            ${localizedName}
          </div>
          ${regionLabel ? `<div class="card-cemetery" style="color:var(--gold); font-size:0.78rem; font-weight:600;">🗺️ ${regionLabel}</div>` : ''}
          <div class="card-meta">${t('map_general_cemetery')}</div>
        </div>
        <span class="card-arrow">›</span>
      </a>`;
            }

            if (filteredGen.length > 50) {
                displayList += `<div style="text-align:center; padding:15px; color:var(--muted); font-size:0.8rem; border-bottom:1px solid var(--border);">${t('map_showing_top')}: 50 / ${filteredGen.length}. ${t('map_refine_search')}</div>`;
            }

            const resListEl = document.getElementById('resultsList');
            if (resListEl) resListEl.innerHTML = displayList;

            PROFILES.forEach(p => {
                if (pMarkers[p.id]) {
                    const isVisible = filteredVip.find(f => f.id === p.id);
                    if (isVisible) {
                        if (!markersCluster.hasLayer(pMarkers[p.id])) markersCluster.addLayer(pMarkers[p.id]);
                    } else {
                        if (markersCluster.hasLayer(pMarkers[p.id])) markersCluster.removeLayer(pMarkers[p.id]);
                    }
                }
            });
        }

        async function initData() {
            try {
                if (typeof fetchVipProfiles === 'function') {
                    const dbProfiles = await fetchVipProfiles();
                    const localProfiles = typeof PROFILES_STATIC !== 'undefined' ? PROFILES_STATIC : [];
                    const COORD_THRESHOLD = 0.02;
                    const dbOnlyProfiles = dbProfiles.filter(dbP => {
                        if (!dbP.lat || !dbP.lng) return false;
                        return !localProfiles.some(localP => {
                            if (!localP.lat || !localP.lng) return false;
                            return Math.abs(dbP.lat - localP.lat) < COORD_THRESHOLD && Math.abs(dbP.lng - localP.lng) < COORD_THRESHOLD;
                        });
                    });
                    PROFILES = [...localProfiles, ...dbOnlyProfiles];
                } else {
                    PROFILES = typeof PROFILES_STATIC !== 'undefined' ? PROFILES_STATIC : [];
                }
            } catch (err) {
                console.error('[Data Init Error]', err);
                PROFILES = typeof PROFILES_STATIC !== 'undefined' ? PROFILES_STATIC : [];
            }

            // Bring user's pending UGC onto map
            try {
                if (typeof fetchMyCemeteryProfiles === 'function') {
                    PRIVATE_CEMETERY_PROFILES = await fetchMyCemeteryProfiles();
                }

                if (typeof fetchMyPendingUgc === 'function') {
                    const pendingUgc = await fetchMyPendingUgc();
                    
                    // Inject pending cemeteries as features
                    if (pendingUgc.names && pendingUgc.names.length > 0) {
                        pendingUgc.names.forEach(p => {
                            if (!p.lat || !p.lng) return;
                            
                            let bestR = null;

                            // 1. Strict bounds check for pending UGC
                            for (const r of KZ_REGIONS) {
                                if (r.b_min_lt && p.lat >= r.b_min_lt && p.lat <= r.b_max_lt && p.lng >= r.b_min_ln && p.lng <= r.b_max_ln) {
                                    if (bestR === null) bestR = r;
                                }
                            }

                            // 2. Fallback check for pending UGC
                            if (!bestR) {
                                if (p.lat > 56 || p.lat < 39 || p.lng < 45 || p.lng > 88) {
                                    bestR = KZ_REGIONS.find(x => x.id === 'zarubezh');
                                } else {
                                    let minD = Infinity;
                                    KZ_REGIONS.forEach(r => {
                                        if (r.id === 'zarubezh') return;
                                        const dx = (r.geo_ln - p.lng) * Math.cos((r.geo_lt + p.lat) * Math.PI / 360);
                                        const dy = (r.geo_lt - p.lat);
                                        let d = dx * dx + dy * dy;
                                        if (r.radius && d > (r.radius * r.radius)) {
                                            d += 50.0; // Penalty
                                        }
                                        if (d < minD) { minD = d; bestR = r; }
                                    });
                                }
                            }
                            if (bestR) bestR.count++;
                            
                            // Create temporary ID
                            const tempId = `ugc_${p.id}`;
                            CEMETERIES_DATA.push({ id: tempId, n: p.suggested_name, lt: p.lat, ln: p.lng });
                            
                            allFeatures.push({
                                type: "Feature",
                                properties: { 
                                    id: tempId, 
                                    n: p.suggested_name, 
                                    region_id: bestR ? bestR.id : 'unknown', 
                                    region_name_ru: bestR ? (bestR.n_ru || bestR.n || '') : '', 
                                    region_name_kk: bestR ? (bestR.n_kk || bestR.n || '') : '', 
                                    isPending: true 
                                },
                                geometry: { type: "Point", coordinates: [p.lng, p.lat] }
                            });
                        });
                        
                        // Re-init supercluster with these new features
                        if (superclusterIndex) {
                            superclusterIndex.load(allFeatures);
                        }
                    }

                    // Keep pending user profiles inside cemetery popup, not as separate map markers.
                    PENDING_CEMETERY_PROFILES = (pendingUgc.profiles || [])
                        .filter(p => Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)))
                        .map(p => ({
                            id: p.id,
                            name: p.full_name,
                            birth: p.birth_year ? String(p.birth_year).substring(0, 4) : '?',
                            death: p.death_year ? String(p.death_year).substring(0, 4) : '?',
                            cemetery_id: p.cemetery_id || null,
                            lat: Number(p.lat),
                            lng: Number(p.lng)
                        }));
                }
            } catch (e) {
                console.warn("[Map] Failed fetching pending ugc:", e);
            }

            const shouldRetryPrivateLoad = (
                typeof ZiratAuth !== 'undefined'
                && typeof ZiratAuth.isLoggedIn === 'function'
                && ZiratAuth.isLoggedIn()
                && PRIVATE_CEMETERY_PROFILES.length === 0
                && PENDING_CEMETERY_PROFILES.length === 0
            );

            if (shouldRetryPrivateLoad) {
                setTimeout(async () => {
                    try {
                        if (typeof fetchMyCemeteryProfiles === 'function') {
                            PRIVATE_CEMETERY_PROFILES = await fetchMyCemeteryProfiles();
                        }
                        if (typeof fetchMyPendingUgc === 'function') {
                            const retryPending = await fetchMyPendingUgc();
                            PENDING_CEMETERY_PROFILES = (retryPending.profiles || [])
                                .filter(p => Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng)))
                                .map(p => ({
                                    id: p.id,
                                    name: p.full_name,
                                    birth: p.birth_year ? String(p.birth_year).substring(0, 4) : '?',
                                    death: p.death_year ? String(p.death_year).substring(0, 4) : '?',
                                    cemetery_id: p.cemetery_id || null,
                                    lat: Number(p.lat),
                                    lng: Number(p.lng)
                                }));
                        }
                        if (typeof updateMapLayers === 'function') updateMapLayers();
                    } catch (retryError) {
                        console.warn('[Map] Delayed private profile reload failed:', retryError);
                    }
                }, 1200);
            }

            if (typeof updateMapLayers === 'function') {
                updateMapLayers();
            }

            const vipMarkersBatch = [];
            let foreignVipCount = 0;
            PROFILES.forEach(p => {
                const m = addVipMarker(p, false);
                vipMarkersBatch.push(m);
                if (p.lat > 56 || p.lat < 39 || p.lng < 45 || p.lng > 88) foreignVipCount++;
            });
            markersCluster.addLayers(vipMarkersBatch);

            if (foreignVipCount > 0) {
                const zr = KZ_REGIONS.find(x => x.id === 'zarubezh');
                if (zr) {
                    zr.count += foreignVipCount;
                    refreshRegionsUI();
                }
            }
            renderList();
        }

        function addVipMarker(p, addToCluster = true) {
            const isPending = p.isPending;
            const iconOpts = isPending ? {
                className: 'custom-div-icon',
                html: `<div style="width:24px;height:24px;background:#71717a;border-radius:50%;border:2px solid #27272a;display:flex;align-items:center;justify-content:center;opacity:0.8;"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            } : makeGraveIcon(false);
            
            const m = L.marker([p.lat, p.lng], isPending ? { icon: L.divIcon(iconOpts) } : { icon: iconOpts });
            m.bindPopup(`
      <div style="padding:12px; min-width:200px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <div style="width:40px;height:40px;border-radius:50%;background:#18181b;border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-weight:700;color:${isPending ? '#71717a' : '#d4af37'};font-size:14px;overflow:hidden;flex-shrink:0;">
            ${p.photo ? `<img src="${p.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />` : (p.name ? p.name[0] : '?')}
          </div>
          <div>
            ${isPending ? '<div style="color:#eab308;font-size:0.75rem;font-weight:700;">⏱️ На модерации</div>' : ''}
            <div style="font-weight:700;font-size:0.9rem;color:${isPending ? '#71717a' : '#f4f4f5'}">${p.name || p.fullName}</div>
            <div style="color:#71717a;font-size:0.75rem;">📅 ${p.birth} — ${p.death}</div>
          </div>
        </div>
        <div style="color:#71717a;font-size:0.75rem;margin-bottom:10px;">📍 ${p.cemetery}, ${p.city}</div>
        ${!isPending ? `
        <a href="profile.html?id=${p.id}" style="display:block;background:#d4af37;color:#09090b;text-align:center;padding:8px;border-radius:8px;text-decoration:none;font-weight:700;font-size:0.8rem;">
          ${t('map_btn_profile')}
        </a>` : ''}
      </div>
    `);

            m.on('popupopen', () => {
                if (activeId && activeId !== p.id && pMarkers[activeId]) {
                    if (!PROFILES.find(x=>x.id===activeId)?.isPending) {
                        pMarkers[activeId].setIcon(makeGraveIcon(false));
                    }
                }
                activeId = p.id;
                m.setIcon(makeGraveIcon(true));
                renderList();
            });

            m.on('popupclose', () => {
                if (activeId === p.id) {
                    m.setIcon(makeGraveIcon(false));
                    activeId = null;
                    renderList();
                }
            });

            pMarkers[p.id] = m;
            if (addToCluster) markersCluster.addLayer(m);
            return m;
        }

        function selectProfile(id, flyTo = true) {
            const p = PROFILES.find(x => x.id === id);
            if (!p) return;
            if (flyTo) {
                map.flyTo([p.lat, p.lng], 16, { duration: 1 });
                map.once('moveend', () => {
                    if (pMarkers[id]) markersCluster.zoomToShowLayer(pMarkers[id], () => pMarkers[id].openPopup());
                });
            } else {
                if (pMarkers[id]) markersCluster.zoomToShowLayer(pMarkers[id], () => pMarkers[id].openPopup());
            }
        }

        let currentEra = 'all';
        function setFilter(f, el) {
            currentFilter = f;
            document.querySelectorAll('.filter-btn').forEach(t => t.classList.remove('active'));
            if (el) el.classList.add('active');

            const eraSelectWrap = document.getElementById('eraSelectWrap');
            if (f === 'historical') {
                if (eraSelectWrap) eraSelectWrap.style.display = 'block';
            } else {
                if (eraSelectWrap) eraSelectWrap.style.display = 'none';
                currentEra = 'all';
                document.querySelectorAll('.era-btn').forEach(b => b.classList.remove('active'));
                const allBtn = document.querySelector('.era-btn[data-era="all"]');
                if (allBtn) allBtn.classList.add('active');
            }
            renderList();
        }

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => setFilter(e.target.dataset.filter, e.target));
        });

        document.querySelectorAll('.era-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.era-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentEra = e.target.dataset.era;
                renderList();
            });
        });

        // Debounce utility function
        function debounce(func, delay) {
            let timeout;
            return function(...args) {
                const context = this;
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(context, args), delay);
            };
        }

        // Apply debounce to search input
        if (document.getElementById('searchInput')) {
            document.getElementById('searchInput').addEventListener('input', debounce(renderList, 300));
        }

        let userMarker = null;
        function geolocate() {
            const btn = document.getElementById('geoBtnText');
            const status = document.getElementById('geoStatus');
            if (btn) btn.textContent = t('map_geo_locating');

            if (!navigator.geolocation) {
                if (status) { status.className = 'geo-status error'; status.textContent = t('map_geo_not_supported'); }
                if (btn) btn.textContent = t('map_geo_btn');
                return;
            }

            navigator.geolocation.getCurrentPosition(
                ({ coords: { latitude: lat, longitude: lng } }) => {
                    if (userMarker) userMarker.remove();
                    userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map)
                        .bindPopup(`<div style="padding:8px;font-family:Inter,sans-serif;font-weight:600;">${t('map_you_are_here')}</div>`)
                        .openPopup();
                    map.flyTo([lat, lng], 16, { duration: 1.5 });
                    if (status) { status.className = 'geo-status success'; status.textContent = t('map_geo_found'); }
                    if (btn) btn.textContent = t('map_geo_refresh');
                },
                err => {
                    if (status) { status.className = 'geo-status error'; status.textContent = `❌ ${err.message}`; }
                    if (btn) btn.textContent = t('map_geo_btn');
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        }

        function toggleSidebar() {
            const s = document.getElementById('sidebar');
            const b = document.getElementById('toggleBtn');
            if (s) s.classList.toggle('open');
            if (b) b.textContent = s.classList.contains('open') ? '🗺️' : '🗂️';
        }

        initData();
        document.addEventListener('langchange', () => {
            refreshRegionsUI();
            renderList();
        });

        function openUgcModal(cemeteryId, currentName, lat, lng) {
            if (typeof ZiratAuth === 'undefined' || !ZiratAuth.isLoggedIn()) {
                if (typeof ZiratAuth !== 'undefined') { ZiratAuth.openAuthModal(); return; }
            }
            window.currentUgcContext = { 
                cemeteryId: cemeteryId || null, 
                currentName: currentName || null, 
                lat: Number.isFinite(Number(lat)) ? Number(lat) : null,
                lng: Number.isFinite(Number(lng)) ? Number(lng) : null
            };
            const inp = document.getElementById('ugcNameInput');
            if (inp) inp.value = currentName || '';
            const mod = document.getElementById('ugcModal');
            if (mod) mod.style.display = 'flex';
        }

        function closeUgcModal() {
            const mod = document.getElementById('ugcModal');
            if (mod) mod.style.display = 'none';
        }

        async function submitUgcName(event) {
            event.preventDefault();
            const newName = document.getElementById('ugcNameInput').value.trim();
            if (!newName) return;
            const submitBtn = event.target.querySelector('button[type="submit"]');
            submitBtn.textContent = t('map_submit_loading');
            submitBtn.disabled = true;

            try {
                if (typeof submitUgcSuggestion === 'function') {
                    const ctx = window.currentUgcContext || {};
                    await submitUgcSuggestion({
                        cemetery_id: ctx.cemeteryId || null,
                        current_name: ctx.currentName || null,
                        suggested_name: newName,
                        lat: ctx.lat,
                        lng: ctx.lng
                    });
                }
            } catch (err) { console.warn('[UGC Error]', err); }

            const mod = document.getElementById('ugcModal');
            if (mod) mod.innerHTML = `
                <div style="background:var(--surface); padding:30px; border-radius:12px; border:1px solid var(--border); width:90%; max-width:400px; text-align:center;">
                    <div style="font-size:3rem; margin-bottom:10px;">✨</div>
                    <h3 style="color:var(--gold); margin-bottom:10px;">${t('map_modal_thanks_title')}</h3>
                    <p style="color:var(--muted); font-size:0.9rem; margin-bottom:20px;">${t('map_modal_thanks_desc_name')}</p>
                    <button type="button" onclick="closeUgcModal()" style="width:100%; padding:12px; background:var(--gold); color:var(--surface); border:none; border-radius:8px; font-weight:700; cursor:pointer;">${t('map_modal_close')}</button>
                </div>`;
        }

        function openAddProfileModal(cemeteryId, cemeteryName, lat, lng) {
            if (typeof ZiratAuth === 'undefined' || !ZiratAuth.isLoggedIn()) {
                if (typeof ZiratAuth !== 'undefined') { ZiratAuth.openAuthModal(); return; }
            }
            window.currentAddCemetery = { id: cemeteryId, name: cemeteryName, lat, lng };
            const info = document.getElementById('addCemeteryInfo');
            if (info) info.innerHTML = `📍 <strong style="color:var(--text);">${cemeteryName || ''}</strong><br>${t('map_coords_label')}: ${lat || ''}, ${lng || ''}`;
            ['addFullName', 'addBirth', 'addDeath', 'addDescription'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            const mod = document.getElementById('addProfileModal');
            if (mod) mod.style.display = 'flex';
        }

        function closeAddProfileModal() {
            const mod = document.getElementById('addProfileModal');
            if (mod) mod.style.display = 'none';
        }

        async function submitAddProfile(event) {
            event.preventDefault();
            const fullName = document.getElementById('addFullName').value.trim();
            if (!fullName) return;
            const submitBtn = event.target.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = t('map_submit_loading');
            submitBtn.disabled = true;

            const data = {
                cemeteryId: window.currentAddCemetery?.id || null,
                cemeteryName: window.currentAddCemetery?.name || null,
                lat: window.currentAddCemetery?.lat || null,
                lng: window.currentAddCemetery?.lng || null,
                fullName: fullName,
                birth: document.getElementById('addBirth').value.trim(),
                death: document.getElementById('addDeath').value.trim(),
                description: document.getElementById('addDescription').value.trim()
            };

            try {
                if (typeof submitUgcProfile === 'function') {
                    await submitUgcProfile(data);
                } else {
                    const localSubmissions = JSON.parse(localStorage.getItem('ziratstan_profiles_ugc') || '[]');
                    localSubmissions.push({ ...data, date: new Date().toISOString() });
                    localStorage.setItem('ziratstan_profiles_ugc', JSON.stringify(localSubmissions));
                }

                const lat = Number(data.lat);
                const lng = Number(data.lng);
                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                    PENDING_CEMETERY_PROFILES.push({
                        id: `local_pending_${Date.now()}`,
                        name: data.fullName,
                        birth: data.birth ? String(data.birth).substring(0, 4) : '?',
                        death: data.death ? String(data.death).substring(0, 4) : '?',
                        cemetery_id: data.cemeteryId || null,
                        lat: lat,
                        lng: lng
                    });
                    if (typeof updateMapLayers === 'function') {
                        updateMapLayers();
                    }
                }

                const mod = document.getElementById('addProfileModal');
                if (mod) mod.innerHTML = `
                    <div style="background:var(--surface); padding:30px; border-radius:14px; border:1px solid var(--border); width:90%; max-width:440px; text-align:center;">
                        <div style="font-size:3rem; margin-bottom:12px;">✨</div>
                        <h3 style="color:var(--gold); margin-bottom:10px; font-family:'Outfit', sans-serif;">${t('map_modal_thanks_title')}</h3>
                        <p style="color:var(--muted); font-size:0.9rem; margin-bottom:8px;"><strong style="color:var(--text);">${data.fullName}</strong></p>
                        <p style="color:var(--muted); font-size:0.85rem; margin-bottom:20px;">${t('map_modal_thanks_desc_profile')}</p>
                        <button type="button" onclick="closeAddProfileModal()" style="padding:12px 24px; background:var(--gold); color:#09090b; border:none; border-radius:9px; font-weight:700; cursor:pointer; font-family:inherit;">${t('map_modal_close')}</button>
                    </div>`;
            } catch (err) {
                console.error('[Add Profile Error]', err);
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
                const toast = document.getElementById('toast');
                if (toast) {
                    toast.textContent = t('map_toast_err');
                    toast.classList.add('show');
                    setTimeout(() => toast.classList.remove('show'), 3000);
                } else { alert(t('map_toast_err')); }
            }
        }

