// Ziratstan VIP Profiles Database
const PROFILES_STATIC = [
    {
        id: 'beket_ata_2', name: 'Бекет ата', fullName: 'Бекет Мырзағұлұлы', era: 'khanate',
        birth: '1750', death: '1813', cemetery: 'Оғланды мешіті', city: 'Маңғыстау',
        filter: 'historical', lat: 43.5936, lng: 54.0677, photo: null
    },
    {
        id: 'korkyt_ata_3', name: 'Қорқыт ата', fullName: 'Қорқыт ата', era: 'medieval',
        birth: 'VIII', death: 'IX', cemetery: 'Мемориал Қорқыт ата', city: 'Қызылорда',
        filter: 'historical', lat: 44.849279, lng: 65.500233, photo: null
    },
    {
        id: 'abylai_khan_4', name: 'Абылай хан', fullName: 'Абылай (Әбілмансұр) хан', era: 'khanate',
        birth: '1711', death: '1781', cemetery: 'Мавзолей Яссауи', city: 'Түркістан',
        filter: 'historical', lat: 43.297544, lng: 68.270819, photo: null
    },
    {
        id: 'tauke_khan_5', name: 'Тәуке хан', fullName: 'Тәуке хан', era: 'khanate',
        birth: '1635', death: '1715', cemetery: 'Мавзолей Яссауи', city: 'Түркістан',
        filter: 'historical', lat: 43.297406, lng: 68.270842, photo: null
    },
    {
        id: 'kasym_khan_6', name: 'Қасым хан', fullName: 'Қасым хан', era: 'khanate',
        birth: '1445', death: '1521', cemetery: 'Сарайшық көне қаласы', city: 'Атырау',
        filter: 'historical', lat: 47.116265, lng: 51.883812, photo: null
    },
    {
        id: 'zhanibek_khan_7', name: 'Жәнібек хан', fullName: 'Керей мен Жәнібек', era: 'khanate',
        birth: 'XV', death: 'XV', cemetery: 'Сарайшық көне қаласы', city: 'Атырау',
        filter: 'historical', lat: 47.117124, lng: 51.884271, photo: null
    },
    {
        id: 'tole_bi_8', name: 'Төле би', fullName: 'Төле би Әлібекұлы', era: 'khanate',
        birth: '1663', death: '1756', cemetery: 'Қарлығаш би кесенесі', city: 'Ташкент (Узб)',
        filter: 'historical', lat: 41.3197, lng: 69.2558, photo: null
    },
    {
        id: 'kazybek_bi_9', name: 'Қазыбек би', fullName: 'Қаз дауысты Қазыбек би', era: 'khanate',
        birth: '1667', death: '1764', cemetery: 'Мавзолей Яссауи', city: 'Түркістан',
        filter: 'historical', lat: 43.297575, lng: 68.270558, photo: null
    },
    {
        id: 'aiteke_bi_10', name: 'Әйтеке би', fullName: 'Әйтеке би Бәйбекұлы', era: 'khanate',
        birth: '1644', death: '1700', cemetery: 'Нурата кесенесі', city: 'Нурата (Узб)',
        filter: 'historical', lat: 40.5636, lng: 65.6881, photo: null
    },
    {
        id: 'raiymbek_batyr_11', name: 'Райымбек батыр', fullName: 'Райымбек Түкеұлы', era: 'khanate',
        birth: '1705', death: '1785', cemetery: 'Кесенесі', city: 'Алматы',
        filter: 'historical', lat: 43.2731, lng: 76.9535, photo: null
    },
    {
        id: 'qabanbay_batyr_12', name: 'Қабанбай батыр', fullName: 'Қаракерей Қабанбай', era: 'khanate',
        birth: '1692', death: '1770', cemetery: 'Ұлттық Пантеон', city: 'Астана',
        filter: 'historical', lat: 51.011385, lng: 71.373677, photo: null
    },
    {
        id: 'bogenbay_batyr_13', name: 'Бөгенбай батыр', fullName: 'Қанжығалы Бөгенбай', era: 'khanate',
        birth: '1680', death: '1778', cemetery: 'Ерейментау', city: 'Ақмола обл',
        filter: 'historical', lat: 51.6214, lng: 73.0789, photo: null
    },
    {
        id: 'sirim_datuly_14', name: 'Сырым Датұлы', fullName: 'Сырым Датұлы', era: 'khanate',
        birth: '1742', death: '1802', cemetery: 'Гюрлен', city: 'Хорезм (Узб)',
        filter: 'historical', lat: 41.8411, lng: 60.3953, photo: null
    },
    {
        id: 'makhambet_15', name: 'Өтемісұлы М.', fullName: 'Махамбет Өтемісұлы', era: 'khanate',
        birth: '1803', death: '1846', cemetery: 'Индер ауданы', city: 'Атырау',
        filter: 'historical', lat: 47.116296, lng: 51.884958, photo: null
    },
    {
        id: 'isatay_16', name: 'Тайманов И.', fullName: 'Исатай Тайманов', era: 'khanate',
        birth: '1791', death: '1838', cemetery: 'Қобда ауданы', city: 'Ақтөбе',
        filter: 'historical', lat: 50.285066, lng: 57.168238, photo: null
    },
    {
        id: 'amangeldi_17', name: 'Иманов А.', fullName: 'Амангелді Иманов', era: 'alash',
        birth: '1873', death: '1919', cemetery: 'Амангелді ауданы', city: 'Қостанай',
        filter: 'historical', lat: 50.1808, lng: 65.1583, photo: null
    },
    {
        id: 'abai_18', name: 'Құнанбаев А.', fullName: 'Абай Құнанбайұлы', era: 'alash',
        birth: '1845', death: '1904', cemetery: 'Жидебай кесенесі', city: 'Абай обл',
        filter: 'historical', lat: 49.12712, lng: 79.323946, photo: null
    },
    {
        id: 'shakarim_19', name: 'Құдайбердіұлы Ш.', fullName: 'Шәкәрім Құдайбердіұлы', era: 'alash',
        birth: '1858', death: '1931', cemetery: 'Жидебай кесенесі', city: 'Абай обл',
        filter: 'historical', lat: 49.126642, lng: 79.324386, photo: null
    },
    {
        id: 'chokan_20', name: 'Уәлиханов Ш.', fullName: 'Шоқан Уәлиханов', era: 'alash',
        birth: '1835', death: '1865', cemetery: 'Алтынемел', city: 'Жетісу обл',
        filter: 'historical', lat: 44.1167, lng: 78.5333, photo: null
    },
    {
        id: 'altynsarin_21', name: 'Алтынсарин Ы.', fullName: 'Ыбырай Алтынсарин', era: 'alash',
        birth: '1841', death: '1889', cemetery: 'Кесенесі', city: 'Қостанай',
        filter: 'historical', lat: 53.1833, lng: 63.6333, photo: null
    },
    {
        id: 'zhambyl_22', name: 'Жабаев Ж.', fullName: 'Жамбыл Жабаев', era: 'alash',
        birth: '1846', death: '1945', cemetery: 'Кесенесі', city: 'Алматы обл',
        filter: 'historical', lat: 43.1442, lng: 76.1803, photo: null
    },
    {
        id: 'akhmet_b_23', name: 'Байтұрсынұлы А.', fullName: 'Ахмет Байтұрсынұлы', era: 'alash',
        birth: '1872', death: '1937', cemetery: 'Жаңалық (жаппай зират)', city: 'Алматы обл',
        filter: 'historical', lat: 43.440635, lng: 77.172334, photo: null
    },
    {
        id: 'mirzhakyp_24', name: 'Дулатұлы М.', fullName: 'Міржақып Дулатұлы', era: 'alash',
        birth: '1885', death: '1935', cemetery: 'Торғай (перезахор.)', city: 'Қостанай обл',
        filter: 'historical', lat: 49.6333, lng: 63.4833, photo: null
    },
    {
        id: 'magzhan_25', name: 'Жұмабаев М.', fullName: 'Мағжан Жұмабаев', era: 'alash',
        birth: '1893', death: '1938', cemetery: 'Белгісіз (Жаңалық/Магадан)', city: 'Алматы обл',
        filter: 'historical', lat: 43.440857, lng: 77.171757, photo: null
    },
    {
        id: 'saken_s_26', name: 'Сейфуллин С.', fullName: 'Сәкен Сейфуллин', era: 'alash',
        birth: '1894', death: '1938', cemetery: 'Жаңалық (жаппай зират)', city: 'Алматы обл',
        filter: 'historical', lat: 43.44137, lng: 77.171768, photo: null
    },
    {
        id: 'beimbet_27', name: 'Майлин Б.', fullName: 'Бейімбет Майлин', era: 'alash',
        birth: '1894', death: '1938', cemetery: 'Жаңалық', city: 'Алматы обл',
        filter: 'historical', lat: 43.441184, lng: 77.171873, photo: null
    },
    {
        id: 'iliyas_zh_28', name: 'Жансүгіров І.', fullName: 'Ілияс Жансүгіров', era: 'alash',
        birth: '1894', death: '1938', cemetery: 'Жаңалық', city: 'Алматы обл',
        filter: 'historical', lat: 43.44058, lng: 77.171537, photo: null
    },
    {
        id: 'zhusupbek_29', name: 'Аймауытов Ж.', fullName: 'Жүсіпбек Аймауытов', era: 'alash',
        birth: '1889', death: '1930', cemetery: 'Ваганьковское', city: 'Москва (РФ)',
        filter: 'historical', lat: 55.767824, lng: 37.549072, photo: null
    },
    {
        id: 'sultanmahmut_30', name: 'Торайғыров С.', fullName: 'Сұлтанмахмұт Торайғыров', era: 'alash',
        birth: '1893', death: '1920', cemetery: 'Баянауыл', city: 'Павлодар обл',
        filter: 'historical', lat: 50.785, lng: 75.6983, photo: null
    },
    {
        id: 'mashhur_31', name: 'Көпейұлы М.Ж.', fullName: 'Мәшһүр Жүсіп Көпейұлы', era: 'alash',
        birth: '1858', death: '1931', cemetery: 'Ескелді', city: 'Павлодар обл',
        filter: 'historical', lat: 51.275, lng: 75.385, photo: null
    },
    {
        id: 'kurmangazy_32', name: 'Сағырбайұлы Қ.', fullName: 'Құрманғазы Сағырбайұлы', era: 'khanate',
        birth: '1818', death: '1896', cemetery: 'Алтынжар', city: 'Астрахань (РФ)',
        filter: 'historical', lat: 46.2553, lng: 48.435, photo: null
    },
    {
        id: 'dauletkerei_33', name: 'Шығайұлы Д.', fullName: 'Дәулеткерей Шығайұлы', era: 'khanate',
        birth: '1820', death: '1887', cemetery: 'Бөкей ордасы', city: 'БҚО',
        filter: 'historical', lat: 51.232415, lng: 51.365904, photo: null
    },
    {
        id: 'tattimbet_34', name: 'Қазанғапұлы Т.', fullName: 'Тәттімбет Қазанғапұлы', era: 'khanate',
        birth: '1815', death: '1862', cemetery: 'Қарқаралы', city: 'Қарағанды обл',
        filter: 'historical', lat: 49.928537, lng: 73.081222, photo: null
    },
    {
        id: 'dina_35', name: 'Нұрпейісова Д.', fullName: 'Дина Нұрпейісова', era: 'alash',
        birth: '1861', death: '1955', cemetery: 'Орталық қорым', city: 'Алматы',
        filter: 'historical', lat: 43.283009, lng: 76.923578, photo: null
    },
    {
        id: 'akan_seri_36', name: 'Қорамсаұлы А.', fullName: 'Ақан сері', era: 'khanate',
        birth: '1843', death: '1913', cemetery: 'Көкшетау', city: 'Ақмола обл',
        filter: 'historical', lat: 53.2833, lng: 69.3833, photo: null
    },
    {
        id: 'birzhan_sal_37', name: 'Қожағұлұлы Б.', fullName: 'Біржан сал', era: 'khanate',
        birth: '1834', death: '1897', cemetery: 'Еңбекшілдер', city: 'Ақмола обл',
        filter: 'historical', lat: 52.8333, lng: 70.0833, photo: null
    },
    {
        id: 'kunayev_38', name: 'Қонаев Д.А.', fullName: 'Дінмұхамед Ахмедұлы Қонаев', era: 'soviet',
        birth: '1912', death: '1993', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'almaty', lat: 43.266121, lng: 76.997036, photo: null
    },
    {
        id: 'bokeykhan_39', name: 'Бөкейхан Ә.', fullName: 'Әлихан Бөкейхан', era: 'alash',
        birth: '1866', death: '1937', cemetery: 'Донское зираты', city: 'Москва (РФ)',
        filter: 'historical', lat: 55.7119, lng: 37.6019, photo: null
    },
    {
        id: 'mustafa_40', name: 'Шоқай М.', fullName: 'Мұстафа Шоқай', era: 'alash',
        birth: '1890', death: '1941', cemetery: 'Темпельхоф', city: 'Берлин (Германия)',
        filter: 'historical', lat: 52.4727, lng: 13.4061, photo: null
    },
    {
        id: 'turar_41', name: 'Рысқұлов Т.', fullName: 'Тұрар Рысқұлов', era: 'alash',
        birth: '1894', death: '1938', cemetery: 'Коммунарка', city: 'Москва (РФ)',
        filter: 'historical', lat: 55.5786, lng: 37.4561, photo: null
    },
    {
        id: 'oraz_42', name: 'Жандосов О.', fullName: 'Ораз Жандосов', era: 'alash',
        birth: '1899', death: '1938', cemetery: 'Жаңалық', city: 'Алматы обл',
        filter: 'historical', lat: 43.441285, lng: 77.171562, photo: null
    },
    {
        id: 'khalel_43', name: 'Досмұхамедұлы Х.', fullName: 'Халел Досмұхамедұлы', era: 'alash',
        birth: '1883', death: '1939', cemetery: 'Белгісіз (Воронеж)', city: 'Воронеж (РФ)',
        filter: 'historical', lat: 51.6608, lng: 39.2003, photo: null
    },
    {
        id: 'sanzhar_44', name: 'Асфендияров С.', fullName: 'Санжар Асфендияров', era: 'alash',
        birth: '1889', death: '1938', cemetery: 'Жаңалық', city: 'Алматы обл',
        filter: 'historical', lat: 43.441182, lng: 77.172269, photo: null
    },
    {
        id: 'zhumabay_45', name: 'Шаяхметов Ж.', fullName: 'Жұмабай Шаяхметов', era: 'soviet',
        birth: '1902', death: '1966', cemetery: 'Орталық қорым', city: 'Алматы',
        filter: 'historical', lat: 43.282491, lng: 76.92557, photo: null
    },
    {
        id: 'zhumabek_46', name: 'Тәшенов Ж.', fullName: 'Жұмабек Тәшенов', era: 'soviet',
        birth: '1915', death: '1986', cemetery: 'Шымкент қаласы', city: 'Шымкент',
        filter: 'historical', lat: 42.3417, lng: 69.5901, photo: null
    },
    {
        id: 'ozbekali_47', name: 'Жәнібеков Ө.', fullName: 'Өзбекәлі Жәнібеков', era: 'soviet',
        birth: '1931', death: '1998', cemetery: 'Кеңсай', city: 'Алматы',
        filter: 'almaty', lat: 43.267065, lng: 76.998569, photo: null
    },
    {
        id: 'bauyrzhan_48', name: 'Момышұлы Б.', fullName: 'Бауыржан Момышұлы', era: 'soviet',
        birth: '1910', death: '1982', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.26544, lng: 76.997193, photo: null
    },
    {
        id: 'aliya_49', name: 'Молдағұлова Ә.', fullName: 'Әлия Молдағұлова', era: 'soviet',
        birth: '1925', death: '1944', cemetery: 'Монаково', city: 'Псков обл (РФ)',
        filter: 'historical', lat: 56.321, lng: 29.9822, photo: null
    },
    {
        id: 'manshuk_50', name: 'Мәметова М.', fullName: 'Мәншүк Мәметова', era: 'soviet',
        birth: '1922', death: '1943', cemetery: 'Невель', city: 'Псков обл (РФ)',
        filter: 'historical', lat: 56.021, lng: 29.9272, photo: null
    },
    {
        id: 'talgat_51', name: 'Бигелдинов Т.', fullName: 'Талғат Бигелдинов', era: 'soviet',
        birth: '1922', death: '2014', cemetery: 'Кеңсай-2', city: 'Алматы',
        filter: 'historical', lat: 43.260447, lng: 77.004425, photo: null
    },
    {
        id: 'sagadat_52', name: 'Нұрмағамбетов С.', fullName: 'Сағадат Нұрмағамбетов', era: 'soviet',
        birth: '1924', death: '2013', cemetery: 'Кеңсай-2', city: 'Алматы',
        filter: 'historical', lat: 43.260071, lng: 77.004373, photo: null
    },
    {
        id: 'rakhymzhan_53', name: 'Қошқарбаев Р.', fullName: 'Рахымжан Қошқарбаев', era: 'soviet',
        birth: '1924', death: '1988', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.265186, lng: 76.99831, photo: null
    },
    {
        id: 'kasym_54', name: 'Қайсенов Қ.', fullName: 'Қасым Қайсенов', era: 'soviet',
        birth: '1918', death: '2006', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.266991, lng: 76.998389, photo: null
    },
    {
        id: 'hiuaz_55', name: 'Доспанова Х.', fullName: 'Хиуаз Доспанова', era: 'soviet',
        birth: '1922', death: '2008', cemetery: 'Атырау қорымы', city: 'Атырау',
        filter: 'historical', lat: 47.116402, lng: 51.884478, photo: null
    },
    {
        id: 'nurken_56', name: 'Әбдіров Н.', fullName: 'Нұркен Әбдіров', era: 'soviet',
        birth: '1919', death: '1942', cemetery: 'Боковская сп', city: 'Ростов обл (РФ)',
        filter: 'historical', lat: 49.2272, lng: 41.8317, photo: null
    },
    {
        id: 'kanysh_57', name: 'Сәтбаев Қ.', fullName: 'Қаныш Сәтбаев', era: 'soviet',
        birth: '1899', death: '1964', cemetery: 'Орталық қорым', city: 'Алматы',
        filter: 'historical', lat: 43.282495, lng: 76.924981, photo: null
    },
    {
        id: 'ermukhan_58', name: 'Бекмаханов Е.', fullName: 'Ермұхан Бекмаханов', era: 'soviet',
        birth: '1915', death: '1966', cemetery: 'Орталық қорым', city: 'Алматы',
        filter: 'historical', lat: 43.285853, lng: 76.923344, photo: null
    },
    {
        id: 'alkei_59', name: 'Марғұлан Ә.', fullName: 'Әлкей Марғұлан', era: 'soviet',
        birth: '1904', death: '1985', cemetery: 'Орталық қорым', city: 'Алматы',
        filter: 'historical', lat: 43.282061, lng: 76.923661, photo: null
    },
    {
        id: 'evney_60', name: 'Букетов Е.', fullName: 'Евней Букетов', era: 'soviet',
        birth: '1925', death: '1983', cemetery: 'Қарағанды', city: 'Қарағанды',
        filter: 'historical', lat: 49.92845, lng: 73.083131, photo: null
    },
    {
        id: 'salyk_61', name: 'Зиманов С.', fullName: 'Салық Зиманов', era: 'soviet',
        birth: '1921', death: '2011', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.265427, lng: 76.99837, photo: null
    },
    {
        id: 'auezov_62', name: 'Әуезов М.', fullName: 'Мұхтар Әуезов', era: 'soviet',
        birth: '1897', death: '1961', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'almaty', lat: 43.26639, lng: 76.997161, photo: null
    },
    {
        id: 'gabit_63', name: 'Мүсірепов Ғ.', fullName: 'Ғабит Мүсірепов', era: 'soviet',
        birth: '1902', death: '1985', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.265312, lng: 76.997843, photo: null
    },
    {
        id: 'sabit_64', name: 'Мұқанов С.', fullName: 'Сәбіт Мұқанов', era: 'soviet',
        birth: '1900', death: '1973', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.265891, lng: 76.998281, photo: null
    },
    {
        id: 'iliyas_e_65', name: 'Есенберлин І.', fullName: 'Ілияс Есенберлин', era: 'soviet',
        birth: '1915', death: '1983', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.266173, lng: 76.998191, photo: null
    },
    {
        id: 'mukagali_66', name: 'Мақатаев М.', fullName: 'Мұқағали Мақатаев', era: 'soviet',
        birth: '1931', death: '1976', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.26687, lng: 76.997244, photo: null
    },
    {
        id: 'tumanbay_67', name: 'Молдағалиев Т.', fullName: 'Тұманбай Молдағалиев', era: 'soviet',
        birth: '1935', death: '2011', cemetery: 'Кеңсай', city: 'Алматы',
        filter: 'historical', lat: 43.267839, lng: 76.998838, photo: null
    },
    {
        id: 'fariza_68', name: 'Оңғарсынова Ф.', fullName: 'Фариза Оңғарсынова', era: 'soviet',
        birth: '1939', death: '2014', cemetery: 'Ұлттық Пантеон', city: 'Астана',
        filter: 'historical', lat: 51.010961, lng: 71.374455, photo: null
    },
    {
        id: 'abish_69', name: 'Кекілбайұлы Ә.', fullName: 'Әбіш Кекілбайұлы', era: 'soviet',
        birth: '1939', death: '2015', cemetery: 'Ұлттық Пантеон', city: 'Астана',
        filter: 'historical', lat: 51.011162, lng: 71.373506, photo: null
    },
    {
        id: 'sherkhan_70', name: 'Мұртаза Ш.', fullName: 'Шерхан Мұртаза', era: 'soviet',
        birth: '1932', death: '2018', cemetery: 'Кеңсай', city: 'Алматы',
        filter: 'historical', lat: 43.267009, lng: 76.998356, photo: null
    },
    {
        id: 'abdizhamil_71', name: 'Нұрпейісов Ә.', fullName: 'Әбдіжәміл Нұрпейісов', era: 'soviet',
        birth: '1924', death: '2022', cemetery: 'Кеңсай', city: 'Алматы',
        filter: 'historical', lat: 43.26762, lng: 76.999851, photo: null
    },
    {
        id: 'qadyr_72', name: 'Мырза Әлі Қ.', fullName: 'Қадыр Мырза Әлі', era: 'soviet',
        birth: '1935', death: '2011', cemetery: 'Кеңсай', city: 'Алматы',
        filter: 'historical', lat: 43.266085, lng: 76.998478, photo: null
    },
    {
        id: 'gerold_73', name: 'Бельгер Г.', fullName: 'Герольд Бельгер', era: 'soviet',
        birth: '1934', death: '2015', cemetery: 'Кеңсай (христ. бөлім)', city: 'Алматы',
        filter: 'historical', lat: 43.266518, lng: 76.999353, photo: null
    },
    {
        id: 'shamshi_74', name: 'Қалдаяқов Ш.', fullName: 'Шәмші Қалдаяқов', era: 'soviet',
        birth: '1930', death: '1992', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.265884, lng: 76.997652, photo: null
    },
    {
        id: 'nurgisa_75', name: 'Тілендиев Н.', fullName: 'Нұрғиса Тілендиев', era: 'soviet',
        birth: '1925', death: '1998', cemetery: 'Отырар', city: 'Түркістан обл',
        filter: 'historical', lat: 43.296968, lng: 68.271036, photo: null
    },
    {
        id: 'ermek_76', name: 'Серкебаев Е.', fullName: 'Ермек Серкебаев', era: 'soviet',
        birth: '1926', death: '2013', cemetery: 'Кеңсай-2', city: 'Алматы',
        filter: 'historical', lat: 43.260776, lng: 77.004259, photo: null
    },
    {
        id: 'shaken_77', name: 'Айманов Ш.', fullName: 'Шәкен Айманов', era: 'soviet',
        birth: '1914', death: '1970', cemetery: 'Орталық қорым', city: 'Алматы',
        filter: 'historical', lat: 43.283791, lng: 76.924224, photo: null
    },
    {
        id: 'roza_b_78', name: 'Бағланова Р.', fullName: 'Роза Бағланова', era: 'soviet',
        birth: '1922', death: '2011', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.266975, lng: 76.998989, photo: null
    },
    {
        id: 'batyrkhan_79', name: 'Шүкенов Б.', fullName: 'Батырхан Шүкенов', era: 'soviet',
        birth: '1962', death: '2015', cemetery: 'Кеңсай-2', city: 'Алматы',
        filter: 'historical', lat: 43.261198, lng: 77.004747, photo: null
    },
    {
        id: 'denis_ten_80', name: 'Тен Д.', fullName: 'Денис Тен', era: 'soviet',
        birth: '1993', death: '2018', cemetery: 'Достық', city: 'Алматы',
        filter: 'almaty', lat: 43.256, lng: 76.928, photo: null
    },
    {
        id: 'kulyash_81', name: 'Байсейітова К.', fullName: 'Күләш Байсейітова', era: 'soviet',
        birth: '1912', death: '1957', cemetery: 'Орталық қорым', city: 'Алматы',
        filter: 'historical', lat: 43.283801, lng: 76.925572, photo: null
    },
    {
        id: 'shara_82', name: 'Жиенқұлова Ш.', fullName: 'Шара Жиенқұлова', era: 'soviet',
        birth: '1912', death: '1991', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.266839, lng: 76.997147, photo: null
    },
    {
        id: 'mukan_83', name: 'Төлебаев М.', fullName: 'Мұқан Төлебаев', era: 'soviet',
        birth: '1913', death: '1960', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.265146, lng: 76.998222, photo: null
    },
    {
        id: 'gaziza_84', name: 'Жұбанова Ғ.', fullName: 'Ғазиза Жұбанова', era: 'soviet',
        birth: '1927', death: '1993', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.266848, lng: 76.998534, photo: null
    },
    {
        id: 'ahmet_zh_85', name: 'Жұбанов А.', fullName: 'Ахмет Жұбанов', era: 'soviet',
        birth: '1906', death: '1968', cemetery: 'Орталық қорым', city: 'Алматы',
        filter: 'historical', lat: 43.282429, lng: 76.92408, photo: null
    },
    {
        id: 'biken_86', name: 'Римова Б.', fullName: 'Бикен Римова', era: 'soviet',
        birth: '1923', death: '2000', cemetery: 'Кеңсай', city: 'Алматы',
        filter: 'historical', lat: 43.266204, lng: 76.998797, photo: null
    },
    {
        id: 'akseleu_87', name: 'Сейдімбек А.', fullName: 'Ақселеу Сейдімбек', era: 'soviet',
        birth: '1942', death: '2009', cemetery: 'Ұлттық Пантеон', city: 'Астана',
        filter: 'historical', lat: 51.01132, lng: 71.374445, photo: null
    },
    {
        id: 'oralkhan_88', name: 'Бөкей О.', fullName: 'Оралхан Бөкей', era: 'soviet',
        birth: '1943', death: '1993', cemetery: 'Кеңсай', city: 'Алматы',
        filter: 'historical', lat: 43.266147, lng: 76.999576, photo: null
    },
    {
        id: 'sarken_89', name: 'Жүнісов С.', fullName: 'Сәкен Жүнісов', era: 'soviet',
        birth: '1934', death: '2006', cemetery: 'Ұлттық Пантеон', city: 'Астана',
        filter: 'historical', lat: 51.011036, lng: 71.37448, photo: null
    },
    {
        id: 'khasen_90', name: 'Оралтай Х.', fullName: 'Хасен Оралтай', era: 'soviet',
        birth: '1933', death: '2010', cemetery: 'Мюнхен', city: 'Германия',
        filter: 'historical', lat: 48.1351, lng: 11.582, photo: null
    },
    {
        id: 'anuar_91', name: 'Әлімжанов Ә.', fullName: 'Әнуар Әлімжанов',
        birth: '1930', death: '1993', cemetery: 'Орталық қорым', city: 'Алматы',
        filter: 'historical', lat: 43.282253, lng: 76.922774, photo: null
    },
    {
        id: 'kabdesh_92', name: 'Жұмаділов Қ.', fullName: 'Қабдеш Жұмаділов',
        birth: '1936', death: '2021', cemetery: 'Кеңсай', city: 'Алматы',
        filter: 'historical', lat: 43.267159, lng: 76.999269, photo: null
    },
    {
        id: 'takhaui_93', name: 'Ахтанов Т.', fullName: 'Тахауи Ахтанов',
        birth: '1923', death: '1994', cemetery: 'Орталық қорым', city: 'Алматы',
        filter: 'historical', lat: 43.28355, lng: 76.92355, photo: null
    },
    {
        id: 'zhumeken_94', name: 'Нәжімеденов Ж.', fullName: 'Жұмекен Нәжімеденов',
        birth: '1935', death: '1983', cemetery: 'Кеңсай', city: 'Алматы',
        filter: 'historical', lat: 43.266538, lng: 76.999906, photo: null
    },
    {
        id: 'khamit_95', name: 'Ерғалиев Х.', fullName: 'Хамит Ерғалиев',
        birth: '1916', death: '1997', cemetery: 'Кеңсай', city: 'Алматы',
        filter: 'historical', lat: 43.267345, lng: 76.998368, photo: null
    },
    {
        id: 'syrbai_96', name: 'Мәуленов С.', fullName: 'Сырбай Мәуленов',
        birth: '1922', death: '1993', cemetery: 'Кеңсай', city: 'Алматы',
        filter: 'historical', lat: 43.267443, lng: 76.99909, photo: null
    },
    {
        id: 'kaltai_97', name: 'Мұхамеджанов Қ.', fullName: 'Қалтай Мұхамеджанов',
        birth: '1928', death: '2001', cemetery: 'Кеңсай', city: 'Алматы',
        filter: 'historical', lat: 43.267487, lng: 76.998924, photo: null
    },
    {
        id: 'zeinolla_98', name: 'Қабдолов З.', fullName: 'Зейнолла Қабдолов',
        birth: '1927', death: '2006', cemetery: 'Кеңсай', city: 'Алматы',
        filter: 'historical', lat: 43.266588, lng: 76.998876, photo: null
    },
    {
        id: 'safuan_99', name: 'Шаймерденов С.', fullName: 'Сафуан Шаймерденов',
        birth: '1922', death: '2007', cemetery: 'Кеңсай', city: 'Алматы',
        filter: 'historical', lat: 43.267962, lng: 76.998112, photo: null
    },
    {
        id: 'askar_100', name: 'Сүлейменов А.', fullName: 'Асқар Сүлейменов',
        birth: '1938', death: '1992', cemetery: 'Кеңсай', city: 'Алматы',
        filter: 'historical', lat: 43.267462, lng: 76.999796, photo: null
    },
    {
        id: 'aghybay_101', name: 'Батыр Ағыбай', fullName: 'Ағыбай батыр',
        birth: '1802', death: '1885', cemetery: 'Шет ауданы', city: 'Қарағанды обл',
        filter: 'historical', lat: 49.928444, lng: 73.081868, photo: null
    },
    {
        id: 'baluan_102', name: 'Шолақ Б.', fullName: 'Балуан Шолақ',
        birth: '1864', death: '1919', cemetery: 'Шу ауданы', city: 'Жамбыл обл',
        filter: 'historical', lat: 42.898741, lng: 71.39765, photo: null
    },
    {
        id: 'khajimukan_103', name: 'Мұңайтпасұлы Қ.', fullName: 'Қажымұқан Мұңайтпасұлы',
        birth: '1871', death: '1948', cemetery: 'Темірлан', city: 'Түркістан обл',
        filter: 'historical', lat: 43.297224, lng: 68.270928, photo: null
    },

    { id: 'al_farabi_104', name: 'Әл-Фараби', fullName: 'Әбу Насыр әл-Фараби', era: 'khanate', birth: '870', death: '950', cemetery: 'Баб әс-Сағир', city: 'Дамаск (Сирия)', filter: 'historical', lat: 33.5068, lng: 36.3031, photo: 'https://upload.wikimedia.org/wikipedia/commons/5/55/Al-Farabi.jpg' },
    { id: 'sultan_baibars_105', name: 'Сұлтан Бейбарыс', fullName: 'Сұлтан Бейбарыс', era: 'medieval', birth: '1223', death: '1277', cemetery: 'Аз-Захирия', city: 'Дамаск (Сирия)', filter: 'historical', lat: 33.5136, lng: 36.3069, photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/%D8%AA%D9%85%D8%AB%D8%A7%D9%84_%D9%84%D9%84%D8%B3%D9%84%D8%B7%D8%A7%D9%86_%D8%A7%D9%84%D8%B8%D8%A7%D9%87%D8%B1_%D8%A8%D9%8A%D8%A8%D8%B1%D8%B3_%28cropped%29.JPG/960px-%D8%AA%D9%85%D8%AB%D8%A7%D9%84_%D9%84%D9%84%D8%B3%D9%84%D8%B7%D8%A7%D9%86_%D8%A7%D9%84%D8%B8%D8%A7%D9%87%D8%B1_%D8%A8%D9%8A%D8%A8%D8%B1%D8%B3_%28cropped%29.JPG' },
    { id: 'smagul_106', name: 'Сәдуақасов С.', fullName: 'Смағұл Сәдуақасов', era: 'soviet', birth: '1900', death: '1933', cemetery: 'Мұсылман зираты', city: 'Астана', filter: 'historical', lat: 51.159292, lng: 71.448004, photo: 'https://upload.wikimedia.org/wikipedia/kk/3/32/Saduaqasov_Smagul.jpg' },
    { id: 'bekzat_107', name: 'Саттарханов Б.', fullName: 'Бекзат Саттарханов', era: 'khanate', birth: '1980', death: '2000', cemetery: 'Түркістан', city: 'Түркістан', filter: 'historical', lat: 43.297408, lng: 68.270647, photo: 'https://upload.wikimedia.org/wikipedia/kk/e/e2/%D0%91%D0%B5%D0%BA%D0%B7%D0%B0%D1%82_%D0%A1%D0%B0%D1%82%D1%82%D0%B0%D1%80%D1%85%D0%B0%D0%BD%D0%BE%D0%B2_%D0%BF%D0%BE%D1%80%D1%82%D1%80%D0%B5%D1%82%D1%96.jpg' },
    { id: 'gani_108', name: 'Мұратбаев Ғ.', fullName: 'Ғани Мұратбаев', era: 'soviet', birth: '1902', death: '1925', cemetery: 'Ваганьковское', city: 'Москва (РФ)', filter: 'historical', lat: 55.768353, lng: 37.54873, photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Kazakhstan_adm_location_map.svg/960px-Kazakhstan_adm_location_map.svg.png' },
    { id: 'kalybek_109', name: 'Қуанышбаев Қ.', fullName: 'Қалыбек Қуанышбаев', era: 'alash', birth: '1893', death: '1968', cemetery: 'Орталық қорым', city: 'Алматы', filter: 'historical', lat: 43.285533, lng: 76.923595, photo: 'https://upload.wikimedia.org/wikipedia/kk/4/4c/%D2%9A%D0%B0%D0%BB%D1%8B%D0%B1%D0%B5%D0%BA_%D2%9A%D1%83%D0%B0%D0%BD%D1%8B%D1%88%D0%B1%D0%B0%D0%B5%D0%B2.jpg' },
    { id: 'kurmanbek_110', name: 'Жандарбеков Қ.', fullName: 'Құрманбек Жандарбеков', era: 'soviet', birth: '1905', death: '1973', cemetery: 'Орталық қорым', city: 'Алматы', filter: 'historical', lat: 43.285995, lng: 76.92437, photo: 'https://upload.wikimedia.org/wikipedia/kk/c/c2/%D2%9A%D2%B1%D1%80%D0%BC%D0%B0%D0%BD%D0%B1%D0%B5%D0%BA_%D0%96%D0%B0%D0%BD%D0%B4%D0%B0%D1%80%D0%B1%D0%B5%D0%BA%D0%BE%D0%B2.jpg' },
    { id: 'shafik_111', name: 'Шөкин Ш.', fullName: 'Шапық Шөкин', era: 'soviet', birth: '1912', death: '2003', cemetery: 'Кеңсай-1', city: 'Алматы', filter: 'historical', lat: 43.266746, lng: 76.998005, photo: null },
    { id: 'patoliy_112', name: 'Храпатый А.', fullName: 'Анатолий Храпатый', era: 'soviet', birth: '1963', death: '2008', cemetery: 'Астана', city: 'Астана', filter: 'historical', lat: 51.15931, lng: 71.448174, photo: 'https://upload.wikimedia.org/wikipedia/kk/3/37/Hrap.jpg' },
    { id: 'kashagan_113', name: 'Күржіманұлы Қ.', fullName: 'Қашаған Күржіманұлы', era: 'alash', birth: '1841', death: '1929', cemetery: 'Хиуа', city: 'Хорезм (Узб)', filter: 'historical', lat: 41.37, lng: 60.36, photo: null },
    { id: 'zhahansha_114', name: 'Досмұхамедов Ж.', fullName: 'Жаһанша Досмұхамедов', era: 'alash', birth: '1887', death: '1938', cemetery: 'Бутово', city: 'Москва (РФ)', filter: 'historical', lat: 55.533, lng: 37.595, photo: 'https://upload.wikimedia.org/wikipedia/commons/8/80/%D0%96%D0%B0%D0%BD%D1%88%D0%B0_%D0%94%D0%BE%D1%81%D0%BC%D1%83%D1%85%D0%B0%D0%BC%D0%B5%D0%B4%D0%BE%D0%B2%2C_1920_%D0%B3%D0%BE%D0%B4.jpg' },
    { id: 'khalifa_115', name: 'Алтай Х.', fullName: 'Халифа Алтай', era: 'soviet', birth: '1931', death: '2003', cemetery: 'Кеңсай', city: 'Алматы', filter: 'historical', lat: 43.266735, lng: 76.999844, photo: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Altay-Sayan_map_ru.png' },
    { id: 'makhambet_116', name: 'Махамбет Б.', fullName: 'Бибол Махамбет', era: 'alash', birth: '1889', death: '1930', cemetery: 'Қызылорда', city: 'Қызылорда', filter: 'historical', lat: 44.849286, lng: 65.499038, photo: 'https://upload.wikimedia.org/wikipedia/kk/0/02/%D0%9C%D0%B0%D1%85%D0%B0%D0%BC%D0%B1%D0%B5%D1%82_%D0%B1%D0%B0%D1%82%D1%8B%D1%80.jpg' },
    { id: 'salqam_117', name: 'Жәңгір хан', fullName: 'Салқам Жәңгір хан', era: 'khanate', birth: '1610', death: '1652', cemetery: 'Мавзолей Яссауи', city: 'Түркістан', filter: 'historical', lat: 43.297355, lng: 68.270635, photo: 'https://upload.wikimedia.org/wikipedia/commons/6/64/%D0%A1%D0%B0%D0%BB%D2%9B%D0%B0%D0%BC_%D0%96%D3%99%D2%A3%D0%B3%D1%96%D1%80_%D1%85%D0%B0%D0%BD.jpg' },
    { id: 'nura_new_87', name: 'Нұралы хан', fullName: 'Нұралы хан', era: 'khanate', birth: '1710', death: '1790', cemetery: 'Уфа', city: 'РФ', filter: 'historical', lat: 54.7388, lng: 55.9721, photo: null },
    { id: 'zhantore_new_88', name: 'Жантөре хан', fullName: 'Жантөре хан', era: 'khanate', birth: '1759', death: '1809', cemetery: 'Орынбор', city: 'РФ', filter: 'historical', lat: 51.7666, lng: 55.1, photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Mean_length_of_kazakh_names_in_letters_in_1920-2021.png/960px-Mean_length_of_kazakh_names_in_letters_in_1920-2021.png' },
    { id: 'karasay_new_89', name: 'Қарасай батыр', fullName: 'Қарасай Алтынайұлы', era: 'khanate', birth: '1598', death: '1671', cemetery: 'Айыртау', city: 'СҚО', filter: 'historical', lat: 54.873362, lng: 69.138037, photo: null },
    { id: 'agyantai_new_90', name: 'Ағынтай батыр', fullName: 'Ағынтай батыр', era: 'khanate', birth: '1599', death: '1672', cemetery: 'Айыртау', city: 'СҚО', filter: 'historical', lat: 54.873353, lng: 69.139712, photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Kazakhstan_adm_location_map.svg/960px-Kazakhstan_adm_location_map.svg.png' },
    { id: 'sauran_new_92', name: 'Сауран батыр', fullName: 'Сауран батыр', era: 'khanate', birth: 'XVIII', death: 'XVIII', cemetery: 'Сауран', city: 'Түркістан обл', filter: 'historical', lat: 43.297866, lng: 68.270992, photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Map_of_the_Kazakh_Khanate.png/960px-Map_of_the_Kazakh_Khanate.png' },
    { id: 'begim_new_93', name: 'Бегім ана', fullName: 'Бегім ана', era: 'soviet', birth: 'XI', death: 'XI', cemetery: 'Арал', city: 'Қызылорда обл', filter: 'historical', lat: 44.849835, lng: 65.499425, photo: 'https://upload.wikimedia.org/wikipedia/kk/3/31/%D0%91%D0%B5%D0%B3%D1%96%D0%BC_%D0%90%D0%BD%D0%B0_%D0%BA%D0%B5%D1%81%D0%B5%D0%BD%D0%B5%D1%81%D1%96.jpg' },
    { id: 'karakhan_new_96', name: 'Қарахан', fullName: 'Қарахан баба', era: 'medieval', birth: 'XI', death: 'XII', cemetery: 'Тараз', city: 'Жамбыл обл', filter: 'historical', lat: 42.899435, lng: 71.397481, photo: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Kingdom_of_Kara-Khanids-_999-1212.png' },
    { id: 'alasha_new_97', name: 'Алаша хан', fullName: 'Алаша хан', era: 'medieval', birth: 'XV', death: 'XV', cemetery: 'Ұлытау', city: 'Ұлытау обл', filter: 'historical', lat: 48.3847, lng: 67.8286, photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Alasha-Khan_Mausoleum-1.jpg/960px-Alasha-Khan_Mausoleum-1.jpg' },
    { id: 'zhoshy_new_98', name: 'Жошы хан', fullName: 'Жошы хан', era: 'medieval', birth: '1182', death: '1227', cemetery: 'Ұлытау', city: 'Ұлытау обл', filter: 'historical', lat: 48.1561, lng: 67.8189, photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Juchi_Khan.JPG/960px-Juchi_Khan.JPG' },
    { id: 'dombaul_new_99', name: 'Домбауыл', fullName: 'Домбауыл', era: 'ancient', birth: 'XIII', death: 'XIII', cemetery: 'Ұлытау', city: 'Ұлытау обл', filter: 'historical', lat: 48.158, lng: 67.82, photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Dombauyl.jpg/960px-Dombauyl.jpg' }
];
