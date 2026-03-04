import fs from 'fs';
import https from 'https';

// --- НАСТРОЙКИ SUPABASE ---
const SUPABASE_URL = 'https://myxswvzzotieygqnecbi.supabase.co';
const SUPABASE_SECRET_KEY = 'sb_secret_N_0MJRrrjcFfZ4AcgmpGWg_TmirxTK5'; // Используем service_role ключ для записи

// Загружаем профили из файла
const profilesDataRaw = fs.readFileSync('./profiles_data.js', 'utf8');
// Немного магии, чтобы вытащить массив из JS-файла
const scriptContext = {};
eval(profilesDataRaw.replace('const PROFILES =', 'scriptContext.PROFILES ='));
const profiles = scriptContext.PROFILES;

async function runMigration() {
    console.log('Бисмиллях! Начинаем миграцию...', profiles.length, 'профилей');

    // Кэш для cemetery_id (представим, что у нас пока нет реальных UUID для кладбищ, 
    // будем просто сохранять название кладбища в базу, или игнорировать cemetery_id (он nullable).
    // Для простоты мы запишем cemetery в поле `cemetery_id` как есть, если мы поменяли тип.
    // Но в схеме cemetery_id — это UUID. Значит, нам нужно либо создать кладбища, либо пока оставить null.

    let successCount = 0;
    let errorCount = 0;

    for (const p of profiles) {
        // Парсим имя
        const nameParts = p.fullName.split(' ');
        const lastName = nameParts[0] || '';
        const firstName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

        // Подготовка payload
        const payload = {
            // id: p.id, -- лучше пусть база генерит настоящий UUID
            first_name: firstName || p.name,
            last_name: lastName,
            birth_date: p.birth && p.birth.match(/^\d{4}$/) ? `${p.birth}-01-01` : null, // Примерно, если только год
            death_date: p.death && p.death.match(/^\d{4}$/) ? `${p.death}-01-01` : null,
            biography: `Оригинальный ID: ${p.id}. Город: ${p.city}. Место захоронения: ${p.cemetery}.`,
            main_photo_url: p.photo || null,
            location: p.lat && p.lng ? `SRID=4326;POINT(${p.lng} ${p.lat})` : null, // Формат PostGIS
            visibility_status: 'public'
        };

        try {
            const resp = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_SECRET_KEY,
                    'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(payload)
            });

            if (!resp.ok) {
                const errText = await resp.text();
                console.error(`Ошибка при сохранении ${p.fullName}:`, resp.status, errText);
                errorCount++;
            } else {
                successCount++;
                if (successCount % 20 === 0) console.log(`Мигрировано ${successCount} профилей...`);
            }
        } catch (e) {
            console.error(`Ошибка сети для ${p.fullName}:`, e.message);
            errorCount++;
        }
    }

    console.log('=================================');
    console.log(`МашаАллах! Миграция завершена.`);
    console.log(`Успешно: ${successCount}`);
    console.log(`Ошибок: ${errorCount}`);
    console.log('=================================');
}

runMigration().catch(console.error);
