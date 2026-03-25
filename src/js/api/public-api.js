// Public API via direct Supabase Client (bypassing Firebase Functions for Cost/CORS optimization)

(function initZiratPublicApi(global) {
  
  // Initialize Supabase Client dynamically
  function getSb() {
    if (global._public_sb) return global._public_sb;
    if (global.window && global.window.supabaseClient) return global.window.supabaseClient;
    
    var cfg = global.ZiratConfig?.getSupabaseConfig?.() || {};
    var SB_URL = cfg.SUPABASE_URL || '';
    var SB_KEY = cfg.SUPABASE_ANON_KEY || '';

    if (global.supabase && SB_URL && SB_KEY) {
      global._public_sb = global.supabase.createClient(SB_URL, SB_KEY, {
        auth: {
          flowType: 'pkce',
          detectSessionInUrl: true,
          persistSession: true
        }
      });
      if (global.window) {
        global.window._sb = global._public_sb;
        global.window.supabaseClient = global._public_sb;
      }
      return global._public_sb;
    }
    
    // Fallback if supabase.js isn't loaded - gracefully fail API calls
    console.warn("Ziratstan: Supabase JS is not loaded or config is missing.");
    return null;
  }

  function normalizeShezhireEntries(entries) {
    var source = entries;
    if (typeof source === 'string') {
      try {
        source = JSON.parse(source);
      } catch (_error) {
        return [];
      }
    }
    if (!Array.isArray(source)) return [];

    return source.map(function (entry) {
      var label = String((entry && (entry.label || entry.field || entry.title)) || '').trim();
      var value = String((entry && (entry.value || entry.text || entry.content)) || '').trim();
      if (!value) return null;
      return {
        label: label || 'Поле',
        value: value || ''
      };
    }).filter(Boolean);
  }

  async function submitUgcSuggestion(data) {
    var sb = getSb();
    if (!sb) throw new Error('API Client not initialized');
    var { error } = await sb.from('ugc_submissions').insert([{
      cemetery_id: data.cemetery_id || data.cemeteryId || null,
      current_name: data.current_name || data.currentName || null,
      suggested_name: data.suggested_name || data.suggestedName || null,
      lat: data.lat || null,
      lng: data.lng || null,
      comment: data.comment || null,
      status: 'pending',
      submitted_at: new Date().toISOString()
    }]);
    if (error) throw error;
  }

  async function createServicesLead(data) {
    var sb = getSb();
    if (!sb) throw new Error('API Client not initialized');
    var { error } = await sb.from('services_leads').insert([{
      service_type: data.service_type || null,
      customer_name: data.customer_name || null,
      customer_phone: data.customer_phone || null,
      profile_ref: data.profile_ref || null,
      comment: data.comment || null,
      price: data.price || null,
      submitted_at: new Date().toISOString()
    }]);
    if (error) throw error;
  }

  async function submitUgcProfile(data) {
    var sb = getSb();
    if (!sb) throw new Error('API Client not initialized');
    var ownerId = null;
    try {
      var sessionRes = await sb.auth.getSession();
      ownerId = sessionRes && sessionRes.data && sessionRes.data.session && sessionRes.data.session.user
        ? sessionRes.data.session.user.id
        : null;
    } catch (_e) {}

    var payload = {
      cemetery_id: data.cemeteryId || null,
      cemetery_name: data.cemeteryName || null,
      lat: data.lat || null,
      lng: data.lng || null,
      full_name: data.fullName || null,
      birth_year: data.birth || null,
      death_year: data.death || null,
      description: data.description || null,
      shezhire_entries: normalizeShezhireEntries(data.shezhireEntries || data.shezhire_entries || []),
      owner_id: ownerId,
      status: 'pending',
      submitted_at: new Date().toISOString()
    };

    var removableColumns = ['owner_id', 'shezhire_entries'];
    var error = null;
    for (var attempt = 0; attempt <= removableColumns.length; attempt += 1) {
      var insertRes = await sb.from('ugc_profile_submissions').insert([payload]);
      error = insertRes.error || null;
      if (!error) break;

      var errorMessage = String(error.message || '');
      var missingColumn = removableColumns.find(function (columnName) {
        return errorMessage.includes(columnName) && Object.prototype.hasOwnProperty.call(payload, columnName);
      });

      if (!missingColumn) break;
      delete payload[missingColumn];
    }
    if (error) throw error;
  }

  async function submitUgcBio(data) {
    var sb = getSb();
    if (!sb) throw new Error('API Client not initialized');
    var { error } = await sb.from('ugc_bio_submissions').insert([{
      profile_id: data.profileId || null,
      author_name: data.authorName || null,
      bio_text: data.text || null,
      status: 'pending',
      submitted_at: new Date().toISOString()
    }]);
    if (error) throw error;
  }

  async function fetchVipProfiles() {
    var sb = getSb();
    if (!sb) return [];
    try {
      var { data, error } = await sb
        .from('profiles')
        .select('id, owner_id, first_name, last_name, patronymic, birth_date, death_date, epitaph, biography, main_photo_url, cemetery_id, location, cemeteries(name, city)')
        .eq('visibility_status', 'public')
        .limit(2000);
      
      if (error) throw error;
      
      return (data || []).map(function(p) {
        return {
          id: p.id,
          owner_id: p.owner_id || null,
          name: [p.last_name, p.first_name, p.patronymic].filter(Boolean).join(' '),
          birth: p.birth_date ? String(p.birth_date).substring(0, 4) : '?',
          death: p.death_date ? String(p.death_date).substring(0, 4) : '?',
          cemetery: (p.cemeteries && p.cemeteries.name) ? p.cemeteries.name : 'Неизвестно',
          city: (p.cemeteries && p.cemeteries.city) ? p.cemeteries.city : '',
          filter: 'historical',
          lat: p.location && p.location.coordinates ? p.location.coordinates[1] : null,
          lng: p.location && p.location.coordinates ? p.location.coordinates[0] : null,
          photo: p.main_photo_url || '',
          bio: p.biography || '',
          epitaph: p.epitaph || ''
        };
      }).filter(function (p) {
        // Do not place user-owned memorials as separate markers on the public map.
        // They are shown inside cemetery popup based on access rules.
        return p.lat && p.lng && !p.owner_id;
      });
    } catch (e) {
      console.error("[public-api] Error fetching VIP profiles:", e);
      return [];
    }
  }

  async function fetchProfileById(id) {
    var sb = getSb();
    if (!sb || !id) return null;
    // profiles.id is UUID type — skip Supabase for static slugs like "kerey_khan"
    var UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(id)) return null;
    try {
      var { data, error } = await sb
        .from('profiles')
        .select('*, cemetery:cemeteries(name, city)')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) return null;
      
      return {
        id: data.id,
        fullName: [data.last_name, data.first_name, data.patronymic].filter(Boolean).join(' '),
        name: data.first_name,
        lastName: data.last_name,
        birth: data.birth_date ? String(data.birth_date).substring(0, 4) : '?',
        death: data.death_date ? String(data.death_date).substring(0, 4) : '?',
        cemetery: data.cemetery?.name || 'Неизвестно',
        city: data.cemetery?.city || '',
        photo: data.main_photo_url || '',
        bio: data.biography || '',
        shezhireEntries: normalizeShezhireEntries(data.shezhire_entries),
        epitaph: data.epitaph || '',
        filter: 'historical'
      };
    } catch (e) {
      console.error("[public-api] Error fetching Profile ID:", e);
      return null;
    }
  }


  async function fetchFamilyRelations(profileId) {
    var sb = getSb();
    if (!sb || !profileId) return [];
    // profile_relations.profile_id_1 is UUID type — skip non-UUID slugs like "tole_bi_8"
    var UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_REGEX.test(profileId)) return [];
    try {
      var { data, error } = await sb
        .from('profile_relations')
        .select('relation_type, profile_id_2, profiles!profile_relations_profile_id_2_fkey(id, first_name, last_name, birth_date, death_date, main_photo_url)')
        .eq('profile_id_1', profileId);
        
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("[public-api] Error fetching Family Relations:", e);
      return [];
    }
  }


  async function resolveQrSlug(slug) {
    var sb = getSb();
    if (!sb || !slug) return null;
    try {
      var normalized = String(slug).trim().toUpperCase();
      var { data, error } = await sb
        .from('qr_codes')
        .select('id, slug, profile_id, status, scan_count')
        .eq('slug', normalized)
        .eq('status', 'active')
        .maybeSingle();
        
      if (error || !data) return null;
      
      // Fire-and-forget atomic scan counter increment via SQL function.
      sb.rpc('increment_qr_scan_count', { p_qr_id: data.id })
        .then(() => {})
        .catch((rpcError) => {
          console.warn('[public-api] QR scan increment failed:', rpcError && rpcError.message ? rpcError.message : rpcError);
        });
        
      return data;
    } catch(e) {
      console.error("[public-api] Error resolving QR Slug:", e);
      return null;
    }
  }

  async function fetchQrByProfile(profileId) {
    var sb = getSb();
    if (!sb || !profileId) return null;
    try {
      var { data, error } = await sb
        .from('qr_codes')
        .select('id, slug, scan_count, status, activated_at')
        .eq('profile_id', profileId)
        .eq('status', 'active')
        .maybeSingle();

      if (error || !data) return null;
      return data;
    } catch (e) {
      console.error("[public-api] Error fetching QR by Profile:", e);
      return null;
    }
  }

  async function generateQrSlug(_profileId) {
    throw new Error('QR generation requires authenticated API flow');
  }

  async function fetchProfileIdBySlug(slug) {
    var sb = getSb();
    if (!sb || !slug) return null;
    try {
      var normalized = String(slug).trim();
      // Check if slug is UUID
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalized)) {
        return normalized.toLowerCase();
      }

      // Keep client behavior aligned with server route /public/profile-id-by-slug.
      var normalizedSlug = normalized.toUpperCase();
      var { data, error } = await sb
        .from('qr_codes')
        .select('profile_id, status')
        .eq('slug', normalizedSlug)
        .maybeSingle();

      if (!error && data && data.status === 'active') return data.profile_id;

      return null;
    } catch (e) {
      console.error("[public-api] Error fetching Profile ID by Slug:", e);
      return null;
    }
  }


  async function fetchMyPendingUgc() {
    var sb = getSb();
    if (!sb) return { names: [], profiles: [] };
    
    // Attempt to get user session to ensure we only fetch if logged in
    var { data: sessionData } = await sb.auth.getSession();
    if (!sessionData || !sessionData.session || !sessionData.session.user) {
      return { names: [], profiles: [] };
    }

    try {
      // Fetch names
      var namesPromise = sb.from('ugc_submissions')
                           .select('id, suggested_name, lat, lng, status')
                           .or('status.eq.pending,status.is.null')
                           .order('submitted_at', { ascending: false, nullsFirst: false });
                           
      // Fetch profiles
      var profilesPromise = sb.from('ugc_profile_submissions')
                              .select('id, full_name, birth_year, death_year, cemetery_id, cemetery_name, lat, lng, status, owner_id')
                              .eq('owner_id', sessionData.session.user.id)
                              .or('status.eq.pending,status.is.null')
                              .order('submitted_at', { ascending: false, nullsFirst: false });

      var settled = await Promise.allSettled([namesPromise, profilesPromise]);
      var namesRes = settled[0].status === 'fulfilled' ? settled[0].value : { data: [] };
      var profilesRes = settled[1].status === 'fulfilled' ? settled[1].value : { data: [] };
      
      return {
        names: namesRes.data || [],
        profiles: profilesRes.data || []
      };
    } catch (e) {
      console.error("[public-api] Error fetching pending UGC:", e);
      return { names: [], profiles: [] };
    }
  }

  async function fetchMyCemeteryProfiles() {
    var sb = getSb();
    if (!sb) return [];

    var sessionRes = await sb.auth.getSession();
    if (!sessionRes || !sessionRes.data || !sessionRes.data.session || !sessionRes.data.session.user) {
      return [];
    }

    var userId = sessionRes.data.session.user.id;
    var merged = [];
    var seen = new Set();
    var pushUnique = function (row) {
      if (!row) return;
      var latKey = Number.isFinite(Number(row.lat)) ? Number(row.lat).toFixed(5) : 'x';
      var lngKey = Number.isFinite(Number(row.lng)) ? Number(row.lng).toFixed(5) : 'x';
      var key = [row.id || '', row.cemetery_id || '', (row.name || '').toLowerCase(), latKey, lngKey].join('|');
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(row);
    };

    try {
      var profilesRes = await sb
        .from('profiles')
        .select('id, cemetery_id, first_name, last_name, patronymic, birth_date, death_date, visibility_status, location')
        .in('visibility_status', ['private', 'family_only'])
        .limit(2000);

      if (profilesRes.error) throw profilesRes.error;

      var profileRows = profilesRes.data || [];
      var moderationByProfileId = new Map();
      var profileIds = profileRows.map(function (p) { return p.id; }).filter(Boolean);

      if (profileIds.length > 0) {
        var moderationRes = await sb
          .from('ugc_profile_submissions')
          .select('published_profile_id, status, submitted_at')
          .in('published_profile_id', profileIds)
          .order('submitted_at', { ascending: false, nullsFirst: false });

        if (moderationRes.error) {
          if (!String(moderationRes.error.message || '').includes('published_profile_id')) {
            console.warn('[public-api] moderation filter skipped:', moderationRes.error.message);
          }
        } else {
          (moderationRes.data || []).forEach(function (row) {
            if (!row || !row.published_profile_id) return;
            if (!moderationByProfileId.has(row.published_profile_id)) {
              moderationByProfileId.set(row.published_profile_id, row.status || null);
            }
          });
        }
      }

      profileRows.forEach(function (p) {
        var moderationStatus = moderationByProfileId.get(p.id);
        if (moderationStatus && moderationStatus !== 'approved') {
          return;
        }
        pushUnique({
          id: p.id,
          name: [p.last_name, p.first_name, p.patronymic].filter(Boolean).join(' '),
          birth: p.birth_date ? String(p.birth_date).substring(0, 4) : '?',
          death: p.death_date ? String(p.death_date).substring(0, 4) : '?',
          visibility_status: p.visibility_status || 'private',
          cemetery_id: p.cemetery_id || null,
          lat: p.location && p.location.coordinates ? p.location.coordinates[1] : null,
          lng: p.location && p.location.coordinates ? p.location.coordinates[0] : null
        });
      });
    } catch (e) {
      console.warn('[public-api] profiles private/family read skipped:', e);
    }

    try {
      var submissionsRes = await sb
        .from('ugc_profile_submissions')
        .select('id, cemetery_id, full_name, birth_year, death_year, lat, lng, status')
        .eq('owner_id', userId)
        .eq('status', 'approved')
        .limit(2000);

      if (submissionsRes.error) throw submissionsRes.error;

      (submissionsRes.data || []).forEach(function (s) {
        pushUnique({
          id: 'ugc_approved_' + s.id,
          name: s.full_name || '',
          birth: s.birth_year ? String(s.birth_year).substring(0, 4) : '?',
          death: s.death_year ? String(s.death_year).substring(0, 4) : '?',
          visibility_status: 'private',
          cemetery_id: s.cemetery_id || null,
          lat: s.lat,
          lng: s.lng
        });
      });
    } catch (e) {
      console.warn('[public-api] approved submissions fallback skipped:', e);
    }

    return merged.filter(function (p) {
      return Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng));
    });
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
  global.fetchMyPendingUgc = fetchMyPendingUgc;
  global.fetchMyCemeteryProfiles = fetchMyCemeteryProfiles;

  // Eagerly initialize client so window._sb is set BEFORE supabase-auth.js runs.
  // This prevents the "Multiple GoTrueClient instances detected" warning.
  getSb();
})(window);
