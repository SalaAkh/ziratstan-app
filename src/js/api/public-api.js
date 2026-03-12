// Public API wrapper for legacy static pages.
// Strategy:
// 1) Try direct read access via Supabase anon key (avoids dependency on /api rewrites).
// 2) Fallback to /api/* Firebase Functions endpoints when direct read fails.

(function initZiratPublicApi(global) {
  var directClient = null;

  function jsonFetch(url, options) {
    var opts = options || {};
    opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
    return fetch(url, opts).then(function (res) {
      return res.text().then(function (text) {
        var payload = null;
        try { payload = text ? JSON.parse(text) : null; } catch (_e) {}
        if (!res.ok) {
          var message = (payload && payload.error) ? payload.error : (text || ('HTTP ' + res.status));
          var err = new Error(message);
          err.status = res.status;
          err.payload = payload;
          throw err;
        }
        return payload;
      });
    });
  }

  function apiBase() {
    return '/api';
  }

  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || ''));
  }

  function toGeoCoords(location) {
    if (!location || !Array.isArray(location.coordinates) || location.coordinates.length < 2) {
      return { lat: null, lng: null };
    }
    var lng = Number(location.coordinates[0]);
    var lat = Number(location.coordinates[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { lat: null, lng: null };
    }
    return { lat: lat, lng: lng };
  }

  function mapPublicProfileRow(p) {
    var coords = toGeoCoords(p.location);
    return {
      id: p.id,
      name: [p.last_name, p.first_name, p.patronymic].filter(Boolean).join(' '),
      birth: p.birth_date ? String(p.birth_date).substring(0, 4) : '?',
      death: p.death_date ? String(p.death_date).substring(0, 4) : '?',
      cemetery: p.cemetery_id || 'Unknown',
      city: '',
      filter: 'historical',
      lat: coords.lat,
      lng: coords.lng,
      photo: p.main_photo_url || '',
      bio: p.biography || '',
      epitaph: p.epitaph || '',
    };
  }

  function getDirectClient() {
    if (directClient) return directClient;
    if (!global.ZiratConfig || typeof global.ZiratConfig.getSupabaseConfig !== 'function') {
      throw new Error('Missing ZiratConfig');
    }
    if (!global.supabase || typeof global.supabase.createClient !== 'function') {
      throw new Error('Supabase SDK is not loaded');
    }
    var cfg = global.ZiratConfig.getSupabaseConfig();
    var url = cfg.SUPABASE_URL || '';
    var key = cfg.SUPABASE_ANON_KEY || '';
    if (!url || !key) {
      throw new Error('Supabase config is missing');
    }
    directClient = global.supabase.createClient(url, key);
    return directClient;
  }

  async function readWithFallback(directFn, apiFn) {
    try {
      return await directFn();
    } catch (_directError) {
      return await apiFn();
    }
  }

  async function fetchVipProfilesDirect() {
    var db = getDirectClient();
    var result = await db
      .from('profiles')
      .select('id, first_name, last_name, patronymic, birth_date, death_date, epitaph, biography, main_photo_url, cemetery_id, location')
      .eq('visibility_status', 'public')
      .limit(2000);

    if (result.error) throw result.error;
    return (result.data || [])
      .map(mapPublicProfileRow)
      .filter(function (p) { return Number.isFinite(p.lat) && Number.isFinite(p.lng); });
  }

  async function fetchProfileByIdDirect(id) {
    var profileId = String(id || '').trim();
    if (!isUuid(profileId)) return null;

    var db = getDirectClient();
    var result = await db
      .from('profiles')
      .select('*, cemetery:cemeteries(name, city)')
      .eq('id', profileId)
      .eq('visibility_status', 'public')
      .maybeSingle();

    if (result.error) throw result.error;
    if (!result.data) return null;

    var data = result.data;
    return {
      id: data.id,
      fullName: [data.last_name, data.first_name, data.patronymic].filter(Boolean).join(' '),
      name: data.first_name,
      lastName: data.last_name,
      birth: data.birth_date ? String(data.birth_date).substring(0, 4) : '?',
      death: data.death_date ? String(data.death_date).substring(0, 4) : '?',
      cemetery: (data.cemetery && data.cemetery.name) || 'Unknown',
      city: (data.cemetery && data.cemetery.city) || '',
      photo: data.main_photo_url || '',
      bio: data.biography || '',
      epitaph: data.epitaph || '',
      filter: 'historical',
    };
  }

  async function fetchFamilyRelationsDirect(profileId) {
    var id = String(profileId || '').trim();
    if (!isUuid(id)) return [];

    var db = getDirectClient();
    var profileRes = await db
      .from('profiles')
      .select('id')
      .eq('id', id)
      .eq('visibility_status', 'public')
      .maybeSingle();
    if (profileRes.error) throw profileRes.error;
    if (!profileRes.data) return [];

    var relationRes = await db
      .from('profile_relations')
      .select('relation_type, profile_id_2, profiles!profile_relations_profile_id_2_fkey(id, first_name, last_name, birth_date, death_date, main_photo_url)')
      .eq('profile_id_1', id);
    if (relationRes.error) throw relationRes.error;
    return relationRes.data || [];
  }

  async function resolveQrSlugDirect(slug) {
    var value = String(slug || '').trim().toUpperCase();
    if (!value || value.length > 32) return null;

    var db = getDirectClient();
    var result = await db
      .from('qr_codes')
      .select('id, slug, profile_id, status, scan_count')
      .eq('slug', value)
      .eq('status', 'active')
      .maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) return null;

    db.from('qr_codes')
      .update({ scan_count: (result.data.scan_count || 0) + 1 })
      .eq('id', result.data.id)
      .then(function () { })
      .catch(function () { });

    return result.data;
  }

  async function fetchQrByProfileDirect(profileId) {
    var id = String(profileId || '').trim();
    if (!isUuid(id)) return null;

    var db = getDirectClient();
    var result = await db
      .from('qr_codes')
      .select('id, slug, scan_count, status, activated_at')
      .eq('profile_id', id)
      .eq('status', 'active')
      .maybeSingle();
    if (result.error) throw result.error;
    return result.data || null;
  }

  async function fetchProfileIdBySlugDirect(slug) {
    var value = String(slug || '').trim();
    if (!value || value.length > 200) return null;
    if (isUuid(value)) return value;

    var db = getDirectClient();
    var result = await db
      .from('profiles')
      .select('id')
      .eq('epitaph', value)
      .eq('visibility_status', 'public')
      .limit(1)
      .maybeSingle();
    if (result.error) throw result.error;
    return result.data ? result.data.id : null;
  }

  async function submitUgcSuggestion(data) {
    await jsonFetch(apiBase() + '/public/ugc/name', { method: 'POST', body: JSON.stringify(data || {}) });
  }

  async function createServicesLead(data) {
    await jsonFetch(apiBase() + '/public/services/lead', { method: 'POST', body: JSON.stringify(data || {}) });
  }

  async function submitUgcProfile(data) {
    await jsonFetch(apiBase() + '/public/ugc/profile', { method: 'POST', body: JSON.stringify(data || {}) });
  }

  async function submitUgcBio(data) {
    await jsonFetch(apiBase() + '/public/ugc/bio', { method: 'POST', body: JSON.stringify(data || {}) });
  }

  async function fetchVipProfiles() {
    try {
      return await readWithFallback(
        fetchVipProfilesDirect,
        async function () {
          var res = await jsonFetch(apiBase() + '/public/vip-profiles', { method: 'GET' });
          return (res && res.items) ? res.items : [];
        }
      );
    } catch (error) {
      console.warn('[Ziratstan] vip-profiles unavailable from both direct and API sources:', error && error.message ? error.message : error);
      return [];
    }
  }

  async function fetchProfileById(id) {
    return readWithFallback(
      function () { return fetchProfileByIdDirect(id); },
      async function () {
        var res = await jsonFetch(apiBase() + '/public/profile?id=' + encodeURIComponent(id || ''), { method: 'GET' });
        return res ? res.item : null;
      }
    );
  }

  async function fetchFamilyRelations(profileId) {
    return readWithFallback(
      function () { return fetchFamilyRelationsDirect(profileId); },
      async function () {
        var res = await jsonFetch(apiBase() + '/public/family?profileId=' + encodeURIComponent(profileId || ''), { method: 'GET' });
        return (res && res.items) ? res.items : [];
      }
    );
  }

  async function resolveQrSlug(slug) {
    return readWithFallback(
      function () { return resolveQrSlugDirect(slug); },
      async function () {
        var res = await jsonFetch(apiBase() + '/public/qr/resolve?slug=' + encodeURIComponent(slug || ''), { method: 'GET' });
        return res ? res.item : null;
      }
    );
  }

  async function fetchQrByProfile(profileId) {
    return readWithFallback(
      function () { return fetchQrByProfileDirect(profileId); },
      async function () {
        var res = await jsonFetch(apiBase() + '/public/qr/by-profile?profileId=' + encodeURIComponent(profileId || ''), { method: 'GET' });
        return res ? res.item : null;
      }
    );
  }

  // QR generation requires auth; keep as explicit error for now.
  async function generateQrSlug(_profileId) {
    throw new Error('QR generation requires authentication. Not available on public API.');
  }

  async function fetchProfileIdBySlug(slug) {
    return readWithFallback(
      function () { return fetchProfileIdBySlugDirect(slug); },
      async function () {
        var res = await jsonFetch(apiBase() + '/public/profile-id-by-slug?slug=' + encodeURIComponent(slug || ''), { method: 'GET' });
        return res ? res.item : null;
      }
    );
  }

  global.submitUgcSuggestion = submitUgcSuggestion;
  global.createServicesLead = createServicesLead;
  global.submitUgcProfile = submitUgcProfile;
  global.submitUgcBio = submitUgcBio;
  global.fetchVipProfiles = fetchVipProfiles;
  global.fetchProfileById = fetchProfileById;
  global.fetchFamilyRelations = fetchFamilyRelations;
  global.resolveQrSlug = resolveQrSlug;
  global.fetchQrByProfile = fetchQrByProfile;
  global.generateQrSlug = generateQrSlug;
  global.fetchProfileIdBySlug = fetchProfileIdBySlug;
})(window);
