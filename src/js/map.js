// ─────────────────────────────────────────────
//  MAP PAGE LOGIC — src/js/map.js
//  Extracted from inline <script> in map.html
// ─────────────────────────────────────────────

        // ── DATA ──
        let PROFILES = [];

        let currentFilter = 'all';
        let activeId = null;
        let pMarkers = {};
        let refreshRegionsUI = function () { };

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

        // ── MOBILE NAVIGATION ──
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

        // Центр Казахстана
        const map = L.map('map', {
            zoomControl: false,
            preferCanvas: true,
            minZoom: 5,  // Запрет отдаления (чтобы не улетать в космос)
            maxZoom: 16  // Вернул глубокий зум, так как проблема была в отдалении
        }).setView([48.0196, 66.9237], 5);

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
        markersCluster.addTo(map); // VIP markers are always visible
        // ── REGIONS & CLUSTERS ──
        const regionsLayer = L.layerGroup();
        const KZ_REGIONS = [
            // Қалалық маңызы қалалар
            { id: 'almaty', n_kk: "Алматы", n_ru: "Алматы", lt: 43.2380, ln: 76.9458, geo_lt: 43.2, geo_ln: 76.8, count: 0 },
            { id: 'astana', n_kk: "Астана", n_ru: "Астана", lt: 51.1282, ln: 71.4307, geo_lt: 51.16, geo_ln: 71.44, count: 0 },
            { id: 'shymkent', n_kk: "Шымкент", n_ru: "Шымкент", lt: 42.3154, ln: 69.5967, geo_lt: 42.34, geo_ln: 69.59, count: 0 },
            // Облыстар
            { id: 'abai', n_kk: "Абай облысы", n_ru: "Абайская область", lt: 50.4111, ln: 80.2275, geo_lt: 48.9, geo_ln: 80.2, count: 0 },
            { id: 'akmola', n_kk: "Ақмола облысы", n_ru: "Акмолинская область", lt: 52.9500, ln: 69.3833, geo_lt: 51.8, geo_ln: 69.4, count: 0 },
            { id: 'aktobe', n_kk: "Ақтөбе облысы", n_ru: "Актюбинская область", lt: 50.2839, ln: 57.2100, geo_lt: 48.8, geo_ln: 58.3, count: 0 },
            { id: 'almaty_obl', n_kk: "Алматы облысы", n_ru: "Алматинская область", lt: 44.8488, ln: 77.0900, geo_lt: 44.5, geo_ln: 77.8, count: 0 },
            { id: 'atyrau', n_kk: "Атырау облысы", n_ru: "Атырауская область", lt: 47.1076, ln: 51.9139, geo_lt: 47.1, geo_ln: 51.9, count: 0 },
            { id: 'vko', n_kk: "Шығыс Қазақстан", n_ru: "Восточный Казахстан", lt: 49.9481, ln: 82.6282, geo_lt: 49.9, geo_ln: 82.6, count: 0 },
            { id: 'zhambyl', n_kk: "Жамбыл облысы", n_ru: "Жамбылская область", lt: 42.9000, ln: 71.3667, geo_lt: 43.8, geo_ln: 72.8, count: 0 },
            { id: 'zhetysu', n_kk: "Жетісу облысы", n_ru: "Область Жетысу", lt: 45.0178, ln: 78.3738, geo_lt: 45.0, geo_ln: 79.0, count: 0 },
            { id: 'zko', n_kk: "Батыс Қазақстан", n_ru: "Западный Казахстан", lt: 50.0000, ln: 51.5000, geo_lt: 50.0, geo_ln: 50.5, count: 0 },
            { id: 'karaganda', n_kk: "Қарағанды облысы", n_ru: "Карагандинская область", lt: 49.8019, ln: 73.1021, geo_lt: 48.5, geo_ln: 72.0, count: 0 },
            { id: 'kostanay', n_kk: "Қостанай облысы", n_ru: "Костанайская область", lt: 52.9000, ln: 63.6246, geo_lt: 52.5, geo_ln: 63.6, count: 0 },
            { id: 'kyzylorda', n_kk: "Қызылорда облысы", n_ru: "Кызылординская область", lt: 44.8531, ln: 65.5092, geo_lt: 44.8, geo_ln: 63.5, count: 0 },
            { id: 'mangystau', n_kk: "Маңғыстау облысы", n_ru: "Мангистауская область", lt: 43.6353, ln: 51.1479, geo_lt: 44.0, geo_ln: 53.0, count: 0 },
            { id: 'pavlodar', n_kk: "Павлодар облысы", n_ru: "Павлодарская область", lt: 52.2873, ln: 76.9674, geo_lt: 52.3, geo_ln: 76.0, count: 0 },
            { id: 'sko', n_kk: "Солтүстік Қазақстан", n_ru: "Северо-Казахстанская область", lt: 53.0000, ln: 69.5000, geo_lt: 53.5, geo_ln: 68.5, count: 0 },
            { id: 'turkestan', n_kk: "Түркістан облысы", n_ru: "Туркестанская область", lt: 43.3017, ln: 68.2522, geo_lt: 42.8, geo_ln: 68.3, count: 0 },
            { id: 'ulytau', n_kk: "Ұлытау облысы", n_ru: "Область Улытау", lt: 47.7845, ln: 67.7144, geo_lt: 47.8, geo_ln: 66.0, count: 0 },
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

        // Добавляем обычные кладбища пакетом через Supercluster
        const cemeteriesLayer = L.layerGroup();
        let superclusterIndex = null;
        let allFeatures = []; // Храним все точки для перезагрузки
        let activeRegionId = null; // Текущий выбранный регион

        if (typeof CEMETERIES_DATA !== 'undefined' && typeof Supercluster !== 'undefined') {

            // Считаем кол-во для каждого региона + вшиваем region_id
            CEMETERIES_DATA.forEach(c => {
                let bestR = null;
                if (c.lt > 56 || c.lt < 39 || c.ln < 45 || c.ln > 88) {
                    bestR = KZ_REGIONS.find(x => x.id === 'zarubezh');
                } else {
                    let minD = Infinity;
                    KZ_REGIONS.forEach(r => {
                        if (r.id === 'zarubezh') return;
                        const dx = (r.geo_ln - c.ln) * Math.cos((r.geo_lt + c.lt) * Math.PI / 360);
                        const dy = (r.geo_lt - c.lt);
                        const d = dx * dx + dy * dy;
                        if (d < minD) { minD = d; bestR = r; }
                    });
                }
                if (bestR) bestR.count++;

                allFeatures.push({
                    type: "Feature",
                    properties: { id: c.id, n: c.n, region_id: bestR ? bestR.id : 'unknown' },
                    geometry: { type: "Point", coordinates: [c.ln, c.lt] }
                });
            });

            // Инициализация Supercluster
            superclusterIndex = new Supercluster({ radius: 50, maxZoom: 15 });
            superclusterIndex.load(allFeatures);

            // Функция загрузки только точек выбранного региона
            function drillIntoRegion(regionId) {
                activeRegionId = regionId;
                const filtered = allFeatures.filter(f => f.properties.region_id === regionId);
                superclusterIndex = new Supercluster({ radius: 50, maxZoom: 15 });
                superclusterIndex.load(filtered);
                const r = KZ_REGIONS.find(x => x.id === regionId);
                console.log(`[Ziratstan] Drill-down: ${r ? regionName(r) : regionId} → ${filtered.length} точек`);
                // Показать кнопку "назад"
                document.getElementById('regionBackBtn').style.display = 'flex';
                document.getElementById('regionBackLabel').textContent = r ? regionName(r) : regionId;
            }

            // Функция сброса на все регионы
            function resetToAllRegions() {
                activeRegionId = null;
                superclusterIndex = new Supercluster({ radius: 50, maxZoom: 15 });
                superclusterIndex.load(allFeatures);
                document.getElementById('regionBackBtn').style.display = 'none';
                // Сброс dropdown
                const sel = document.getElementById('regionSelect');
                if (sel) sel.value = '';

                // Refresh the sidebar list to show all regions
                if (typeof renderList === 'function') renderList();
                console.log('[Ziratstan] Reset to all regions');
            }
            // Делаем доступной глобально для кнопки
            window.resetToAllRegions = resetToAllRegions;
            document.getElementById('regionBackBtn').addEventListener('click', () => {
                resetToAllRegions();
                map.flyTo([48.0196, 66.9237], 5, { duration: 1 });
            });

            refreshRegionsUI = function () {
                // Sidebar dropdown (keep the first "all regions" option intact)
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

                // Region markers layer
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

                // Back button label (when drilled down)
                if (activeRegionId) {
                    const r = KZ_REGIONS.find(x => x.id === activeRegionId);
                    if (r) document.getElementById('regionBackLabel').textContent = regionName(r);
                }
            };

            refreshRegionsUI();

            // Глобальный обработчик выбора из dropdown
            window.handleRegionSelect = function (regionId) {
                if (regionId) {
                    drillIntoRegion(regionId);
                    const r = KZ_REGIONS.find(x => x.id === regionId);
                    if (r) map.flyTo([r.lt, r.ln], 8, { duration: 1.2 });
                } else {
                    resetToAllRegions();
                    map.flyTo([48.0196, 66.9237], 5, { duration: 1 });
                }

                // Filter the sidebar list by region
                if (typeof renderList === 'function') renderList();
            };

            // Синхронизуем dropdown при клике на карте
            const origDrill = drillIntoRegion;
            drillIntoRegion = function (regionId) {
                origDrill(regionId);
                const sel = document.getElementById('regionSelect');
                if (sel) sel.value = regionId;

                // Update sidebar list when clicking region cluster on map
                if (typeof renderList === 'function') renderList();
            };

            // Рендер видимых кластеров/точек из Supercluster
            // Граница Казахстана (bounding box)
            const KZ_BOUNDS = { latMin: 40.5, latMax: 55.5, lngMin: 46.5, lngMax: 87.5 };

            function renderClusters() {
                cemeteriesLayer.clearLayers();
                const bounds = map.getBounds();
                const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
                const zoom = map.getZoom();
                const clusters = superclusterIndex.getClusters(bbox, zoom);

                clusters.forEach(f => {
                    const [lng, lat] = f.geometry.coordinates;
                    // Фильтр: пропускаем точки за пределами КЗ
                    if (lat < KZ_BOUNDS.latMin || lat > KZ_BOUNDS.latMax || lng < KZ_BOUNDS.lngMin || lng > KZ_BOUNDS.lngMax) return;

                    // Блокируем показ точек/кластеров за пределами выбранного региона
                    if (activeRegionId && activeRegionId !== 'zarubezh') {
                        // Используем заранее посчитанный region_id из allFeatures
                        // Для кластеров (у которых f.properties.cluster == true) getLeaves вернет точки
                        // Но так как supercluster уже фильтруется через drillIntoRegion(), 
                        // все приходящие сюда точки и кластеры УЖЕ принадлежат выбранному региону!
                    }

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
                        const m = L.circleMarker([lat, lng], cemIconOpts);
                        m.bindPopup(() => `<div style="padding:10px;font-family:Inter;background:var(--surface);">
                            <div style="font-weight:700; color:var(--text); margin-bottom:5px;">${c.n}</div>
                            <div style="font-size:0.8rem; color:var(--muted); margin-bottom:10px;">${t('map_coords_label')}: ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
                            <div style="display:flex; flex-direction:column; gap:5px; margin-top:8px;">
                              <a href="#" onclick="openUgcModal('${c.id}', '${c.n}', ${lat}, ${lng}); return false;" style="display:block; text-align:center; background:var(--surface-light); border:1px solid var(--border); border-radius:6px; padding:6px; color:var(--text); text-decoration:none; font-size:0.8rem; font-weight:600;">${t('map_popup_refine_name')}</a>
                              <a href="#" onclick="openAddProfileModal('${c.id}', '${c.n}', ${lat}, ${lng}); return false;" style="display:block; text-align:center; background:rgba(212,175,55,0.1); border:1px solid var(--gold); border-radius:6px; padding:6px; color:var(--gold); text-decoration:none; font-size:0.8rem; font-weight:600;">➕ ${t('map_add_profile')}</a>
                            </div>
                        </div>`);
                        cemeteriesLayer.addLayer(m);
                    }
                });
            }

            // Динамическое переключение слоев
            function updateMapLayers() {
                const z = map.getZoom();
                if (z < 7) {
                    // Режим обзора всей страны: показываем ТОЛЬКО маркеры областей
                    if (activeRegionId) resetToAllRegions();

                    // Жесткая очистка кластеров
                    cemeteriesLayer.clearLayers();
                    if (map.hasLayer(cemeteriesLayer)) {
                        map.removeLayer(cemeteriesLayer);
                    }
                    if (!map.hasLayer(regionsLayer)) {
                        map.addLayer(regionsLayer);
                    }
                } else {
                    // Режим зума: прячем текстовые маркеры, рисуем Supercluster точки
                    if (map.hasLayer(regionsLayer)) map.removeLayer(regionsLayer);
                    if (!map.hasLayer(cemeteriesLayer)) map.addLayer(cemeteriesLayer);
                    renderClusters();

                    // Update VIP markers overlay visibility to match the current filtered list
                    if (typeof renderList === 'function') renderList();
                }
            }

            map.on('moveend', updateMapLayers);
            updateMapLayers(); // Инициализация
        }

        // ── RENDER SIDEBAR ──
        function renderList() {
            const q = document.getElementById('searchInput').value.toLowerCase().trim();
            const filteredVip = PROFILES.filter(p => {
                // Base filter matching
                const matchFilter = currentFilter === 'all' || (currentFilter === 'historical' && p.filter === 'historical');

                // Era matching (only applies if we are in historical tab and an era is selected)
                const matchEra = (currentFilter === 'all') || (currentEra === 'all') || (p.era === currentEra);

                // Region filtering based on activeRegionId
                let matchRegion = true;
                if (activeRegionId && activeRegionId !== 'zarubezh') {
                    const r = KZ_REGIONS.find(x => x.id === activeRegionId);
                    if (r) {
                        // Simple bounding box proxy for regions (or relying on city name)
                        // This uses a proximity check to the region center, similar to how cluster assignments work
                        const dx = (r.geo_ln - p.lng) * Math.cos((r.geo_lt + p.lat) * Math.PI / 360);
                        const dy = (r.geo_lt - p.lat);
                        const distanceSq = dx * dx + dy * dy;
                        // Rough radius squared (~5.0 degrees approx 550km)
                        matchRegion = distanceSq < 25.0;
                    }
                } else if (activeRegionId === 'zarubezh') {
                    matchRegion = (p.lat > 56 || p.lat < 39 || p.lng < 45 || p.lng > 88);
                }

                const pName = (p.name || p.fullName || '').toLowerCase();
                const pCem = (p.cemetery || '').toLowerCase();
                const pCity = (p.city || '').toLowerCase();
                const pId = (p.id || '').toLowerCase();
                const searchQ = !q || pName.includes(q) || pCem.includes(q) || pCity.includes(q) || pId.includes(q);

                return matchFilter && matchEra && matchRegion && searchQ;
            }).filter(p => currentFilter !== 'cemeteries');

            const filteredGen = [];
            if (typeof CEMETERIES_DATA !== 'undefined' && (currentFilter === 'all' || currentFilter === 'cemeteries')) {
                for (let i = 0; i < CEMETERIES_DATA.length; i++) {
                    const c = CEMETERIES_DATA[i];
                    // Verify correct region for simple cemeteries
                    let matchRegion = true;
                    if (activeRegionId) {
                        const r = KZ_REGIONS.find(x => x.id === activeRegionId);
                        if (r && activeRegionId !== 'zarubezh') {
                            const dx = (r.geo_ln - c.ln) * Math.cos((r.geo_lt + c.lt) * Math.PI / 360);
                            const dy = (r.geo_lt - c.lt);
                            const distanceSq = dx * dx + dy * dy;
                            matchRegion = distanceSq < 25.0; // Same bounding proxy
                        } else if (activeRegionId === 'zarubezh') {
                            matchRegion = (c.lt > 56 || c.lt < 39 || c.ln < 45 || c.ln > 88);
                        }
                    }

                    if (matchRegion && (!q || c.n.toLowerCase().includes(q))) {
                        filteredGen.push(c);
                    }
                }
            }

            const total = filteredVip.length + filteredGen.length;
            document.getElementById('resultsCount').textContent = `${t('map_results_found')}: ${total}`;

            let displayList = '';

            if (total === 0 && q) {
                displayList += `
                <div style="padding: 2rem 1rem; text-align: center;">
                    <div style="font-size: 2rem; margin-bottom: 1rem; color: var(--muted);">🔍</div>
                    <div style="color: var(--text); margin-bottom: 0.5rem; font-weight: 600;">${t('map_not_found')}</div>
                    <div style="color: var(--muted); font-size: 0.85rem; margin-bottom: 1.5rem;">${t('map_empty_desc')}</div>
                    <button class="geo-btn" style="background: var(--gold); color: #09090b; border: none; font-weight: 700;" onclick="openAddProfileModal(null, null, null, null)">➕ ${t('map_add_profile')}</button>
                </div>
                `;
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

            // Лимит на 50 общих кладбищ в панели, иначе зависнет DOM
            const genLimit = Math.min(filteredGen.length, 50);
            for (let i = 0; i < genLimit; i++) {
                const c = filteredGen[i];
                displayList += `
      <a class="profile-card" onclick="map.flyTo([${c.lt}, ${c.ln}], 16); return false;" href="#">
        <div class="card-avatar" style="color:var(--muted); border-color:var(--border);">🪦</div>
        <div class="card-info">
          <div class="card-name" style="color:var(--text);">${c.n}</div>
          <div class="card-meta">${t('map_general_cemetery')} (${t('map_coords_label')}: ${c.lt}, ${c.ln})</div>
        </div>
        <span class="card-arrow">›</span>
      </a>`;
            }

            if (filteredGen.length > 50) {
                displayList += `<div style="text-align:center; padding:15px; color:var(--muted); font-size:0.8rem; border-bottom:1px solid var(--border);">${t('map_showing_top')}: 50 / ${filteredGen.length}. ${t('map_refine_search')}</div>`;
            }

            document.getElementById('resultsList').innerHTML = displayList;

            PROFILES.forEach(p => {
                if (pMarkers[p.id]) {
                    const visible = filteredVip.find(f => f.id === p.id);
                    if (visible) {
                        if (!markersCluster.hasLayer(pMarkers[p.id])) {
                            markersCluster.addLayer(pMarkers[p.id]);
                        }
                    } else {
                        if (markersCluster.hasLayer(pMarkers[p.id])) {
                            markersCluster.removeLayer(pMarkers[p.id]);
                        }
                    }
                }
            });
        }

        // ── INIT SUPABASE DATA ──
        async function initData() {
            try {
                if (typeof fetchVipProfiles === 'function') {
                    const dbProfiles = await fetchVipProfiles();
                    console.log('[Ziratstan] Loaded', dbProfiles.length, 'profiles from Supabase');

                    // Merge local PROFILES_STATIC with Supabase data to ensure local 'era' data is present
                    const localProfiles = typeof PROFILES_STATIC !== 'undefined' ? PROFILES_STATIC : [];

                    // Deduplicate: drop DB profiles that overlap with local ones.
                    // Supabase uses UUIDs, local uses string IDs — so we match by COORDINATES (within ~1km)
                    // AND by name similarity to avoid false positives.
                    const COORD_THRESHOLD = 0.02; // ~2km in degrees
                    const dbOnlyProfiles = dbProfiles.filter(dbP => {
                        // Skip if no coords
                        if (!dbP.lat || !dbP.lng) return false;
                        // Check if any local profile is nearby
                        const hasDuplicate = localProfiles.some(localP => {
                            if (!localP.lat || !localP.lng) return false;
                            const dLat = Math.abs(dbP.lat - localP.lat);
                            const dLng = Math.abs(dbP.lng - localP.lng);
                            return dLat < COORD_THRESHOLD && dLng < COORD_THRESHOLD;
                        });
                        return !hasDuplicate;
                    });

                    PROFILES = [...localProfiles, ...dbOnlyProfiles];
                    console.log('[Ziratstan] Merged with local static profiles. Total records:', PROFILES.length);

                } else {
                    console.warn('[Ziratstan] fetchVipProfiles missing — using local fallback');
                    PROFILES = typeof PROFILES_STATIC !== 'undefined' ? PROFILES_STATIC : [];
                }
            } catch (err) {
                console.error('[Ziratstan] Failed to load from Supabase, using local fallback:', err);
                PROFILES = typeof PROFILES_STATIC !== 'undefined' ? PROFILES_STATIC : [];
            }

            // Рендерим загруженные маркеры пакетом
            const vipMarkersBatch = [];
            let foreignVipCount = 0;
            PROFILES.forEach(p => {
                const m = addVipMarker(p, false); // false for delay add
                vipMarkersBatch.push(m);
                // Проверяем, находится ли VIP-профиль за пределами КЗ
                if (p.lat > 56 || p.lat < 39 || p.lng < 45 || p.lng > 88) {
                    foreignVipCount++;
                }
            });
            markersCluster.addLayers(vipMarkersBatch);

            // Обновляем маркер Зарубежья с VIP-профилями
            if (foreignVipCount > 0) {
                const zr = KZ_REGIONS.find(x => x.id === 'zarubezh');
                if (zr) {
                    zr.count += foreignVipCount;
                    if (typeof refreshRegionsUI === 'function') refreshRegionsUI();
                }
            }

            // Рендер общих кладбищ (остаются из статического cemeteries_data.js)
            renderList();
        }

        // Обёртка для создания маркеров VIP
        function addVipMarker(p, addToCluster = true) {
            const m = L.marker([p.lat, p.lng], { icon: makeGraveIcon(false) });
            m.bindPopup(`
      <div style="padding:12px; min-width:200px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <div style="width:40px;height:40px;border-radius:50%;background:#18181b;border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-weight:700;color:#d4af37;font-size:14px;overflow:hidden;flex-shrink:0;">
            ${p.photo ? `<img src="${p.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />` : (p.name ? p.name[0] : '?')}
          </div>
          <div>
            <div style="font-weight:700;font-size:0.9rem;">${p.name || p.fullName}</div>
            <div style="color:#71717a;font-size:0.75rem;">📅 ${p.birth} — ${p.death}</div>
          </div>
        </div>
        <div style="color:#71717a;font-size:0.75rem;margin-bottom:10px;">📍 ${p.cemetery}, ${p.city}</div>
        <a href="profile.html?id=${p.id}" style="display:block;background:#d4af37;color:#09090b;text-align:center;padding:8px;border-radius:8px;text-decoration:none;font-weight:700;font-size:0.8rem;">
          ${t('map_btn_profile')}
        </a>
      </div>
    `);

            m.on('popupopen', () => {
                if (activeId && activeId !== p.id && pMarkers[activeId]) {
                    pMarkers[activeId].setIcon(makeGraveIcon(false));
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


        // ── SELECT PROFILE (From Sidebar) ──
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

        // ── FILTER ──
        let currentEra = 'all';

        function setFilter(f, el) {
            currentFilter = f;
            document.querySelectorAll('.filter-btn').forEach(t => t.classList.remove('active'));
            if (el) el.classList.add('active');

            // Show/hide era select
            const eraSelectWrap = document.getElementById('eraSelectWrap');
            if (f === 'historical') {
                eraSelectWrap.style.display = 'block';
            } else {
                eraSelectWrap.style.display = 'none';
                currentEra = 'all'; // reset era when switching main tabs
                document.querySelectorAll('.era-btn').forEach(b => b.classList.remove('active'));
                const allBtn = document.querySelector('.era-btn[data-era="all"]');
                if (allBtn) allBtn.classList.add('active');
            }

            renderList();
        }

        // Add click listeners to filter buttons since we removed onclick from HTML
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                setFilter(e.target.dataset.filter, e.target);
            });
        });

        // Era buttons click listener
        document.querySelectorAll('.era-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.era-btn').forEach(b => b.classList.remove('active'));
                const el = e.target;
                el.classList.add('active');
                currentEra = el.dataset.era;
                renderList();
            });
        });

        // ── SEARCH ──
        let debounceTimer;
        document.getElementById('searchInput').addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                renderList();
            }, 300);
        });

        // ── GEOLOCATION ──
        let userMarker = null;
        function geolocate() {
            const btn = document.getElementById('geoBtnText');
            const status = document.getElementById('geoStatus');
            btn.textContent = t('map_geo_locating');

            if (!navigator.geolocation) {
                status.className = 'geo-status error';
                status.textContent = t('map_geo_not_supported');
                btn.textContent = t('map_geo_btn');
                return;
            }

            navigator.geolocation.getCurrentPosition(
                ({ coords: { latitude: lat, longitude: lng } }) => {
                    if (userMarker) userMarker.remove();
                    userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map)
                        .bindPopup(`<div style="padding:8px;font-family:Inter,sans-serif;font-weight:600;">${t('map_you_are_here')}</div>`)
                        .openPopup();
                    map.flyTo([lat, lng], 16, { duration: 1.5 });
                    status.className = 'geo-status success';
                    status.textContent = t('map_geo_found');
                    btn.textContent = t('map_geo_refresh');
                },
                err => {
                    status.className = 'geo-status error';
                    status.textContent = `❌ ${err.message}`;
                    btn.textContent = t('map_geo_btn');
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        }

        // ── MOBILE ──
        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('open');
            document.getElementById('toggleBtn').textContent =
                document.getElementById('sidebar').classList.contains('open') ? '🗺️' : '🗂️';
        }

        // Init data from Supabase
        initData();

        document.addEventListener('langchange', () => {
            if (typeof refreshRegionsUI === 'function') refreshRegionsUI();
            if (typeof renderList === 'function') renderList();
        });

        // ── UGC MODAL LOGIC ──
        function openUgcModal(cemeteryId, defaultName, lat, lng) {
            document.getElementById('ugcNameInput').value = defaultName;
            document.getElementById('ugcModal').style.display = 'flex';
            // Save state for submission
            window.currentUgcCemetery = { id: cemeteryId, lat: lat, lng: lng };
        }

        function closeUgcModal() {
            document.getElementById('ugcModal').style.display = 'none';
        }

        async function submitUgcName(event) {
            event.preventDefault();
            const newName = document.getElementById('ugcNameInput').value.trim();
            if (!newName) return;

            const submitBtn = event.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = t('map_submit_loading');
            submitBtn.disabled = true;

            try {
                await submitUgcSuggestion({
                    current_name: window.currentUgcCemetery?.id || 'Белгісіз',
                    suggested_name: newName,
                    lat: window.currentUgcCemetery?.lat,
                    lng: window.currentUgcCemetery?.lng,
                });
            } catch (err) {
                console.warn('[UGC] Supabase error (working offline?):', err);
                // Fail gracefully — still show success to user
            }

            // Show success
            document.getElementById('ugcModal').innerHTML = `
                <div style="background:var(--surface); padding:30px; border-radius:12px; border:1px solid var(--border); width:90%; max-width:400px; text-align:center;">
                    <div style="font-size:3rem; margin-bottom:10px;">✨</div>
                    <h3 style="color:var(--gold); margin-bottom:10px;">${t('map_modal_thanks_title')}</h3>
                    <p style="color:var(--muted); font-size:0.9rem; margin-bottom:20px;">${t('map_modal_thanks_desc_name')}</p>
                    <button type="button" onclick="closeUgcModal()" style="width:100%; padding:12px; background:var(--gold); color:var(--surface); border:none; border-radius:8px; font-weight:700; cursor:pointer;">${t('map_modal_close')}</button>
                </div>
            `;
        }

        // ── ADD PROFILE MODAL ──
        function openAddProfileModal(cemeteryId, cemeteryName, lat, lng) {
            window.currentAddCemetery = { id: cemeteryId, name: cemeteryName, lat, lng };
            document.getElementById('addCemeteryInfo').innerHTML = `📍 <strong style="color:var(--text);">${cemeteryName}</strong><br>${t('map_coords_label')}: ${lat}, ${lng}`;
            document.getElementById('addFullName').value = '';
            document.getElementById('addBirth').value = '';
            document.getElementById('addDeath').value = '';
            document.getElementById('addDescription').value = '';
            document.getElementById('addProfileModal').style.display = 'flex';
        }

        function closeAddProfileModal() {
            document.getElementById('addProfileModal').style.display = 'none';
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
                    console.warn('[Ziratstan] submitUgcProfile function not found. Fallback to localStorage.');
                    const localSubmissions = JSON.parse(localStorage.getItem('ziratstan_profiles_ugc') || '[]');
                    localSubmissions.push({ ...data, date: new Date().toISOString() });
                    localStorage.setItem('ziratstan_profiles_ugc', JSON.stringify(localSubmissions));
                }

                document.getElementById('addProfileModal').innerHTML = `
                    <div style="background:var(--surface); padding:30px; border-radius:14px; border:1px solid var(--border); width:90%; max-width:440px; text-align:center;">
                        <div style="font-size:3rem; margin-bottom:12px;">✨</div>
                        <h3 style="color:var(--gold); margin-bottom:10px; font-family:'Outfit', sans-serif;">${t('map_modal_thanks_title')}</h3>
                        <p style="color:var(--muted); font-size:0.9rem; margin-bottom:8px;"><strong style="color:var(--text);">${data.fullName}</strong></p>
                        <p style="color:var(--muted); font-size:0.85rem; margin-bottom:20px;">${t('map_modal_thanks_desc_profile')}</p>
                        <button type="button" onclick="closeAddProfileModal()" style="padding:12px 24px; background:var(--gold); color:#09090b; border:none; border-radius:9px; font-weight:700; cursor:pointer; font-family:inherit;">${t('map_modal_close')}</button>
                    </div>
                `;
            } catch (err) {
                console.error('[Ziratstan] Error submitting profile:', err);
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
                const toast = document.getElementById('toast');
                if (toast) {
                    toast.textContent = t('map_toast_err');
                    toast.classList.add('show');
                    setTimeout(() => toast.classList.remove('show'), 3000);
                } else {
                    alert(t('map_toast_err'));
                }
            }
        }
