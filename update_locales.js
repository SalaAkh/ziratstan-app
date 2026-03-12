// tmp script to update locales.js
const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'src/js/core/locales.js');
let content = fs.readFileSync(localesPath, 'utf8');

const kkAdditions = `
        // --- META (INDEX) ---
        meta_index_title: "Зиратстан — Қазақстанның Цифрлық Жады",
        meta_index_desc: "Қазақстандағы жерлеу орындарын іздеу, цифрландыру және есте сақтау платформасы. Құлпытастағы QR-кодты сканерлеп, адамның толық өмірбаянын ашыңыз.",

        // --- AUTH ---
        auth_login_tab: "🔑 Кіру",
        auth_reg_tab: "✨ Тіркелу",
        auth_google: "Google арқылы кіру",
        auth_or: "немесе",
        auth_email: "Email",
        auth_password: "Пароль",
        auth_login_submit: "Кіру →",
        auth_no_account: "Аккаунт жоқ па?",
        auth_reg_link: "Тіркелу",
        auth_name: "Аты-жөні",
        auth_password_min: "Пароль (мин. 6 символ)",
        auth_reg_submit: "Тіркелу ✨",
        auth_has_account: "Аккаунт бар ма?",
        auth_login_link: "Кіру",

        // --- USER MENU ---
        user_manage: "Басқару →",
        user_logout: "Шығу",

        // --- KHANS DETAILS ---
        khan_era_foundation: "Құрылуы",
        khan_era_golden: "Алтын ғасыр",
        khan_era_power: "Қуатты кезең",
        khan_era_esim: "«Есім ханның ескі жолы»",
        khan_era_orbulak: "Орбұлақ шайқасы",
        khan_era_zheti: "«Жеті Жарғы»",
        khan_era_junior: "Кіші жүз ханы",
        khan_era_national: "Ұлттық батыр",
        khan_era_last: "Соңғы хан",

        khan_kerey: "Керей хан",
        khan_kerey_place: "📍 Хантау тауы, Жамбыл обл.",
        khan_zhanibek: "Жәнібек хан",
        khan_zhanibek_dates: "XV ғасыр",
        khan_zhanibek_place: "📍 Сарайшық, Атырау",
        khan_burunduk: "Бұрындық хан",
        khan_burunduk_place: "📍 Сарайшық, Атырау обл.",
        khan_kasym: "Қасым хан",
        khan_kasym_place: "📍 Сарайшық, Атырау",
        khan_mamash: "Мамаш хан",
        khan_mamash_place: "📍 Сарайшық, Атырау обл.",
        khan_tahir: "Тахир хан",
        khan_tahir_place: "📍 Белгісіз (Моғолстан)",
        khan_buydash: "Бұйдаш хан",
        khan_buydash_place: "📍 Түркістан обл.",
        khan_tugum: "Тұғым хан",
        khan_tugum_place: "📍 Түркістан обл.",
        khan_haknazar: "Хақназар хан",
        khan_haknazar_place: "📍 Түркістан маңы",
        khan_shygai: "Шығай хан",
        khan_shygai_place: "📍 Мавзолей Яссауи, Түркістан",
        khan_taukel: "Тәуекел хан",
        khan_taukel_place: "📍 Түркістан",
        khan_esim: "Есім хан",
        khan_esim_place: "📍 Мавзолей Есім хан, Түркістан",
        khan_salqam: "Салқам Жәңгір хан",
        khan_salqam_place: "📍 Мавзолей Яссауи, Түркістан",
        khan_tauke: "Тәуке хан",
        khan_tauke_place: "📍 Мавзолей Яссауи, Түркістан",
        khan_kaiyp: "Қайып хан",
        khan_kaiyp_place: "📍 Түркістан обл.",
        khan_bolat: "Болат хан",
        khan_bolat_place: "📍 Түркістан",
        khan_sameke: "Сәмеке хан",
        khan_sameke_place: "📍 Сарайшық маңы, Атырау обл.",
        khan_abulkhair: "Әбілқайыр хан",
        khan_abulkhair_place: "📍 Хан моласы, Ақтөбе обл.",
        khan_abylai: "Абылай хан",
        khan_abylai_place: "📍 Мавзолей Яссауи, Түркістан",
        khan_uali: "Уәли хан",
        khan_uali_place: "📍 Бұхара маңы (Өзб)",
        khan_nura: "Нұралы хан",
        khan_nura_place: "📍 Уфа (РФ)",
        khan_zhantore: "Жантөре хан",
        khan_zhantore_place: "📍 Орынбор (РФ)",
        khan_kenesary: "Кенесары хан",
        khan_kenesary_place: "📍 Белгісіз (Қырғызстан)",
`;

