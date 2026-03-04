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
 * @param {string} id - UUID профиля
 */
async function fetchProfileById(id) {
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
