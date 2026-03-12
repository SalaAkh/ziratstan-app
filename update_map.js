const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'map.html');
let html = fs.readFileSync(file, 'utf8');

// 1. Meta Tags
html = html.replace('<title>Жерлеу Орындарының Картасы | Зиратстан</title>', '<title data-i18n="map_page_title">Жерлеу Орындарының Картасы | Зиратстан</title>');
html = html.replace('<meta property="og:title" content="Жерлеу Орындарының Картасы | Зиратстан" />', '<meta property="og:title" data-i18n-content="map_page_title" content="Жерлеу Орындарының Картасы | Зиратстан" />');
html = html.replace('<meta name="description" id="pageDesc"\n        content="Қазақстан зираттарының интерактивті картасы. Бейітті аты бойынша табыңыз немесе өзіңіздің GPS орналасуыңызды анықтаңыз." />', 
'<meta name="description" id="pageDesc" data-i18n-content="map_meta_desc"\n        content="Қазақстан зираттарының интерактивті картасы. Бейітті аты бойынша табыңыз немесе өзіңіздің GPS орналасуыңызды анықтаңыз." />');
html = html.replace('<meta property="og:description"\n        content="Қазақстан зираттарының интерактивті картасы. Нақты координаттар және іздеу." />',
'<meta property="og:description" data-i18n-content="map_meta_desc"\n        content="Қазақстан зираттарының интерактивті картасы. Нақты координаттар және іздеу." />');

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
html = html.replace('тiркелу</a>', 'Тіркелу</a>');
html = html.replace(">Тіркелу</a", ' data-i18n="auth_reg_link">Тіркелу</a');
html = html.replace(">Аты-жөні<", ' data-i18n="auth_name">Аты-жөні<');
html = html.replace(">Пароль (мин. 6 символ)<", ' data-i18n="auth_password_min">Пароль (мин. 6 символ)<');
html = html.replace(">✨ Тіркелу →<", ' data-i18n="auth_reg_submit">✨ Тіркелу →<');
html = html.replace("Аккаунтыңыз бар ма?", '<span data-i18n="auth_has_account">Аккаунт бар ма?</span>');
html = html.replace(">Кіру</a", ' data-i18n="auth_login_link">Кіру</a');
html = html.replace(">Басқару →<", ' data-i18n="user_manage">Басқару →<');
html = html.replace(">Шығу<", ' data-i18n="user_logout">Шығу<');

// 3. Remove applyHead script (bottom)
const headScriptRegex = /<script>\s*\(\s*function\s*\(\)\s*{\s*function\s*applyHead\(\)\s*{[^]*?}\s*\)\(\);\s*<\/script>/m;
html = html.replace(headScriptRegex, '');

fs.writeFileSync(file, html);
console.log('map.html updated');
