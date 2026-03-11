// ============================================================
//  migrate_profiles.js — Ziratstan.kz
//  Бисмиллях! Загружаем все профили из profiles_data.js в Supabase
//  Запуск: node scripts/migrate_profiles.js
// ============================================================

const fs = require('fs');
const path = require('path');

// --- НАСТРОЙКИ SUPABASE (service_role key для записи) ---
const SUPABASE_URL = 'https://myxswvzzotieygqnecbi.supabase.co';
// Используем anon key — он уже есть, для записи нужны Supabase RLS off 
// или service_role key. Ставим сюда service_role:
const SUPABASE_KEY = 'sb_secret_N_0MJRrrjcFfZ4AcgmpGWg_TmirxTK5';

// --- Загружаем profiles_data.js ---
const ROOT_DIR = path.resolve(__dirname, '..');
const raw = fs.readFileSync(path.join(ROOT_DIR, 'profiles_data.js'), 'utf8');
let PROFILES_STATIC;

// Eval в CommonJS контексте
const evalScript = raw.replace('const PROFILES_STATIC', 'PROFILES_STATIC');
eval(evalScript);

if (!PROFILES_STATIC || !Array.isArray(PROFILES_STATIC)) {
    console.error('❌ Не удалось загрузить PROFILES_STATIC из profiles_data.js');
    process.exit(1);
}

console.log(`Загружено профилей: ${PROFILES_STATIC.length}`);

// --- Вспомогательные функции ---

function yearToDate(val) {
    if (!val) return null;
    const str = String(val).trim();
    if (/^\d{4}$/.test(str)) {
        const year = parseInt(str);
        if (year >= 600 && year <= 2030) return `${str}-01-01`;
    }
    return null;
}

function parseName(fullName) {
    if (!fullName) return { first_name: '', last_name: '', patronymic: null };
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
        return { first_name: parts[0], last_name: '', patronymic: null };
    }
    if (parts.length === 2) {
        return { first_name: parts[1], last_name: parts[0], patronymic: null };
    }
    return {
        last_name: parts[0],
        first_name: parts[1],
        patronymic: parts.slice(2).join(' ')
    };
}

async function supabasePost(payload) {
    const url = `${SUPABASE_URL}/rest/v1/profiles`;
    const resp = await fetch(url, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
    });
    const text = await resp.text();
    return { ok: resp.ok, status: resp.status, text };
}

// Проверяем, уже загружен ли профиль (по slug_id в epitaph)
async function profileExists(slug) {
    const url = `${SUPABASE_URL}/rest/v1/profiles?epitaph=eq.${encodeURIComponent(slug)}&select=id&limit=1`;
    const resp = await fetch(url, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });
    if (!resp.ok) return false;
    const data = await resp.json();
    return Array.isArray(data) && data.length > 0;
}

// --- Основная миграция ---
async function runMigration() {
    console.log(`\nБисмиллях! 🕌 Начинаем миграцию ${PROFILES_STATIC.length} профилей...\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < PROFILES_STATIC.length; i++) {
        const p = PROFILES_STATIC[i];

        // Проверяем — уже есть в базе?
        const exists = await profileExists(p.id);
        if (exists) {
            skipCount++;
            process.stdout.write(`↩  [${i + 1}/${PROFILES_STATIC.length}] Уже есть: ${p.fullName}\n`);
            continue;
        }

        const { first_name, last_name, patronymic } = parseName(p.fullName);

        // Сохраняем slug в epitaph как уникальный маркер (slug:xxx)
        // Это позволяет нам:
        // 1. Проверять дублирование при повторном запуске
        // 2. Позволяет profile.html найти профиль по slug позже
        const epitaph = p.id; // Храним оригинальный slug: 'mirzhakyp_24'

        // Биография с названием кладбища и города
        const biography = `${p.city ? p.city + '.' : ''} ${p.cemetery ? 'Жерленген орны: ' + p.cemetery + '.' : ''}`.trim() || null;

        const payload = {
            first_name: first_name || p.name || '—',
            last_name: last_name || '',
            patronymic: patronymic || null,
            birth_date: yearToDate(p.birth),
            death_date: yearToDate(p.death),
            biography: biography,
            epitaph: epitaph, // ← хранит slug для маппинга
            main_photo_url: p.photo || null,
            location: (p.lat && p.lng) ? `SRID=4326;POINT(${p.lng} ${p.lat})` : null,
            visibility_status: 'public',
            cemetery_id: null,
        };

        const resp = await supabasePost(payload);

        if (resp.ok) {
            successCount++;
            process.stdout.write(`✅ [${i + 1}/${PROFILES_STATIC.length}] ${p.fullName}\n`);
        } else {
            errorCount++;
            const msg = `❌ [${i + 1}] ${p.fullName}: HTTP ${resp.status} — ${resp.text}`;
            console.error(msg);
            errors.push({ slug: p.id, name: p.fullName, status: resp.status, error: resp.text });
        }

        // Пауза каждые 25 записей
        if ((i + 1) % 25 === 0) {
            process.stdout.write(`\n  [Прогресс ${i + 1}/${PROFILES_STATIC.length}] ожидаем 500мс...\n\n`);
            await new Promise(r => setTimeout(r, 500));
        }
    }

    console.log('\n==============================================');
    console.log('МашаАллах! 🎉 Миграция завершена!');
    console.log(`✅ Добавлено:  ${successCount}`);
    console.log(`↩  Пропущено: ${skipCount} (уже в базе)`);
    console.log(`❌ Ошибок:    ${errorCount}`);
    console.log('==============================================');

    if (errors.length > 0) {
        console.log('\nДетали ошибок:');
        errors.forEach(e => console.log(`  [${e.slug}] ${e.name}: ${e.status} ${e.error}`));

        // Сохраняем ошибки в файл
        fs.writeFileSync(path.join(ROOT_DIR, 'migration_errors.json'), JSON.stringify(errors, null, 2));
        console.log('\nОшибки сохранены в migration_errors.json');
    }
}

runMigration().catch(console.error);
