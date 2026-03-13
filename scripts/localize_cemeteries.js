/**
 * localize_cemeteries.js
 * Batch-translates cemetery names from Russian to Kazakh (n_kk) using pattern-based rules.
 * Adds n_ru as a clean copy of the canonical Russian name.
 * Run: node scripts/localize_cemeteries.js
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'cemeteries_data.js');
const raw = fs.readFileSync(dataPath, 'utf8');

let CEMETERIES_DATA = [];
eval(raw.replace('const CEMETERIES_DATA = ', 'CEMETERIES_DATA = '));

// ─── Translation Rules (applied in order) ─────────────────────────────────
// Pattern-based Ru -> Kk conversion for cemetery naming conventions

function toKazakh(name) {
    if (!name) return '';

    let n = name.trim().replace(/\s+/g, ' ');

    // 1. Known full replacements (exact match first)
    const fullMap = {
        'Жалпы зират': 'Жалпы зират',
        'Мусульманское кладбище': 'Мұсылман зираты',
        'Мусульманское': 'Мұсылман зираты',
        'Еврейское кладбище': 'Еврей зираты',
        'Христианское кладбище': 'Христиандар зираты',
        'Православное кладбище': 'Православ зираты',
        'Католическое кладбище': 'Католик зираты',
        'Городское кладбище': 'Қалалық зират',
        'Сельское кладбище': 'Ауылдық зират',
        'Старое кладбище': 'Ескі зират',
        'Новое кладбище': 'Жаңа зират',
        'Старинное кладбище': 'Ескі зират',
        'Неизвестное кладбище': 'Белгісіз зират',
        'Неизвестное': 'Белгісіз зират',
        'Кладбище': 'Зират',
        'Могила': 'Мазар',
        'кладбище': 'зират',
    };
    for (const [ru, kk] of Object.entries(fullMap)) {
        if (n === ru) return kk;
    }

    // 2. Pattern: "Кладбище (вблизи <Place>)" → "<Place> зираты"
    {
        const m = n.match(/^[Кк]ладбище\s+\(вблизи\s+(.+)\)$/i);
        if (m) return `${m[1].trim()} зираты`;
    }

    // 3. Pattern: "Кладбище (<something>)" → "<something> зираты"
    {
        const m = n.match(/^[Кк]ладбище\s+\((.+)\)$/);
        if (m) return `${m[1].trim()} зираты`;
    }

    // 4. Pattern: "Кладбище <Name>" → "<Name> зираты"
    {
        const m = n.match(/^[Кк]ладбище\s+(.+)$/);
        if (m) return `${m[1].trim()} зираты`;
    }

    // 5. Pattern: "<Name> кладбище" → "<Name> зираты"
    {
        const m = n.match(/^(.+?)\s+[Кк]ладбище$/);
        if (m) return `${m[1].trim()} зираты`;
    }

    // 6. If already Kazakh-ish (contains Kazakh-specific characters), keep as-is with suffix
    const kazakh = /[әіңғүұқөһ]/i;
    if (kazakh.test(n)) {
        if (!n.endsWith('зираты') && !n.endsWith('зират') && !n.endsWith('мазары')) {
            return `${n} зираты`;
        }
        return n;
    }

    // 7. Fallback: append зираты
    return `${n} зираты`;
}


function toCleanRu(name) {
    // Keep canonical Russian but clean up minor things
    return name ? name.trim().replace(/\s+/g, ' ') : name;
}

// ─── Process each cemetery ─────────────────────────────────────────────────
let changed = 0;
const enriched = CEMETERIES_DATA.map(c => {
    changed++;
    return {
        ...c,
        n_ru: toCleanRu(c.n),
        n_kk: toKazakh(c.n),
    };
});

// ─── Write back ────────────────────────────────────────────────────────────
const newContent = `const CEMETERIES_DATA = ${JSON.stringify(enriched, null, null)};\n`;
fs.writeFileSync(dataPath, newContent, 'utf8');

// ─── Stats ─────────────────────────────────────────────────────────────────
console.log(`✅ Done! Enriched ${changed} of ${enriched.length} cemeteries.`);

// ─── Quick Sample Preview ──────────────────────────────────────────────────
console.log('\n📋 Sample translations:');
enriched.slice(0, 15).forEach(c => {
    console.log(`  [ru] ${c.n_ru}`);
    console.log(`  [kk] ${c.n_kk}`);
    console.log('');
});
