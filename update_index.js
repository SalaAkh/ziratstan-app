const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// 1. Meta Tags
html = html.replace('<title>Зиратстан — Қазақстанның Цифрлық Жады</title>', '<title data-i18n="meta_index_title">Зиратстан — Қазақстанның Цифрлық Жады</title>');
html = html.replace('<meta name="description"\\s*\\n\\s*content="Қазақстандағы жерлеу орындарын іздеу, цифрландыру және есте сақтау платформасы. Құлпытастағы QR-кодты сканерлеп, адамның толық өмірбаянын ашыңыз." />', '<meta name="description" data-i18n-content="meta_index_desc" content="Қазақстандағы жерлеу орындарын іздеу, цифрландыру және есте сақтау платформасы. Құлпытастағы QR-кодты сканерлеп, адамның толық өмірбаянын ашыңыз." />');
html = html.replace('<meta property="og:title" content="Зиратстан — Қазақстанның Цифрлық Жады" />', '<meta property="og:title" data-i18n-content="meta_index_title" content="Зиратстан — Қазақстанның Цифрлық Жады" />');
html = html.replace('<meta property="og:description"\\s*\\n\\s*content="Камераны құлпытастағы QR-кодқа бағыттап, адамның толық өмірбаянын ашыңыз. Қазақстанның жерлеу орындарын цифрландыру платформасы." />', '<meta property="og:description" data-i18n-content="meta_index_desc" content="Камераны құлпытастағы QR-кодқа бағыттап, адамның толық өмірбаянын ашыңыз. Қазақстанның жерлеу орындарын цифрландыру платформасы." />');
html = html.replace('<meta name="twitter:title" content="Зиратстан — Қазақстанның Цифрлық Жады" />', '<meta name="twitter:title" data-i18n-content="meta_index_title" content="Зиратстан — Қазақстанның Цифрлық Жады" />');
html = html.replace('<meta name="twitter:description"\\s*\\n\\s*content="Қазақстандағы жақындарыңызды табыңыз, цифрландырыңыз және естелігін сақтаңыз." />', '<meta name="twitter:description" data-i18n-content="meta_index_desc" content="Қазақстандағы жақындарыңызды табыңыз, цифрландырыңыз және естелігін сақтаңыз." />');

// 2. Auth Modal
html = html.replace(">🔑 Кіру<", ' data-i18n="auth_login_tab">🔑 Кіру<');
html = html.replace(">✨\n          Тіркелу<", ' data-i18n="auth_reg_tab">✨ Тіркелу<');
html = html.replace(">✨ Тіркелу<", ' data-i18n="auth_reg_tab">✨ Тіркелу<');
html = html.replace(/Google арқылы кіру/g, '<span data-i18n="auth_google">Google арқылы кіру</span>');
html = html.replace(">немесе<", ' data-i18n="auth_or">немесе<');
html = html.replace(">Email<", ' data-i18n="auth_email">Email<');
html = html.replace(">Пароль<", ' data-i18n="auth_password">Пароль<');
html = html.replace(">Кіру →<", ' data-i18n="auth_login_submit">Кіру →<');
html = html.replace("Аккаунт жоқ па?", '<span data-i18n="auth_no_account">Аккаунт жоқ па?</span>');
html = html.replace('тiркелу</a>', 'Тіркелу</a>'); // just in case
html = html.replace(">Тіркелу</a", ' data-i18n="auth_reg_link">Тіркелу</a');
html = html.replace(">Аты-жөні<", ' data-i18n="auth_name">Аты-жөні<');
html = html.replace(">Пароль (мин. 6 символ)<", ' data-i18n="auth_password_min">Пароль (мин. 6 символ)<');
html = html.replace(">Тіркелу ✨<", ' data-i18n="auth_reg_submit">Тіркелу ✨<');
html = html.replace("Аккаунт бар ма?", '<span data-i18n="auth_has_account">Аккаунт бар ма?</span>');
html = html.replace(">Кіру</a", ' data-i18n="auth_login_link">Кіру</a');
html = html.replace(">Басқару →<", ' data-i18n="user_manage">Басқару →<');
html = html.replace(">Шығу<", ' data-i18n="user_logout">Шығу<');

