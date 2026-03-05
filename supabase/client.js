// ============================================================
//  Ziratstan.kz — Supabase Client
//  Бисмиллях! Подключи сюда свои ключи из Supabase Dashboard
//  Settings → API → Project URL & anon/public key
// ============================================================

// 🔑 ЗАМЕНИ ЭТИ ЗНАЧЕНИЯ НА СВОИ — dashboard.supabase.com
var SUPABASE_URL = 'https://myxswvzzotieygqnecbi.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15eHN3dnp6b3RpZXlncW5lY2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1NDg2NTgsImV4cCI6MjA4ODEyNDY1OH0.ddnHsnHG1Nx9MP9dRZzheJPNAd1KLBopOzKwxQtYVxg';

// Инициализация клиента через CDN (supabase-js v2)
var createClient = supabase.createClient || supabase.createClient;
var db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper для получения текущей сессии
async function getSession() {
  const { data, error } = await db.auth.getSession();
  return data?.session;
}

// ============================================================
//  API Helpers
// ============================================================

/**
 * Отправить UGC предложение имени кладбища.
 * @param {object} data - { current_name, suggested_name, lat, lng, comment }
 */
async function submitUgcSuggestion(data) {
  const { error } = await db.from('ugc_submissions').insert([{
    current_name: data.current_name,
    suggested_name: data.suggested_name,
    lat: data.lat,
    lng: data.lng,
    comment: data.comment || null,
    status: 'pending',
    submitted_at: new Date().toISOString()
  }]);
  if (error) throw error;
}

/**
 * Создать заказ услуги по уходу.
 * @param {object} data - { service_type, customer_name, customer_phone, profile_ref, comment, price }
 */
async function createServicesLead(data) {
  const { error } = await db.from('services_leads').insert([{
    service_type: data.service_type,
    customer_name: data.customer_name,
    customer_phone: data.customer_phone,
    profile_ref: data.profile_ref || null,
    comment: data.comment || null,
    price: data.price,
    status: 'new',
    submitted_at: new Date().toISOString()
  }]);
  if (error) throw error;
}

/**
 * Отправить UGC добавление новой личности (профиля).
 * @param {object} data - { cemeteryId, cemeteryName, lat, lng, fullName, birth, death, description }
 */
async function submitUgcProfile(data) {
  const { error } = await db.from('ugc_profile_submissions').insert([{
    cemetery_id: data.cemeteryId || null,
    cemetery_name: data.cemeteryName || null,
    lat: data.lat || null,
    lng: data.lng || null,
    full_name: data.fullName,
    birth_year: data.birth || null,
    death_year: data.death || null,
    description: data.description || null,
    status: 'pending',
    submitted_at: new Date().toISOString()
  }]);
  if (error) throw error;
}

/**
 * Отправить UGC дополнение биографии.
 * @param {object} data - { profileId, authorName, text }
 */
async function submitUgcBio(data) {
  const { error } = await db.from('ugc_bio_submissions').insert([{
    profile_id: data.profileId,
    author_name: data.authorName || null,
    bio_text: data.text,
    status: 'pending',
    submitted_at: new Date().toISOString()
  }]);
  if (error) throw error;
}

/**
 * Загрузить VIP профили с карты из Supabase.
 * Возвращает массив совместимый с PROFILES в map.html
 */
async function fetchVipProfiles() {
  const { data, error } = await db
    .from('profiles')
    .select('id, first_name, last_name, patronymic, birth_date, death_date, epitaph, biography, main_photo_url, cemetery_id, location')
    .eq('visibility_status', 'public');
  if (error) {
    console.warn('[Ziratstan] Could not load profiles from Supabase:', error.message);
    return [];
  }
  // Нормализуем к формату PROFILES
  return data.map(p => ({
    id: p.id,
    name: [p.last_name, p.first_name, p.patronymic].filter(Boolean).join(' '),
    birth: p.birth_date ? p.birth_date.substring(0, 4) : '?',
    death: p.death_date ? p.death_date.substring(0, 4) : '?',
    cemetery: p.cemetery_id || 'Неизвестно',
    city: '',
    filter: 'historical',
    lat: p.location ? p.location.coordinates[1] : null,
    lng: p.location ? p.location.coordinates[0] : null,
    photo: p.main_photo_url || '',
    bio: p.biography || '',
  })).filter(p => p.lat && p.lng); // только с координатами
}