const ruAdditions = `
        // --- META (INDEX) ---
        meta_index_title: "Зиратстан — Цифровая Память Казахстана",
        meta_index_desc: "Платформа для поиска, оцифровки и сохранения памяти о местах захоронения в Казахстане. Отсканируйте QR-код на надгробии, чтобы открыть полную биографию человека.",

        // --- AUTH ---
        auth_login_tab: "🔑 Войти",
        auth_reg_tab: "✨ Регистрация",
        auth_google: "Войти через Google",
        auth_or: "или",
        auth_email: "Email",
        auth_password: "Пароль",
        auth_login_submit: "Войти →",
        auth_no_account: "Нет аккаунта?",
        auth_reg_link: "Зарегистрироваться",
        auth_name: "ФИО",
        auth_password_min: "Пароль (мин. 6 символов)",
        auth_reg_submit: "Зарегистрироваться ✨",
        auth_has_account: "Есть аккаунт?",
        auth_login_link: "Войти",

        // --- USER MENU ---
        user_manage: "Управление →",
        user_logout: "Выйти",

        // --- KHANS DETAILS ---
        khan_era_foundation: "Основание",
        khan_era_golden: "Золотой век",
        khan_era_power: "Эпоха могущества",
        khan_era_esim: "«Исконный путь Есим хана»",
        khan_era_orbulak: "Орбулакская битва",
        khan_era_zheti: "«Жеты Жаргы»",
        khan_era_junior: "Хан Младшего жуза",
        khan_era_national: "Национальный герой",
        khan_era_last: "Последний хан",

        khan_kerey: "Керей хан",
        khan_kerey_place: "📍 Горы Хантау, Жамбылская обл.",
        khan_zhanibek: "Жанибек хан",
        khan_zhanibek_dates: "XV век",
        khan_zhanibek_place: "📍 Сарайшык, Атырау",
        khan_burunduk: "Бурундук хан",
        khan_burunduk_place: "📍 Сарайшык, Атырауская обл.",
        khan_kasym: "Касым хан",
        khan_kasym_place: "📍 Сарайшык, Атырау",
        khan_mamash: "Мамаш хан",
        khan_mamash_place: "📍 Сарайшык, Атырауская обл.",
        khan_tahir: "Тахир хан",
        khan_tahir_place: "📍 Неизвестно (Могулистан)",
        khan_buydash: "Буйдаш хан",
        khan_buydash_place: "📍 Туркестанская обл.",
        khan_tugum: "Тугум хан",
        khan_tugum_place: "📍 Туркестанская обл.",
        khan_haknazar: "Хакназар хан",
        khan_haknazar_place: "📍 окр. Туркестана",
        khan_shygai: "Шыгай хан",
        khan_shygai_place: "📍 Мавзолей Яссауи, Туркестан",
        khan_taukel: "Тауекель хан",
        khan_taukel_place: "📍 Туркестан",
        khan_esim: "Есим хан",
        khan_esim_place: "📍 Мавзолей Есим хана, Туркестан",
        khan_salqam: "Салкам Жангир хан",
        khan_salqam_place: "📍 Мавзолей Яссауи, Туркестан",
        khan_tauke: "Тауке хан",
        khan_tauke_place: "📍 Мавзолей Яссауи, Туркестан",
        khan_kaiyp: "Кайып хан",
        khan_kaiyp_place: "📍 Туркестанская обл.",
        khan_bolat: "Болат хан",
        khan_bolat_place: "📍 Туркестан",
        khan_sameke: "Самеке хан",
        khan_sameke_place: "📍 окр. Сарайшыка, Атырауская обл.",
        khan_abulkhair: "Абулхаир хан",
        khan_abulkhair_place: "📍 Хан моласы, Актюбинская обл.",
        khan_abylai: "Абылай хан",
        khan_abylai_place: "📍 Мавзолей Яссауи, Туркестан",
        khan_uali: "Уали хан",
        khan_uali_place: "📍 окр. Бухары (Узб)",
        khan_nura: "Нуралы хан",
        khan_nura_place: "📍 Уфа (РФ)",
        khan_zhantore: "Жанторе хан",
        khan_zhantore_place: "📍 Оренбург (РФ)",
        khan_kenesary: "Кенесары хан",
        khan_kenesary_place: "📍 Неизвестно (Кыргызстан)",
`;

content = content.replace('// --- KHANS ---', kkAdditions + '\n        // --- KHANS ---');
content = content.replace(/(\s*\/\/\s*--- KHANS ---[\s\S]*?)(\s*\/\/\s*--- KHANS ---)/, (match, p1) => {
    // wait I should be careful to only replace ru section.
    return match; // fallback
});

// A safer way:
const parts = content.split('ru: {');
parts[0] = parts[0].replace('// --- KHANS ---', kkAdditions + '\n        // --- KHANS ---');
parts[1] = parts[1].replace('// --- KHANS ---', ruAdditions + '\n        // --- KHANS ---');

fs.writeFileSync(localesPath, parts.join('ru: {'));
console.log("locales updated");