// 3. Khans Mapping
const khansMap = [
  {"id": "kerey", "name": "Керей хан", "place": "📍 Хантау тауы, Жамбыл обл."},
  {"id": "zhanibek", "name": "Жәнібек хан", "place": "📍 Сарайшық, Атырау", "dates": "XV ғасыр"},
  {"id": "burunduk", "name": "Бұрындық хан", "place": "📍 Сарайшық, Атырау обл."},
  {"id": "kasym", "name": "Қасым хан", "place": "📍 Сарайшық, Атырау"},
  {"id": "mamash", "name": "Мамаш хан", "place": "📍 Сарайшық, Атырау обл."},
  {"id": "tahir", "name": "Тахир хан", "place": "📍 Белгісіз (Моғолстан)"},
  {"id": "buydash", "name": "Бұйдаш хан", "place": "📍 Түркістан обл."},
  {"id": "tugum", "name": "Тұғым хан", "place": "📍 Түркістан обл."},
  {"id": "haknazar", "name": "Хақназар хан", "place": "📍 Түркістан маңы"},
  {"id": "shygai", "name": "Шығай хан", "place": "📍 Мавзолей Яссауи, Түркістан"},
  {"id": "taukel", "name": "Тәуекел хан", "place": "📍 Түркістан"},
  {"id": "esim", "name": "Есім хан", "place": "📍 Мавзолей Есім хан, Түркістан"},
  {"id": "salqam", "name": "Салқам Жәңгір хан", "place": "📍 Мавзолей Яссауи, Түркістан"},
  {"id": "tauke", "name": "Тәуке хан", "place": "📍 Мавзолей Яссауи, Түркістан"},
  {"id": "kaiyp", "name": "Қайып хан", "place": "📍 Түркістан обл."},
  {"id": "bolat", "name": "Болат хан", "place": "📍 Түркістан"},
  {"id": "sameke", "name": "Сәмеке хан", "place": "📍 Сарайшық маңы, Атырау обл."},
  {"id": "abulkhair", "name": "Әбілқайыр хан", "place": "📍 Хан моласы, Ақтөбе обл."},
  {"id": "abylai", "name": "Абылай хан", "place": "📍 Мавзолей Яссауи, Түркістан"},
  {"id": "uali", "name": "Уәли хан", "place": "📍 Бұхара маңы (Өзб)"},
  {"id": "nura", "name": "Нұралы хан", "place": "📍 Уфа (РФ)"},
  {"id": "zhantore", "name": "Жантөре хан", "place": "📍 Орынбор (РФ)"},
  {"id": "kenesary", "name": "Кенесары хан", "place": "📍 Белгісіз (Қырғызстан)"}
];

// Khans logic
for (const khan of khansMap) {
  html = html.replace(`>${khan.name}<`, ` data-i18n="khan_${khan.id}">${khan.name}<`);
  html = html.replace(`>${khan.place}<`, ` data-i18n="khan_${khan.id}_place">${khan.place}<`);
  if (khan.dates) {
    html = html.replace(`>${khan.dates}<`, ` data-i18n="khan_${khan.id}_dates">${khan.dates}<`);
  }
}

// Khans Eras
const eras = {
  "foundation": "Құрылуы",
  "golden": "Алтын ғасыр",
  "power": "Қуатты кезең",
  "esim": "«Есім ханның ескі жолы»",
  "orbulak": "Орбұлақ шайқасы",
  "zheti": "«Жеті Жарғы»",
  "junior": "Кіші жүз ханы",
  "national": "Ұлттық батыр",
  "last": "Соңғы хан"
};

for (const [key, val] of Object.entries(eras)) {
  html = html.replaceAll(`>${val}<`, ` data-i18n="khan_era_${key}">${val}<`);
}

fs.writeFileSync(indexPath, html);
console.log('index.html updated');