/**
 * Загрузить конкретный профиль по ID.
 * @param {string} id - UUID профиля (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
 * @returns {object|null} - нормализованный профиль или null
 */
async function fetchProfileById(id) {
  // Валидация UUID — если передан slug/username, сразу возвращаем null
  // чтобы не получить 400 от Supabase (invalid input syntax for type uuid)
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || !UUID_REGEX.test(id)) {
    return null;
  }

  const { data, error } = await db
    .from('profiles')
    .select('*, cemetery:cemeteries(name, city)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[Ziratstan] Profile load error:', error.message);
    return null;
  }

  // Нормализуем данные
  return {
    id: data.id,
    fullName: [data.last_name, data.first_name, data.patronymic].filter(Boolean).join(' '),
    name: data.first_name,
    lastName: data.last_name,
    birth: data.birth_date ? data.birth_date.substring(0, 4) : '?',
    death: data.death_date ? data.death_date.substring(0, 4) : '?',
    cemetery: data.cemetery?.name || 'Неизвестно',
    city: data.cemetery?.city || '',
    photo: data.main_photo_url || '',
    bio: data.biography || '',
    epitaph: data.epitaph || '',
    filter: 'historical'
  };
}

/**
 * Получить родственников профиля для шежіре.
 * @param {string} profileId - UUID профиля
 */
async function fetchFamilyRelations(profileId) {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!profileId || !UUID_REGEX.test(profileId)) return [];

  const { data, error } = await db
    .from('profile_relations')
    .select(`
      relation_type,
      profile_id_2,
      profiles!profile_relations_profile_id_2_fkey(id, first_name, last_name, birth_date, death_date, main_photo_url)
    `)
    .eq('profile_id_1', profileId);

  if (error) {
    console.warn('[Ziratstan] Could not load family relations:', error.message);
    return [];
  }
  return data;
}

// ============================================================
//  QR Code Helpers (QR-Мемориал)
// ============================================================

/**
 * Резолвить slug QR-кода → profile_id.
 * Также инкрементирует scan_count для аналитики.
 * @param {string} slug - Короткий код (например: ZRT-A7B8)
 * @returns {object|null} - { id, slug, profile_id, scan_count } или null
 */
async function resolveQrSlug(slug) {
  const { data, error } = await db
    .from('qr_codes')
    .select('id, slug, profile_id, status, scan_count')
    .eq('slug', slug.toUpperCase())
    .eq('status', 'active')
    .single();

  if (error || !data) {
    console.warn('[Ziratstan QR] Slug not found:', slug, error?.message);
    return null;
  }

  // Инкремент scan_count (fire-and-forget, не блокируем пользователя)
  db.from('qr_codes')
    .update({ scan_count: (data.scan_count || 0) + 1 })
    .eq('id', data.id)
    .then(() => { })
    .catch(err => console.warn('[Ziratstan QR] scan_count update failed:', err));

  return data;
}

/**
 * Генерирует новый уникальный QR-slug и привязывает к профилю.
 * Формат: ZRT-XXXX (где X = alphanumeric uppercase)
 * @param {string} profileId - UUID профиля
 * @returns {object} - { slug, id } созданной записи
 */
async function generateQrSlug(profileId) {
  // Генерируем уникальный slug
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // без 0,O,1,I для читабельности
  let slug;
  let attempts = 0;

  do {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    slug = 'ZRT-' + code;
    attempts++;

    // Проверяем уникальность
    const { data: existing } = await db
      .from('qr_codes')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (!existing) break;
  } while (attempts < 10);

  if (attempts >= 10) {
    throw new Error('Не удалось сгенерировать уникальный QR-slug после 10 попыток');
  }

  const { data, error } = await db
    .from('qr_codes')
    .insert([{
      slug: slug,
      profile_id: profileId,
      status: 'active',
      scan_count: 0,
      activated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }])
    .select('id, slug')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Получить QR-запись для профиля (если есть).
 * @param {string} profileId - UUID профиля
 * @returns {object|null} - { id, slug, scan_count, status } или null
 */
async function fetchQrByProfile(profileId) {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!profileId || !UUID_REGEX.test(profileId)) return null;

  const { data, error } = await db
    .from('qr_codes')
    .select('id, slug, scan_count, status, activated_at')
    .eq('profile_id', profileId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    console.warn('[Ziratstan QR] Could not fetch QR for profile:', error.message);
    return null;
  }
  return data;
}
