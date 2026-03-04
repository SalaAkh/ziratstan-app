const fs = require('fs');
let data = fs.readFileSync('profiles_data.js', 'utf8');

// Check how many profiles are missing 'era'
const totalProfiles = (data.match(/id: '/g) || []).length;
const withEra = (data.match(/era: '/g) || []).length;
console.log(`Total profiles: ${totalProfiles}, with era: ${withEra}, missing: ${totalProfiles - withEra}`);

// These are the old multi-line format profiles that we need to tag
// Based on their IDs and content, we can determine the era

const eraMapping = {
    // khanate - Казахское ханство (15-19 вв.)
    'beket_ata_2': 'khanate',        // 1750-1813
    'abylai_khan_4': 'khanate',
    'tauke_khan_5': 'khanate',
    'kasym_khan_6': 'khanate',
    'zhanibek_khan_7': 'khanate',
    'tole_bi_8': 'khanate',
    'kazybek_bi_9': 'khanate',
    'aiteke_bi_10': 'khanate',
    'raiymbek_batyr_11': 'khanate',
    'kabanbai_batyr_12': 'khanate',
    'bogenbai_batyr_13': 'khanate',
    'korkyt_ata_3': 'medieval',     // VIII-IX вв.

    // alash - Алаш Орда / Просветители (1830-1940)
    'abai_kunanbaev_1': 'alash',
    'chokan_valikhanov_14': 'alash',
    'shakarim_15': 'alash',
    'alikhan_bokeikhanov_16': 'alash',
    'akhmet_baitursynov_17': 'alash',
    'mirzhakyp_dulatov_18': 'alash',
    'magzhan_zhumabaev_19': 'alash',
    'sultanmakhmut_toraighyrov_20': 'alash',
    'zhusupbek_aymauytov_21': 'alash',
    'saken_seifullin_22': 'alash',
    'beimbet_mailin_23': 'alash',
    'ilyas_dzhansugurov_24': 'alash',

    // soviet - XX век (1900-2000)
    'mukhtar_auezov_25': 'soviet',
    'kanysh_satpayev_26': 'soviet',
    'dinmukhamed_kunayev_27': 'soviet',
    'bauyrzhan_momyshuly_28': 'soviet',
    'aliya_moldagulova_29': 'soviet',
    'manshuk_mametova_30': 'soviet',
    'abish_kekilbaev_31': 'soviet',
    'fariza_ongarsynova_32': 'soviet',
};

// Generic assignment based on birth/death years
function guessEra(birth, death) {
    const birthYear = parseInt(birth);
    const deathYear = parseInt(death);

    if (birthYear < 1400 || deathYear < 1400) return 'medieval';
    if (birthYear >= 1400 && deathYear <= 1847) return 'khanate';
    if (birthYear >= 1800 && deathYear <= 1930) return 'alash';
    if (birthYear >= 1880) return 'soviet';
    return 'khanate';
}

// For multi-line objects, we need to add era after the id line
data = data.replace(/\{\s*\n\s+id: '([^']+)',\s*name: '([^']+)',\s*fullName: '([^']+)',\s*\n\s+(birth: '[^']*', death: '[^']*', cemetery: '[^']*', city: '[^']*',\s*\n\s+filter: 'historical')/g, (match, id, name, fullName, rest) => {
    if (data.includes(`id: '${id}', name: '${name}', fullName: '${fullName}', era:`)) return match; // Already has era (single-line)

    let era = eraMapping[id];
    if (!era) {
        // Extract birth/death from rest
        const birthMatch = rest.match(/birth: '([^']*)'/);
        const deathMatch = rest.match(/death: '([^']*)'/);
        era = guessEra(birthMatch ? birthMatch[1] : '', deathMatch ? deathMatch[1] : '');
    }

    return `{\n        id: '${id}', name: '${name}', fullName: '${fullName}', era: '${era}',\n        ${rest}`;
});

fs.writeFileSync('profiles_data.js', data);

const withEraAfter = (fs.readFileSync('profiles_data.js', 'utf8').match(/era: '/g) || []).length;
console.log(`After fix: profiles with era = ${withEraAfter}`);
