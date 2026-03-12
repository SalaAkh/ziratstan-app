const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'src', 'js', 'core', 'locales.js');
let localesJs = fs.readFileSync(localesPath, 'utf8');

function addLocales(keys) {
    for (const [key, values] of Object.entries(keys)) {
        // Find kk: { ... } and ru: { ... } and insert
        if (!localesJs.includes(`'${key}':`)) {
            localesJs = localesJs.replace(/(kk:\s*\{)/, `$1\n        '${key}': '${values.kk}',`);
            localesJs = localesJs.replace(/(ru:\s*\{)/, `$1\n        '${key}': '${values.ru}',`);
        }
    }
}

// 1. DASHBOARD
const dashboardFile = path.join(__dirname, 'dashboard.html');
let dashboardHtml = fs.readFileSync(dashboardFile, 'utf8');

dashboardHtml = dashboardHtml.replace('<title>Менің кабинетім — Зиратстан</title>', '<title data-i18n="dash_title">Менің кабинетім — Зиратстан</title>');
dashboardHtml = dashboardHtml.replace('🗺️ Картаға оралу', '🗺️ <span data-i18n="dash_back_map">Картаға оралу</span>');
dashboardHtml = dashboardHtml.replace('id="logout-btn">Шығу</button>', 'id="logout-btn" data-i18n="dash_logout">Шығу</button>');

dashboardHtml = dashboardHtml.replace('<h2>Кабинетке кіру керек</h2>', '<h2 data-i18n="dash_login_req">Кабинетке кіру керек</h2>');
dashboardHtml = dashboardHtml.replace('<p>Жеке кабинеттің мүмкіндіктерін пайдалану үшін алдымен жүйеге кіріңіз.</p>', '<p data-i18n="dash_login_req_desc">Жеке кабинеттің мүмкіндіктерін пайдалану үшін алдымен жүйеге кіріңіз.</p>');
dashboardHtml = dashboardHtml.replace('🏠 Басты бетке', '🏠 <span data-i18n="dash_home">Басты бетке</span>');

dashboardHtml = dashboardHtml.replace('Сәлем,', '<span data-i18n="dash_hello">Сәлем</span>,');
dashboardHtml = dashboardHtml.replace('жүктелуде...', '<span data-i18n="dash_loading_user">жүктелуде...</span>');
dashboardHtml = dashboardHtml.replace('>🗺️ Карта<', '>🗺️ <span data-i18n="dash_map">Карта</span><');
dashboardHtml = dashboardHtml.replace('+ Жаңа профиль қосу', '<span data-i18n="dash_add_prof">+ Жаңа профиль қосу</span>');

dashboardHtml = dashboardHtml.replace('Менің профильдерім', '<span data-i18n="dash_my_profs">Менің профильдерім</span>');
dashboardHtml = dashboardHtml.replace('Барлығына ашық', '<span data-i18n="dash_public">Барлығына ашық</span>');
dashboardHtml = dashboardHtml.replace('Жабық / Жеке', '<span data-i18n="dash_private">Жабық / Жеке</span>');
dashboardHtml = dashboardHtml.replace('Жалпы көрулер', '<span data-i18n="dash_views">Жалпы көрулер</span>');

dashboardHtml = dashboardHtml.replace('📋 Менің жазбаларым', '📋 <span data-i18n="dash_my_records">Менің жазбаларым</span>');
dashboardHtml = dashboardHtml.replace('⚙️ Профиль', '⚙️ <span data-i18n="dash_profile_settings">Профиль</span>');
dashboardHtml = dashboardHtml.replace('<div class="dash-section-title">Менің жазбаларым</div>', '<div class="dash-section-title" data-i18n="dash_my_records">Менің жазбаларым</div>');
dashboardHtml = dashboardHtml.replace('>+ Жаңа қосу</button>', ' data-i18n="dash_add_new">+ Жаңа қосу</button>');
dashboardHtml = dashboardHtml.replace('Жүктелуде...', '<span data-i18n="dash_loading">Жүктелуде...</span>');

dashboardHtml = dashboardHtml.replace('<h3>Әзірге жазба жоқ</h3>', '<h3 data-i18n="dash_empty_title">Әзірге жазба жоқ</h3>');
dashboardHtml = dashboardHtml.replace('<p>Алғашқы мемориалды жасап, жақындарыңызды цифрлы естелікте сақтаңыз.</p>', '<p data-i18n="dash_empty_desc">Алғашқы мемориалды жасап, жақындарыңызды цифрлы естелікте сақтаңыз.</p>');
dashboardHtml = dashboardHtml.replace('+ Алғашқы профильді жасау', '<span data-i18n="dash_create_first">+ Алғашқы профильді жасау</span>');

dashboardHtml = dashboardHtml.replace('Профиль параметрлері', '<span data-i18n="dash_prof_settings_title">Профиль параметрлері</span>');
dashboardHtml = dashboardHtml.replace('<label for="settings-name">Аты-жөні</label>', '<label for="settings-name" data-i18n="dash_nameLbl">Аты-жөні</label>');
dashboardHtml = dashboardHtml.replace('placeholder="Аты-жөніңіз"', 'placeholder="Аты-жөніңіз" data-i18n-ph="dash_namePh"');
dashboardHtml = dashboardHtml.replace('<label for="settings-phone">Телефон</label>', '<label for="settings-phone" data-i18n="dash_phoneLbl">Телефон</label>');
dashboardHtml = dashboardHtml.replace('💾 Сақтау', '💾 <span data-i18n="dash_save">Сақтау</span>');
dashboardHtml = dashboardHtml.replace('🗑️ Аккаунтты жою', '🗑️ <span data-i18n="dash_del_acc">Аккаунтты жою</span>');

// Dynamic JS translation setup in dashboard
if(!dashboardHtml.includes('<script src="src/js/core/locales.js"></script>')) {
  dashboardHtml = dashboardHtml.replace('</body>', '  <script src="src/js/core/locales.js"></script>\n  <script src="src/js/core/i18n.js"></script>\n</body>');
  
  // also inject applyTranslations in dashboard.js initialization, let's just do it in script globally:
  dashboardHtml = dashboardHtml.replace(
      /(\/\/ ─── Load Profiles ─────────────────────────────────────────)/,
      "document.addEventListener('langchange', () => applyTranslations());\n      applyTranslations();\n\n      $1"
  );

  dashboardHtml = dashboardHtml.replace(
      /return div;\n    \}/,
      "// Apply translations after rendering new DOM elements if any\n      setTimeout(applyTranslations, 0);\n      return div;\n    }"
  );
}

fs.writeFileSync(dashboardFile, dashboardHtml);

// 2. ADMIN PANEL
const adminFile = path.join(__dirname, 'admin.html');
let adminHtml = fs.readFileSync(adminFile, 'utf8');

adminHtml = adminHtml.replace('<title>Зиратстан — Панель Модерации</title>', '<title data-i18n="admin_title">Зиратстан — Панель Модерации</title>');
adminHtml = adminHtml.replace('Панель модерации UGC контента', '<span data-i18n="admin_gate_sub">Панель модерации UGC контента</span>');
adminHtml = adminHtml.replace('Электронная почта', '<span data-i18n="admin_gate_emailLbl">Электронная почта</span>');
adminHtml = adminHtml.replace('Пароль', '<span data-i18n="admin_gate_passLbl">Пароль</span>');
adminHtml = adminHtml.replace('placeholder="Введите пароль"', 'placeholder="Введите пароль" data-i18n-ph="admin_gate_passPh"');
adminHtml = adminHtml.replace('>Войти<', ' data-i18n="admin_gate_login">Войти<');
adminHtml = adminHtml.replace('Отправить Magic Link', '<span data-i18n="admin_gate_magic">Отправить Magic Link</span>');
adminHtml = adminHtml.replace('Не удалось выполнить вход.', '<span data-i18n="admin_gate_fail">Не удалось выполнить вход.</span>');

adminHtml = adminHtml.replace('Подтвердите вход', '<span data-i18n="admin_mfa_title">Подтвердите вход</span>');
adminHtml = adminHtml.replace('Секрет для ручного добавления', '<span data-i18n="admin_mfa_secretLbl">Секрет для ручного добавления</span>');
adminHtml = adminHtml.replace('placeholder="6-значный код"', 'placeholder="6-значный код" data-i18n-ph="admin_mfa_codePh"');
adminHtml = adminHtml.replace('Подтвердить код', '<span data-i18n="admin_mfa_verify">Подтвердить код</span>');
adminHtml = adminHtml.replace('>Выйти<', ' data-i18n="admin_nav_logout">Выйти<'); // gate have Выйти, and nav have Выйти

adminHtml = adminHtml.replace('0 на проверке', '<span data-i18n="admin_nav_pending">0 на проверке</span>');
adminHtml = adminHtml.replace('>Выйти<', ' data-i18n="admin_nav_logout">Выйти<'); // Nav logout
adminHtml = adminHtml.replace('<h1>🛡 Панель модерации</h1>', '<h1>🛡 <span data-i18n="admin_panel_title">Панель модерации</span></h1>');
adminHtml = adminHtml.replace('<p class="subtitle">Проверка и одобрение пользовательских данных (UGC) перед публикацией на карте.</p>', '<p class="subtitle" data-i18n="admin_panel_desc">Проверка и одобрение пользовательских данных (UGC) перед публикацией на карте.</p>');

adminHtml = adminHtml.replace('Названия кладбищ', '<span data-i18n="admin_tab_names">Названия кладбищ</span>');
adminHtml = adminHtml.replace('Новые личности', '<span data-i18n="admin_tab_profs">Новые личности</span>');
adminHtml = adminHtml.replace('Биографии', '<span data-i18n="admin_tab_bios">Биографии</span>');
adminHtml = adminHtml.replace('📇 Управление профилями', '📇 <span data-i18n="admin_tab_manage">Управление профилями</span>');
adminHtml = adminHtml.replace('Сессии</button>', '<span data-i18n="admin_tab_sessions">Сессии</span></button>');

adminHtml = adminHtml.replace('➕ Создать новый профиль', '➕ <span data-i18n="admin_cp_title">Создать новый профиль</span>');
adminHtml = adminHtml.replace('placeholder="Имя (обязательно)"', 'placeholder="Имя (обязательно)" data-i18n-ph="admin_cp_fn"');
adminHtml = adminHtml.replace('placeholder="Фамилия"', 'placeholder="Фамилия" data-i18n-ph="admin_cp_ln"');
adminHtml = adminHtml.replace('placeholder="Год рождения (напр. 1850)"', 'placeholder="Год рождения (напр. 1850)" data-i18n-ph="admin_cp_by"');
adminHtml = adminHtml.replace('placeholder="Год смерти (напр. 1930)"', 'placeholder="Год смерти (напр. 1930)" data-i18n-ph="admin_cp_dy"');
adminHtml = adminHtml.replace('placeholder="Биография"', 'placeholder="Биография" data-i18n-ph="admin_cp_bioPh"');
adminHtml = adminHtml.replace('Создать профиль<', '<span data-i18n="admin_cp_submit">Создать профиль</span><');

adminHtml = adminHtml.replace('📋 База профилей', '📋 <span data-i18n="admin_mp_title">База профилей</span>');
adminHtml = adminHtml.replace('Активные устройства', '<span data-i18n="admin_ses_active">Активные устройства</span>');
adminHtml = adminHtml.replace('Завершить все остальные сессии', '<span data-i18n="admin_ses_term">Завершить все остальные сессии</span>');
adminHtml = adminHtml.replace('История входов/выходов', '<span data-i18n="admin_ses_history">История входов/выходов</span>');

// Dynamic JS translation setup in admin
if(!adminHtml.includes('<script src="src/js/core/locales.js"></script>')) {
  adminHtml = adminHtml.replace('</body>', '  <script src="src/js/core/locales.js"></script>\n  <script src="src/js/core/i18n.js"></script>\n  <script>document.addEventListener("DOMContentLoaded", function() { if(window.applyTranslations) applyTranslations(); }); document.addEventListener("langchange", function() { if(window.applyTranslations) applyTranslations(); });</script>\n</body>');
  
  // Update admin.js rendering functions to call applyTranslations if we needed to, but we'll do it later through a mutation observer or directly in code.
  // We'll just append it to locales.js
}

fs.writeFileSync(adminFile, adminHtml);

addLocales({
    dash_title: { kk: 'Менің кабинетім — Зиратстан', ru: 'Личный кабинет — Зиратстан' },
    dash_back_map: { kk: 'Картаға оралу', ru: 'Вернуться к карте' },
    dash_logout: { kk: 'Шығу', ru: 'Выйти' },
    dash_login_req: { kk: 'Кабинетке кіру керек', ru: 'Необходим вход в кабинет' },
    dash_login_req_desc: { kk: 'Жеке кабинеттің мүмкіндіктерін пайдалану үшін алдымен жүйеге кіріңіз.', ru: 'Для доступа к возможностям личного кабинета, пожалуйста, войдите в систему.' },
    dash_home: { kk: 'Басты бетке', ru: 'На главную' },
    dash_hello: { kk: 'Сәлем', ru: 'Привет' },
    dash_loading_user: { kk: 'жүктелуде...', ru: 'загрузка...' },
    dash_map: { kk: 'Карта', ru: 'Карта' },
    dash_add_prof: { kk: 'Жаңа профиль қосу', ru: 'Добавить новый профиль' },
    dash_my_profs: { kk: 'Менің профильдерім', ru: 'Мои профили' },
    dash_public: { kk: 'Барлығына ашық', ru: 'Открытые для всех' },
    dash_private: { kk: 'Жабық / Жеке', ru: 'Закрытые / Личные' },
    dash_views: { kk: 'Жалпы көрулер', ru: 'Общие просмотры' },
    dash_my_records: { kk: 'Менің жазбаларым', ru: 'Мои записи' },
    dash_profile_settings: { kk: 'Профиль', ru: 'Профиль' },
    dash_add_new: { kk: 'Жаңа қосу', ru: 'Добавить новую' },
    dash_loading: { kk: 'Жүктелуде...', ru: 'Загрузка...' },
    dash_empty_title: { kk: 'Әзірге жазба жоқ', ru: 'Пока нет записей' },
    dash_empty_desc: { kk: 'Алғашқы мемориалды жасап, жақындарыңызды цифрлы естелікте сақтаңыз.', ru: 'Создайте первый мемориал и сохраните цифровую память о близких.' },
    dash_create_first: { kk: 'Алғашқы профильді жасау', ru: 'Создать первый профиль' },
    dash_prof_settings_title: { kk: 'Профиль параметрлері', ru: 'Настройки профиля' },
    dash_nameLbl: { kk: 'Аты-жөні', ru: 'ФИО' },
    dash_namePh: { kk: 'Аты-жөніңіз', ru: 'Ваше ФИО' },
    dash_phoneLbl: { kk: 'Телефон', ru: 'Телефон' },
    dash_save: { kk: 'Сақтау', ru: 'Сохранить' },
    dash_del_acc: { kk: 'Аккаунтты жою', ru: 'Удалить аккаунт' },

    admin_title: { kk: 'Зиратстан — Модерация', ru: 'Зиратстан — Панель Модерации' },
    admin_gate_sub: { kk: 'UGC контентті модерациялау панелі', ru: 'Панель модерации UGC контента' },
    admin_gate_emailLbl: { kk: 'Электрондық пошта', ru: 'Электронная почта' },
    admin_gate_passLbl: { kk: 'Пароль', ru: 'Пароль' },
    admin_gate_passPh: { kk: 'Парольді енгізіңіз', ru: 'Введите пароль' },
    admin_gate_login: { kk: 'Кіру', ru: 'Войти' },
    admin_gate_magic: { kk: 'Magic Link жіберу', ru: 'Отправить Magic Link' },
    admin_gate_fail: { kk: 'Кіру мүмкін болмады.', ru: 'Не удалось выполнить вход.' },
    admin_mfa_title: { kk: 'Кіруді растаңыз', ru: 'Подтвердите вход' },
    admin_mfa_secretLbl: { kk: 'Қолмен қосуға арналған құпия', ru: 'Секрет для ручного добавления' },
    admin_mfa_codePh: { kk: '6-таңбалы код', ru: '6-значный код' },
    admin_mfa_verify: { kk: 'Кодты растау', ru: 'Подтвердить код' },
    admin_nav_logout: { kk: 'Шығу', ru: 'Выйти' },
    admin_nav_pending: { kk: '0 тексеруде', ru: '0 на проверке' },
    admin_panel_title: { kk: 'Модерация панелі', ru: 'Панель модерации' },
    admin_panel_desc: { kk: 'Картада жарияланбас бұрын пайдаланушы деректерін (UGC) тексеру және мақұлдау.', ru: 'Проверка и одобрение пользовательских данных (UGC) перед публикацией на карте.' },
    admin_tab_names: { kk: 'Бейіт атаулары', ru: 'Названия кладбищ' },
    admin_tab_profs: { kk: 'Жаңа тұлғалар', ru: 'Новые личности' },
    admin_tab_bios: { kk: 'Өмірбаяндар', ru: 'Биографии' },
    admin_tab_manage: { kk: 'Профильдерді басқару', ru: 'Управление профилями' },
    admin_tab_sessions: { kk: 'Сессиялар', ru: 'Сессии' },
    admin_cp_title: { kk: 'Жаңа профиль жасау', ru: 'Создать новый профиль' },
    admin_cp_fn: { kk: 'Аты (міндетті түрде)', ru: 'Имя (обязательно)' },
    admin_cp_ln: { kk: 'Тегі', ru: 'Фамилия' },
    admin_cp_by: { kk: 'Туған жылы (мыс. 1850)', ru: 'Год рождения (напр. 1850)' },
    admin_cp_dy: { kk: 'Қайтыс болған жылы (мыс. 1930)', ru: 'Год смерти (напр. 1930)' },
    admin_cp_bioPh: { kk: 'Өмірбаян', ru: 'Биография' },
    admin_cp_submit: { kk: 'Профиль жасау', ru: 'Создать профиль' },
    admin_mp_title: { kk: 'Профильдер базасы', ru: 'База профилей' },
    admin_ses_active: { kk: 'Белсенді құрылғылар', ru: 'Активные устройства' },
    admin_ses_term: { kk: 'Барлық басқа сессияларды аяқтау', ru: 'Завершить все остальные сессии' },
    admin_ses_history: { kk: 'Кіру/шығу тарихы', ru: 'История входов/выходов' }
});

fs.writeFileSync(localesPath, localesJs);

console.log('dashboard.html and admin.html and locales.js updated.');
