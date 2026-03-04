// Ziratstan VIP Profiles Database
const PROFILES_STATIC = [
    {
        id: 'beket_ata_2', name: 'Бекет ата', fullName: 'Бекет Мырзағұлұлы',
        birth: '1750', death: '1813', cemetery: 'Оғланды мешіті', city: 'Маңғыстау',
        filter: 'historical', lat: 43.5936, lng: 54.0677, photo: null
    },
    {
        id: 'korkyt_ata_3', name: 'Қорқыт ата', fullName: 'Қорқыт ата',
        birth: 'VIII', death: 'IX', cemetery: 'Мемориал Қорқыт ата', city: 'Қызылорда',
        filter: 'historical', lat: 44.849279, lng: 65.500233, photo: null
    },
    {
        id: 'abylai_khan_4', name: 'Абылай хан', fullName: 'Абылай (Әбілмансұр) хан',
        birth: '1711', death: '1781', cemetery: 'Мавзолей Яссауи', city: 'Түркістан',
        filter: 'historical', lat: 43.297544, lng: 68.270819, photo: null
    },
    {
        id: 'tauke_khan_5', name: 'Тәуке хан', fullName: 'Тәуке хан',
        birth: '1635', death: '1715', cemetery: 'Мавзолей Яссауи', city: 'Түркістан',
        filter: 'historical', lat: 43.297406, lng: 68.270842, photo: null
    },
    {
        id: 'kasym_khan_6', name: 'Қасым хан', fullName: 'Қасым хан',
        birth: '1445', death: '1521', cemetery: 'Сарайшық көне қаласы', city: 'Атырау',
        filter: 'historical', lat: 47.116265, lng: 51.883812, photo: null
    },
    {
        id: 'zhanibek_khan_7', name: 'Жәнібек хан', fullName: 'Керей мен Жәнібек',
        birth: 'XV', death: 'XV', cemetery: 'Сарайшық көне қаласы', city: 'Атырау',
        filter: 'historical', lat: 47.117124, lng: 51.884271, photo: null
    },
    {
        id: 'tole_bi_8', name: 'Төле би', fullName: 'Төле би Әлібекұлы',
        birth: '1663', death: '1756', cemetery: 'Қарлығаш би кесенесі', city: 'Ташкент (Узб)',
        filter: 'historical', lat: 41.3197, lng: 69.2558, photo: null
    },
    {
        id: 'kazybek_bi_9', name: 'Қазыбек би', fullName: 'Қаз дауысты Қазыбек би',
        birth: '1667', death: '1764', cemetery: 'Мавзолей Яссауи', city: 'Түркістан',
        filter: 'historical', lat: 43.297575, lng: 68.270558, photo: null
    },
    {
        id: 'aiteke_bi_10', name: 'Әйтеке би', fullName: 'Әйтеке би Бәйбекұлы',
        birth: '1644', death: '1700', cemetery: 'Нурата кесенесі', city: 'Нурата (Узб)',
        filter: 'historical', lat: 40.5636, lng: 65.6881, photo: null
    },
    {
        id: 'raiymbek_batyr_11', name: 'Райымбек батыр', fullName: 'Райымбек Түкеұлы',
        birth: '1705', death: '1785', cemetery: 'Кесенесі', city: 'Алматы',
        filter: 'historical', lat: 43.2731, lng: 76.9535, photo: null
    },
    {
        id: 'qabanbay_batyr_12', name: 'Қабанбай батыр', fullName: 'Қаракерей Қабанбай',
        birth: '1692', death: '1770', cemetery: 'Ұлттық Пантеон', city: 'Астана',
        filter: 'historical', lat: 51.011385, lng: 71.373677, photo: null
    },
    {
        id: 'bogenbay_batyr_13', name: 'Бөгенбай батыр', fullName: 'Қанжығалы Бөгенбай',
        birth: '1680', death: '1778', cemetery: 'Ерейментау', city: 'Ақмола обл',
        filter: 'historical', lat: 51.6214, lng: 73.0789, photo: null
    },
    {
        id: 'sirim_datuly_14', name: 'Сырым Датұлы', fullName: 'Сырым Датұлы',
        birth: '1742', death: '1802', cemetery: 'Гюрлен', city: 'Хорезм (Узб)',
        filter: 'historical', lat: 41.8411, lng: 60.3953, photo: null
    },
    {
        id: 'makhambet_15', name: 'Өтемісұлы М.', fullName: 'Махамбет Өтемісұлы',
        birth: '1803', death: '1846', cemetery: 'Индер ауданы', city: 'Атырау',
        filter: 'historical', lat: 47.116296, lng: 51.884958, photo: null
    },
    {
        id: 'isatay_16', name: 'Тайманов И.', fullName: 'Исатай Тайманов',
        birth: '1791', death: '1838', cemetery: 'Қобда ауданы', city: 'Ақтөбе',
        filter: 'historical', lat: 50.285066, lng: 57.168238, photo: null
    },
    {
        id: 'amangeldi_17', name: 'Иманов А.', fullName: 'Амангелді Иманов',
        birth: '1873', death: '1919', cemetery: 'Амангелді ауданы', city: 'Қостанай',
        filter: 'historical', lat: 50.1808, lng: 65.1583, photo: null
    },
    {
        id: 'abai_18', name: 'Құнанбаев А.', fullName: 'Абай Құнанбайұлы',
        birth: '1845', death: '1904', cemetery: 'Жидебай кесенесі', city: 'Абай обл',
        filter: 'historical', lat: 49.12712, lng: 79.323946, photo: null
    },
    {
        id: 'shakarim_19', name: 'Құдайбердіұлы Ш.', fullName: 'Шәкәрім Құдайбердіұлы',
        birth: '1858', death: '1931', cemetery: 'Жидебай кесенесі', city: 'Абай обл',
        filter: 'historical', lat: 49.126642, lng: 79.324386, photo: null
    },
    {
        id: 'chokan_20', name: 'Уәлиханов Ш.', fullName: 'Шоқан Уәлиханов',
        birth: '1835', death: '1865', cemetery: 'Алтынемел', city: 'Жетісу обл',
        filter: 'historical', lat: 44.1167, lng: 78.5333, photo: null
    },
    {
        id: 'altynsarin_21', name: 'Алтынсарин Ы.', fullName: 'Ыбырай Алтынсарин',
        birth: '1841', death: '1889', cemetery: 'Кесенесі', city: 'Қостанай',
        filter: 'historical', lat: 53.1833, lng: 63.6333, photo: null
    },
    {
        id: 'zhambyl_22', name: 'Жабаев Ж.', fullName: 'Жамбыл Жабаев',
        birth: '1846', death: '1945', cemetery: 'Кесенесі', city: 'Алматы обл',
        filter: 'historical', lat: 43.1442, lng: 76.1803, photo: null
    },
    {
        id: 'akhmet_b_23', name: 'Байтұрсынұлы А.', fullName: 'Ахмет Байтұрсынұлы',
        birth: '1872', death: '1937', cemetery: 'Жаңалық (жаппай зират)', city: 'Алматы обл',
        filter: 'historical', lat: 43.440635, lng: 77.172334, photo: null
    },
    {
        id: 'mirzhakyp_24', name: 'Дулатұлы М.', fullName: 'Міржақып Дулатұлы',
        birth: '1885', death: '1935', cemetery: 'Торғай (перезахор.)', city: 'Қостанай обл',
        filter: 'historical', lat: 49.6333, lng: 63.4833, photo: null
    },
    {
        id: 'magzhan_25', name: 'Жұмабаев М.', fullName: 'Мағжан Жұмабаев',
        birth: '1893', death: '1938', cemetery: 'Белгісіз (Жаңалық/Магадан)', city: 'Алматы обл',
        filter: 'historical', lat: 43.440857, lng: 77.171757, photo: null
    },
    {
        id: 'saken_s_26', name: 'Сейфуллин С.', fullName: 'Сәкен Сейфуллин',
        birth: '1894', death: '1938', cemetery: 'Жаңалық (жаппай зират)', city: 'Алматы обл',
        filter: 'historical', lat: 43.44137, lng: 77.171768, photo: null
    },
    {
        id: 'beimbet_27', name: 'Майлин Б.', fullName: 'Бейімбет Майлин',
        birth: '1894', death: '1938', cemetery: 'Жаңалық', city: 'Алматы обл',
        filter: 'historical', lat: 43.441184, lng: 77.171873, photo: null
    },
    {
        id: 'iliyas_zh_28', name: 'Жансүгіров І.', fullName: 'Ілияс Жансүгіров',
        birth: '1894', death: '1938', cemetery: 'Жаңалық', city: 'Алматы обл',
        filter: 'historical', lat: 43.44058, lng: 77.171537, photo: null
    },
    {
        id: 'zhusupbek_29', name: 'Аймауытов Ж.', fullName: 'Жүсіпбек Аймауытов',
        birth: '1889', death: '1930', cemetery: 'Ваганьковское', city: 'Москва (РФ)',
        filter: 'historical', lat: 55.767824, lng: 37.549072, photo: null
    },
    {
        id: 'sultanmahmut_30', name: 'Торайғыров С.', fullName: 'Сұлтанмахмұт Торайғыров',
        birth: '1893', death: '1920', cemetery: 'Баянауыл', city: 'Павлодар обл',
        filter: 'historical', lat: 50.785, lng: 75.6983, photo: null
    },
    {
        id: 'mashhur_31', name: 'Көпейұлы М.Ж.', fullName: 'Мәшһүр Жүсіп Көпейұлы',
        birth: '1858', death: '1931', cemetery: 'Ескелді', city: 'Павлодар обл',
        filter: 'historical', lat: 51.275, lng: 75.385, photo: null
    },
    {
        id: 'kurmangazy_32', name: 'Сағырбайұлы Қ.', fullName: 'Құрманғазы Сағырбайұлы',
        birth: '1818', death: '1896', cemetery: 'Алтынжар', city: 'Астрахань (РФ)',
        filter: 'historical', lat: 46.2553, lng: 48.435, photo: null
    },
    {
        id: 'dauletkerei_33', name: 'Шығайұлы Д.', fullName: 'Дәулеткерей Шығайұлы',
        birth: '1820', death: '1887', cemetery: 'Бөкей ордасы', city: 'БҚО',
        filter: 'historical', lat: 51.232415, lng: 51.365904, photo: null
    },
    {
        id: 'tattimbet_34', name: 'Қазанғапұлы Т.', fullName: 'Тәттімбет Қазанғапұлы',
        birth: '1815', death: '1862', cemetery: 'Қарқаралы', city: 'Қарағанды обл',
        filter: 'historical', lat: 49.928537, lng: 73.081222, photo: null
    },
    {
        id: 'dina_35', name: 'Нұрпейісова Д.', fullName: 'Дина Нұрпейісова',
        birth: '1861', death: '1955', cemetery: 'Орталық қорым', city: 'Алматы',
        filter: 'historical', lat: 43.283009, lng: 76.923578, photo: null
    },
    {
        id: 'akan_seri_36', name: 'Қорамсаұлы А.', fullName: 'Ақан сері',
        birth: '1843', death: '1913', cemetery: 'Көкшетау', city: 'Ақмола обл',
        filter: 'historical', lat: 53.2833, lng: 69.3833, photo: null
    },
    {
        id: 'birzhan_sal_37', name: 'Қожағұлұлы Б.', fullName: 'Біржан сал',
        birth: '1834', death: '1897', cemetery: 'Еңбекшілдер', city: 'Ақмола обл',
        filter: 'historical', lat: 52.8333, lng: 70.0833, photo: null
    },
    {
        id: 'kunayev_38', name: 'Қонаев Д.А.', fullName: 'Дінмұхамед Ахмедұлы Қонаев',
        birth: '1912', death: '1993', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'almaty', lat: 43.266121, lng: 76.997036, photo: null
    },
    {
        id: 'bokeykhan_39', name: 'Бөкейхан Ә.', fullName: 'Әлихан Бөкейхан',
        birth: '1866', death: '1937', cemetery: 'Донское зираты', city: 'Москва (РФ)',
        filter: 'historical', lat: 55.7119, lng: 37.6019, photo: null
    },
    {
        id: 'mustafa_40', name: 'Шоқай М.', fullName: 'Мұстафа Шоқай',
        birth: '1890', death: '1941', cemetery: 'Темпельхоф', city: 'Берлин (Германия)',
        filter: 'historical', lat: 52.4727, lng: 13.4061, photo: null
    },
    {
        id: 'turar_41', name: 'Рысқұлов Т.', fullName: 'Тұрар Рысқұлов',
        birth: '1894', death: '1938', cemetery: 'Коммунарка', city: 'Москва (РФ)',
        filter: 'historical', lat: 55.5786, lng: 37.4561, photo: null
    },
    {
        id: 'oraz_42', name: 'Жандосов О.', fullName: 'Ораз Жандосов',
        birth: '1899', death: '1938', cemetery: 'Жаңалық', city: 'Алматы обл',
        filter: 'historical', lat: 43.441285, lng: 77.171562, photo: null
    },
    {
        id: 'khalel_43', name: 'Досмұхамедұлы Х.', fullName: 'Халел Досмұхамедұлы',
        birth: '1883', death: '1939', cemetery: 'Белгісіз (Воронеж)', city: 'Воронеж (РФ)',
        filter: 'historical', lat: 51.6608, lng: 39.2003, photo: null
    },
    {
        id: 'sanzhar_44', name: 'Асфендияров С.', fullName: 'Санжар Асфендияров',
        birth: '1889', death: '1938', cemetery: 'Жаңалық', city: 'Алматы обл',
        filter: 'historical', lat: 43.441182, lng: 77.172269, photo: null
    },
    {
        id: 'zhumabay_45', name: 'Шаяхметов Ж.', fullName: 'Жұмабай Шаяхметов',
        birth: '1902', death: '1966', cemetery: 'Орталық қорым', city: 'Алматы',
        filter: 'historical', lat: 43.282491, lng: 76.92557, photo: null
    },
    {
        id: 'zhumabek_46', name: 'Тәшенов Ж.', fullName: 'Жұмабек Тәшенов',
        birth: '1915', death: '1986', cemetery: 'Шымкент қаласы', city: 'Шымкент',
        filter: 'historical', lat: 42.3417, lng: 69.5901, photo: null
    },
    {
        id: 'ozbekali_47', name: 'Жәнібеков Ө.', fullName: 'Өзбекәлі Жәнібеков',
        birth: '1931', death: '1998', cemetery: 'Кеңсай', city: 'Алматы',
        filter: 'almaty', lat: 43.267065, lng: 76.998569, photo: null
    },
    {
        id: 'bauyrzhan_48', name: 'Момышұлы Б.', fullName: 'Бауыржан Момышұлы',
        birth: '1910', death: '1982', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.26544, lng: 76.997193, photo: null
    },
    {
        id: 'aliya_49', name: 'Молдағұлова Ә.', fullName: 'Әлия Молдағұлова',
        birth: '1925', death: '1944', cemetery: 'Монаково', city: 'Псков обл (РФ)',
        filter: 'historical', lat: 56.321, lng: 29.9822, photo: null
    },
    {
        id: 'manshuk_50', name: 'Мәметова М.', fullName: 'Мәншүк Мәметова',
        birth: '1922', death: '1943', cemetery: 'Невель', city: 'Псков обл (РФ)',
        filter: 'historical', lat: 56.021, lng: 29.9272, photo: null
    },
    {
        id: 'talgat_51', name: 'Бигелдинов Т.', fullName: 'Талғат Бигелдинов',
        birth: '1922', death: '2014', cemetery: 'Кеңсай-2', city: 'Алматы',
        filter: 'historical', lat: 43.260447, lng: 77.004425, photo: null
    },
    {
        id: 'sagadat_52', name: 'Нұрмағамбетов С.', fullName: 'Сағадат Нұрмағамбетов',
        birth: '1924', death: '2013', cemetery: 'Кеңсай-2', city: 'Алматы',
        filter: 'historical', lat: 43.260071, lng: 77.004373, photo: null
    },
    {
        id: 'rakhymzhan_53', name: 'Қошқарбаев Р.', fullName: 'Рахымжан Қошқарбаев',
        birth: '1924', death: '1988', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.265186, lng: 76.99831, photo: null
    },
    {
        id: 'kasym_54', name: 'Қайсенов Қ.', fullName: 'Қасым Қайсенов',
        birth: '1918', death: '2006', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.266991, lng: 76.998389, photo: null
    },
    {
        id: 'hiuaz_55', name: 'Доспанова Х.', fullName: 'Хиуаз Доспанова',
        birth: '1922', death: '2008', cemetery: 'Атырау қорымы', city: 'Атырау',
        filter: 'historical', lat: 47.116402, lng: 51.884478, photo: null
    },
    {
        id: 'nurken_56', name: 'Әбдіров Н.', fullName: 'Нұркен Әбдіров',
        birth: '1919', death: '1942', cemetery: 'Боковская сп', city: 'Ростов обл (РФ)',
        filter: 'historical', lat: 49.2272, lng: 41.8317, photo: null
    },
    {
        id: 'kanysh_57', name: 'Сәтбаев Қ.', fullName: 'Қаныш Сәтбаев',
        birth: '1899', death: '1964', cemetery: 'Орталық қорым', city: 'Алматы',
        filter: 'historical', lat: 43.282495, lng: 76.924981, photo: null
    },
    {
        id: 'ermukhan_58', name: 'Бекмаханов Е.', fullName: 'Ермұхан Бекмаханов',
        birth: '1915', death: '1966', cemetery: 'Орталық қорым', city: 'Алматы',
        filter: 'historical', lat: 43.285853, lng: 76.923344, photo: null
    },
    {
        id: 'alkei_59', name: 'Марғұлан Ә.', fullName: 'Әлкей Марғұлан',
        birth: '1904', death: '1985', cemetery: 'Орталық қорым', city: 'Алматы',
        filter: 'historical', lat: 43.282061, lng: 76.923661, photo: null
    },
    {
        id: 'evney_60', name: 'Букетов Е.', fullName: 'Евней Букетов',
        birth: '1925', death: '1983', cemetery: 'Қарағанды', city: 'Қарағанды',
        filter: 'historical', lat: 49.92845, lng: 73.083131, photo: null
    },
    {
        id: 'salyk_61', name: 'Зиманов С.', fullName: 'Салық Зиманов',
        birth: '1921', death: '2011', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.265427, lng: 76.99837, photo: null
    },
    {
        id: 'auezov_62', name: 'Әуезов М.', fullName: 'Мұхтар Әуезов',
        birth: '1897', death: '1961', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'almaty', lat: 43.26639, lng: 76.997161, photo: null
    },
    {
        id: 'gabit_63', name: 'Мүсірепов Ғ.', fullName: 'Ғабит Мүсірепов',
        birth: '1902', death: '1985', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.265312, lng: 76.997843, photo: null
    },
    {
        id: 'sabit_64', name: 'Мұқанов С.', fullName: 'Сәбит Мұқанов',
        birth: '1900', death: '1973', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.265891, lng: 76.998281, photo: null
    },
    {
        id: 'iliyas_e_65', name: 'Есенберлин І.', fullName: 'Ілияс Есенберлин',
        birth: '1915', death: '1983', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.266173, lng: 76.998191, photo: null
    },
    {
        id: 'mukagali_66', name: 'Мақатаев М.', fullName: 'Мұқағали Мақатаев',
        birth: '1931', death: '1976', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.26687, lng: 76.997244, photo: null
    },
    {
        id: 'tumanbay_67', name: 'Молдағалиев Т.', fullName: 'Тұманбай Молдағалиев',
        birth: '1935', death: '2011', cemetery: 'Кеңсай', city: 'Алматы',
        filter: 'historical', lat: 43.267839, lng: 76.998838, photo: null
    },
    {
        id: 'fariza_68', name: 'Оңғарсынова Ф.', fullName: 'Фариза Оңғарсынова',
        birth: '1939', death: '2014', cemetery: 'Ұлттық Пантеон', city: 'Астана',
        filter: 'historical', lat: 51.010961, lng: 71.374455, photo: null
    },
    {
        id: 'abish_69', name: 'Кекілбайұлы Ә.', fullName: 'Әбіш Кекілбайұлы',
        birth: '1939', death: '2015', cemetery: 'Ұлттық Пантеон', city: 'Астана',
        filter: 'historical', lat: 51.011162, lng: 71.373506, photo: null
    },
    {
        id: 'sherkhan_70', name: 'Мұртаза Ш.', fullName: 'Шерхан Мұртаза',
        birth: '1932', death: '2018', cemetery: 'Кеңсай', city: 'Алматы',
        filter: 'historical', lat: 43.267009, lng: 76.998356, photo: null
    },
    {
        id: 'abdizhamil_71', name: 'Нұрпейісов Ә.', fullName: 'Әбдіжәміл Нұрпейісов',
        birth: '1924', death: '2022', cemetery: 'Кеңсай', city: 'Алматы',
        filter: 'historical', lat: 43.26762, lng: 76.999851, photo: null
    },
    {
        id: 'qadyr_72', name: 'Мырза Әлі Қ.', fullName: 'Қадыр Мырза Әлі',
        birth: '1935', death: '2011', cemetery: 'Кеңсай', city: 'Алматы',
        filter: 'historical', lat: 43.266085, lng: 76.998478, photo: null
    },
    {
        id: 'gerold_73', name: 'Бельгер Г.', fullName: 'Герольд Бельгер',
        birth: '1934', death: '2015', cemetery: 'Кеңсай (христ. бөлім)', city: 'Алматы',
        filter: 'historical', lat: 43.266518, lng: 76.999353, photo: null
    },
    {
        id: 'shamshi_74', name: 'Қалдаяқов Ш.', fullName: 'Шәмші Қалдаяқов',
        birth: '1930', death: '1992', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.265884, lng: 76.997652, photo: null
    },
    {
        id: 'nurgisa_75', name: 'Тілендиев Н.', fullName: 'Нұрғиса Тілендиев',
        birth: '1925', death: '1998', cemetery: 'Отырар', city: 'Түркістан обл',
        filter: 'historical', lat: 43.296968, lng: 68.271036, photo: null
    },
    {
        id: 'ermek_76', name: 'Серкебаев Е.', fullName: 'Ермек Серкебаев',
        birth: '1926', death: '2013', cemetery: 'Кеңсай-2', city: 'Алматы',
        filter: 'historical', lat: 43.260776, lng: 77.004259, photo: null
    },
    {
        id: 'shaken_77', name: 'Айманов Ш.', fullName: 'Шәкен Айманов',
        birth: '1914', death: '1970', cemetery: 'Орталық қорым', city: 'Алматы',
        filter: 'historical', lat: 43.283791, lng: 76.924224, photo: null
    },
    {
        id: 'roza_b_78', name: 'Бағланова Р.', fullName: 'Роза Бағланова',
        birth: '1922', death: '2011', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.266975, lng: 76.998989, photo: null
    },
    {
        id: 'batyrkhan_79', name: 'Шүкенов Б.', fullName: 'Батырхан Шүкенов',
        birth: '1962', death: '2015', cemetery: 'Кеңсай-2', city: 'Алматы',
        filter: 'historical', lat: 43.261198, lng: 77.004747, photo: null
    },
    {
        id: 'denis_ten_80', name: 'Тен Д.', fullName: 'Денис Тен',
        birth: '1993', death: '2018', cemetery: 'Достық', city: 'Алматы',
        filter: 'almaty', lat: 43.256, lng: 76.928, photo: null
    },
    {
        id: 'kulyash_81', name: 'Байсейітова К.', fullName: 'Күләш Байсейітова',
        birth: '1912', death: '1957', cemetery: 'Орталық қорым', city: 'Алматы',
        filter: 'historical', lat: 43.283801, lng: 76.925572, photo: null
    },
    {
        id: 'shara_82', name: 'Жиенқұлова Ш.', fullName: 'Шара Жиенқұлова',
        birth: '1912', death: '1991', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.266839, lng: 76.997147, photo: null
    },
    {
        id: 'mukan_83', name: 'Төлебаев М.', fullName: 'Мұқан Төлебаев',
        birth: '1913', death: '1960', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.265146, lng: 76.998222, photo: null
    },
    {
        id: 'gaziza_84', name: 'Жұбанова Ғ.', fullName: 'Ғазиза Жұбанова',
        birth: '1927', death: '1993', cemetery: 'Кеңсай-1', city: 'Алматы',
        filter: 'historical', lat: 43.266848, lng: 76.998534, photo: null
    },
    {
        id: 'ahmet_zh_85', name: 'Жұбанов А.', fullName: 'Ахмет Жұбанов',
        birth: '1906', death: '1968', cemetery: 'Орталық қорым', city: 'Алматы',
        filter: 'historical', lat: 43.282429, lng: 76.92408, photo: null
    },
    {
        id: 'biken_86', name: 'Римова Б.', fullName: 'Бикен Римова',
        birth: '1923', death: '2000', cemetery: 'Кеңсай', city: 'Алматы',
        filter: 'historical', lat: 43.266204, lng: 76.998797, photo: null
    },
    {
        id: 'akseleu_87', name: 'Сейдімбек А.', fullName: 'Ақселеу Сейдімбек',
        birth: '1942', death: '2009', cemetery: 'Ұлттық Пантеон', city: 'Астана',
        filter: 'historical', lat: 51.01132, lng: 71.374445, photo: null
    },
    {
        id: 'oralkhan_88', name: 'Бөкей О.', fullName: 'Оралхан Бөкей',
        birth: '1943', death: '1993', cemetery: 'Кеңсай', city: 'Алматы',
        filter: 'historical', lat: 43.266147, lng: 76.999576, photo: null
    },
    {
        id: 'sarken_89', name: 'Жүнісов С.', fullName: 'Сәкен Жүнісов',
        birth: '1934', death: '2006', cemetery: 'Ұлттық Пантеон', city: 'Астана',
        filter: 'historical', lat: 51.011036, lng: 71.37448, photo: null
    },
    {
        id: 'khasen_90', name: 'Оралтай Х.', fullName: 'Хасен Оралтай',
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

    { id: 'al_farabi_104', name: 'Әл-Фараби', fullName: 'Әбу Насыр әл-Фараби', birth: '870', death: '950', cemetery: 'Баб әс-Сағир', city: 'Дамаск (Сирия)', filter: 'historical', lat: 33.5068, lng: 36.3031, photo: null },
    { id: 'sultan_baibars_105', name: 'Сұлтан Бейбарыс', fullName: 'Сұлтан Бейбарыс', birth: '1223', death: '1277', cemetery: 'Аз-Захирия', city: 'Дамаск (Сирия)', filter: 'historical', lat: 33.5136, lng: 36.3069, photo: null },
    { id: 'smagul_106', name: 'Сәдуақасов С.', fullName: 'Смағұл Сәдуақасов', birth: '1900', death: '1933', cemetery: 'Мұсылман зираты', city: 'Астана', filter: 'historical', lat: 51.159292, lng: 71.448004, photo: null },
    { id: 'bekzat_107', name: 'Саттарханов Б.', fullName: 'Бекзат Саттарханов', birth: '1980', death: '2000', cemetery: 'Түркістан', city: 'Түркістан', filter: 'historical', lat: 43.297408, lng: 68.270647, photo: null },
    { id: 'gani_108', name: 'Мұратбаев Ғ.', fullName: 'Ғани Мұратбаев', birth: '1902', death: '1925', cemetery: 'Ваганьковское', city: 'Москва (РФ)', filter: 'historical', lat: 55.768353, lng: 37.54873, photo: null },
    { id: 'kalybek_109', name: 'Қуанышбаев Қ.', fullName: 'Қалыбек Қуанышбаев', birth: '1893', death: '1968', cemetery: 'Орталық қорым', city: 'Алматы', filter: 'historical', lat: 43.285533, lng: 76.923595, photo: null },
    { id: 'kurmanbek_110', name: 'Жандарбеков Қ.', fullName: 'Құрманбек Жандарбеков', birth: '1905', death: '1973', cemetery: 'Орталық қорым', city: 'Алматы', filter: 'historical', lat: 43.285995, lng: 76.92437, photo: null },
    { id: 'shafik_111', name: 'Шөкин Ш.', fullName: 'Шапық Шөкин', birth: '1912', death: '2003', cemetery: 'Кеңсай-1', city: 'Алматы', filter: 'historical', lat: 43.266746, lng: 76.998005, photo: null },
    { id: 'patoliy_112', name: 'Храпатый А.', fullName: 'Анатолий Храпатый', birth: '1963', death: '2008', cemetery: 'Астана', city: 'Астана', filter: 'historical', lat: 51.15931, lng: 71.448174, photo: null },
    { id: 'kashagan_113', name: 'Күржіманұлы Қ.', fullName: 'Қашаған Күржіманұлы', birth: '1841', death: '1929', cemetery: 'Хиуа', city: 'Хорезм (Узб)', filter: 'historical', lat: 41.37, lng: 60.36, photo: null },
    { id: 'zhahansha_114', name: 'Досмұхамедов Ж.', fullName: 'Жаһанша Досмұхамедов', birth: '1887', death: '1938', cemetery: 'Бутово', city: 'Москва (РФ)', filter: 'historical', lat: 55.533, lng: 37.595, photo: null },
    { id: 'khalifa_115', name: 'Алтай Х.', fullName: 'Халифа Алтай', birth: '1931', death: '2003', cemetery: 'Кеңсай', city: 'Алматы', filter: 'historical', lat: 43.266735, lng: 76.999844, photo: null },
    { id: 'makhambet_116', name: 'Махамбет Б.', fullName: 'Бибол Махамбет', birth: '1889', death: '1930', cemetery: 'Қызылорда', city: 'Қызылорда', filter: 'historical', lat: 44.849286, lng: 65.499038, photo: null },
    { id: 'salqam_117', name: 'Жәңгір хан', fullName: 'Салқам Жәңгір хан', birth: '1610', death: '1652', cemetery: 'Мавзолей Яссауи', city: 'Түркістан', filter: 'historical', lat: 43.297355, lng: 68.270635, photo: null },
    { id: 'hakim_118', name: 'Абай Қ. (мүсін)', fullName: 'Абай Құнанбайұлы', birth: '1845', death: '1904', cemetery: 'Жидебай', city: 'Абай обл', filter: 'historical', lat: 49.127218, lng: 79.324074, photo: null },
    { id: 'kuanduk_s_new_0', name: 'Шаңғытбаев Қ.', fullName: 'Қуандық Шаңғытбаев', birth: '1925', death: '2001', cemetery: 'Кеңсай', city: 'Алматы', filter: 'historical', lat: 43.267177, lng: 76.998123, photo: null },
    { id: 'amankeldy_m_new_1', name: 'Мұқанов А.', fullName: 'Аманкелді Мұқанов', birth: '1936', death: '2013', cemetery: 'Орталық қорым', city: 'Алматы', filter: 'historical', lat: 43.285124, lng: 76.923624, photo: null },
    { id: 'sybanbai_new_2', name: 'Сыбанбай Қ.', fullName: 'Қадырбекова Сыбанбай', birth: '1954', death: '2021', cemetery: 'Кеңсай-2', city: 'Алматы', filter: 'historical', lat: 43.260939, lng: 77.004888, photo: null },
    { id: 'ramazan_t_new_3', name: 'Тоқтаров Р.', fullName: 'Рамазан Тоқтаров', birth: '1935', death: '2000', cemetery: 'Кеңсай', city: 'Алматы', filter: 'historical', lat: 43.266809, lng: 76.999807, photo: null },
    { id: 'berdibek_new_4', name: 'Соқпақбаев Б.', fullName: 'Бердібек Соқпақбаев', birth: '1924', death: '1991', cemetery: 'Кеңсай', city: 'Алматы', filter: 'historical', lat: 43.267793, lng: 76.999543, photo: null },
    { id: 'sauranbek_new_5', name: 'Рүстемов С.', fullName: 'Сауранбек Рүстемов', birth: '1940', death: '1999', cemetery: 'Кеңсай', city: 'Алматы', filter: 'historical', lat: 43.266792, lng: 76.999405, photo: null },
    { id: 'shomishbai_new_6', name: 'Сариев Ш.', fullName: 'Шөмішбай Сариев', birth: '1946', death: '2021', cemetery: 'Кеңсай-2', city: 'Алматы', filter: 'historical', lat: 43.261989, lng: 77.004417, photo: null },
    { id: 'marat_k_new_7', name: 'Қабанбай М.', fullName: 'Марат Қабанбай', birth: '1948', death: '2000', cemetery: 'Кеңсай', city: 'Алматы', filter: 'historical', lat: 43.266747, lng: 76.999143, photo: null },
    { id: 'zhuban_m_new_8', name: 'Мулдағалиев Ж.', fullName: 'Жұбан Молдағалиев', birth: '1920', death: '1988', cemetery: 'Кеңсай-1', city: 'Алматы', filter: 'historical', lat: 43.266591, lng: 76.998574, photo: null },
    { id: 'tokash_new_9', name: 'Бокин Т.', fullName: 'Тоқаш Бокин', birth: '1890', death: '1918', cemetery: 'Верный (Алматы)', city: 'Алматы', filter: 'historical', lat: 43.282463, lng: 76.9232, photo: null },
    { id: 'muhametjan_new_10', name: 'Тұймебаев М.', fullName: 'Мұхаметжан Тұймебаев', birth: '1905', death: '1977', cemetery: 'Орталық қорым', city: 'Алматы', filter: 'historical', lat: 43.283198, lng: 76.922459, photo: null },
    { id: 'zhursin_new_11', name: 'Ерман Ж.', fullName: 'Жүрсін Ерман', birth: '1951', death: '', cemetery: 'Әлі тірі (Мәлімет үшін)', city: 'Алматы', filter: 'historical', lat: 43.2389, lng: 76.8897, photo: null },
    { id: 'zhusupbek_e_new_12', name: 'Елебеков Ж.', fullName: 'Жүсіпбек Елебеков', birth: '1904', death: '1977', cemetery: 'Кеңсай-1', city: 'Алматы', filter: 'historical', lat: 43.266136, lng: 76.997285, photo: null },
    { id: 'kalmukan_new_13', name: 'Исабаев Қ.', fullName: 'Қалмұқан Исабаев', birth: '1925', death: '2015', cemetery: 'Кеңсай-2', city: 'Алматы', filter: 'historical', lat: 43.260291, lng: 77.004685, photo: null },
    { id: 'mukhan_new_14', name: 'Лермонтов аудармашысы', fullName: 'Мұқан Половцев', birth: '1891', death: '1937', cemetery: 'Жаңалық', city: 'Алматы обл', filter: 'historical', lat: 43.440767, lng: 77.172264, photo: null },
    { id: 'dauit_new_15', name: 'Байбосынов Д.', fullName: 'Дәуіт Байбосынов', birth: '1805', death: '1888', cemetery: 'Шимкент', city: 'Түркістан обл', filter: 'historical', lat: 43.297402, lng: 68.270532, photo: null },
    { id: 'zhumagali_new_16', name: 'Смағұлов Ж.', fullName: 'Жұмағали Смағұлов', birth: '1928', death: '2003', cemetery: 'Кеңсай', city: 'Алматы', filter: 'historical', lat: 43.266575, lng: 76.999563, photo: null },
    { id: 'temirkhan_new_17', name: 'Медетбек Т.', fullName: 'Темірхан Медетбек', birth: '1945', death: '2023', cemetery: 'Кеңсай-2', city: 'Алматы', filter: 'historical', lat: 43.260737, lng: 77.005053, photo: null },
    { id: 'sauytbek_new_18', name: 'Абдрахманов С.', fullName: 'Сауытбек Абдрахманов', birth: '1951', death: '2022', cemetery: 'Ұлттық Пантеон', city: 'Астана', filter: 'historical', lat: 51.011392, lng: 71.37414, photo: null },
    { id: 'dukengali_new_19', name: 'Тошим Д.', fullName: 'Дүкенғали Тошим', birth: '1914', death: '1983', cemetery: 'Семей', city: 'Абай обл', filter: 'historical', lat: 50.410981, lng: 80.226551, photo: null },
    { id: 'umurzak_new_20', name: 'Сұлтанғазин Ө.', fullName: 'Өмірзақ Сұлтанғазин', birth: '1936', death: '2005', cemetery: 'Кеңсай', city: 'Алматы', filter: 'historical', lat: 43.266637, lng: 76.999062, photo: null },
    { id: 'shapet_new_21', name: 'Қоспанов Ш.', fullName: 'Шәпет Қоспанов', birth: '1914', death: '2006', cemetery: 'Орталық қорым', city: 'Алматы', filter: 'historical', lat: 43.282309, lng: 76.922921, photo: null },
    { id: 'kenzhegali_new_22', name: 'Сағадиев Қ.', fullName: 'Кенжеғали Сағадиев', birth: '1938', death: '2020', cemetery: 'Ұлттық Пантеон', city: 'Астана', filter: 'historical', lat: 51.011072, lng: 71.373763, photo: null },
    { id: 'mukhtar_new_23', name: 'Әлиев М.', fullName: 'Мұхтар Әлиев', birth: '1933', death: '2015', cemetery: 'Кеңсай', city: 'Алматы', filter: 'historical', lat: 43.266538, lng: 76.999379, photo: null },
    { id: 'shafiq_new_24', name: 'Чокин Ш.', fullName: 'Шапық Чокин', birth: '1912', death: '2003', cemetery: 'Кеңсай', city: 'Алматы', filter: 'historical', lat: 43.267285, lng: 76.999888, photo: null },
    { id: 'altynbek_new_25', name: 'Сәрсенбаев А.', fullName: 'Алтынбек Сәрсенбаев', birth: '1962', death: '2006', cemetery: 'Кеңсай-2', city: 'Алматы', filter: 'historical', lat: 43.2608, lng: 77.005071, photo: null },
    { id: 'erkegali_new_26', name: 'Рахмадиев Е.', fullName: 'Еркеғали Рахмадиев', birth: '1932', death: '2013', cemetery: 'Ұлттық Пантеон', city: 'Астана', filter: 'historical', lat: 51.011159, lng: 71.374329, photo: null },
    { id: 'zharas_new_27', name: 'Кекілбай Ж.', fullName: 'Жарас Кекілбай', birth: '1905', death: '1961', cemetery: 'Атырау', city: 'Атырау', filter: 'historical', lat: 47.116398, lng: 51.884538, photo: null },
    { id: 'saken_new_28', name: 'Гумаров С.', fullName: 'Сәкен Ғұмаров', birth: '1937', death: '1995', cemetery: 'Орал', city: 'БҚО', filter: 'historical', lat: 51.23411, lng: 51.367628, photo: null },
    { id: 'tolen_new_29', name: 'Әбдіков Т.', fullName: 'Төлен Әбдіков', birth: '1942', death: '2023', cemetery: 'Кеңсай', city: 'Алматы', filter: 'historical', lat: 43.267219, lng: 76.999357, photo: null },
    { id: 'bakytzhan_new_30', name: 'Момышұлы Б.', fullName: 'Бақытжан Момышұлы', birth: '1941', death: '2012', cemetery: 'Кеңсай-2', city: 'Алматы', filter: 'historical', lat: 43.260273, lng: 77.005105, photo: null },
    { id: 'aman_z_new_31', name: 'Төлеев А.', fullName: 'Аманжол Төлеев (Аман Тулеев)', birth: '1944', death: '2023', cemetery: 'Кемерово', city: 'РФ', filter: 'historical', lat: 55.3333, lng: 86.0833, photo: null },
    { id: 'nartai_new_32', name: 'Бекежанов Н.', fullName: 'Нартай Бекежанов', birth: '1890', death: '1954', cemetery: 'Қызылорда', city: 'Қызылорда', filter: 'historical', lat: 44.849296, lng: 65.500065, photo: null },
    { id: 'kudaibergen_new_33', name: 'Жұбанов Қ.', fullName: 'Құдайберген Жұбанов', birth: '1899', death: '1938', cemetery: 'Жаңалық', city: 'Алматы обл', filter: 'historical', lat: 43.441286, lng: 77.17173, photo: null },
    { id: 'mukhan_a_new_34', name: 'Айтхожин М.', fullName: 'Мұрат Айтхожин', birth: '1939', death: '1987', cemetery: 'Кеңсай', city: 'Алматы', filter: 'historical', lat: 43.267883, lng: 76.998683, photo: null },
    { id: 'shmshiya_new_35', name: 'Токмухамедова Ш.', fullName: 'Шәмшия Бақанова', birth: '1902', death: '1980', cemetery: 'Қарағанды', city: 'Қарағанды', filter: 'historical', lat: 49.929177, lng: 73.081994, photo: null },
    { id: 'kadyr_new_36', name: 'Тыныстанов Қ.', fullName: 'Қасым Тыныстанов', birth: '1901', death: '1938', cemetery: 'Чон-Таш', city: 'Қырғызстан', filter: 'historical', lat: 42.7562, lng: 74.5772, photo: null },
    { id: 'alighan_new_37', name: 'Мусин Ә.', fullName: 'Әлихан Мусин', birth: '1908', death: '1965', cemetery: 'Орталық қорым', city: 'Алматы', filter: 'historical', lat: 43.283146, lng: 76.922276, photo: null },
    { id: 'gulnar_new_38', name: 'Дулатова Г.', fullName: 'Гүлнар Дулатова', birth: '1915', death: '2013', cemetery: 'Кеңсай-2', city: 'Алматы', filter: 'historical', lat: 43.260091, lng: 77.005282, photo: null },
    { id: 'anuar_new_39', name: 'Жолдасбеков Ө.', fullName: 'Өмірбек Жолдасбеков', birth: '1931', death: '1999', cemetery: 'Кеңсай', city: 'Алматы', filter: 'historical', lat: 43.267771, lng: 76.999749, photo: null },
    { id: 'uzakbai_new_40', name: 'Құлымбетов Ұ.', fullName: 'Ұзақбай Құлымбетов', birth: '1891', death: '1938', cemetery: 'Жаңалық', city: 'Алматы обл', filter: 'historical', lat: 43.440522, lng: 77.171598, photo: null },
    { id: 'sultanbek_new_41', name: 'Қожанов С.', fullName: 'Сұлтанбек Қожанов', birth: '1894', death: '1938', cemetery: 'Мәскеу (Коммунарка)', city: 'РФ', filter: 'historical', lat: 55.768464, lng: 37.549447, photo: null },
    { id: 'nigmet_new_42', name: 'Нұрмақов Н.', fullName: 'Нығмет Нұрмақов', birth: '1895', death: '1937', cemetery: 'Мәскеу (Донское)', city: 'РФ', filter: 'historical', lat: 55.76791, lng: 37.548954, photo: null },
    { id: 'shaiman_new_43', name: 'Жайнақов Ш.', fullName: 'Шаймерден Жайнақов', birth: '1884', death: '1932', cemetery: 'Белгісіз (Қызылорда)', city: 'Қызылорда', filter: 'historical', lat: 44.849289, lng: 65.500159, photo: null },
    { id: 'seytqali_new_44', name: 'Меңдешев С.', fullName: 'Сейітқали Меңдешев', birth: '1890', death: '1937', cemetery: 'Алматы (белгісіз)', city: 'Алматы', filter: 'historical', lat: 43.25, lng: 76.9, photo: null },
    { id: 'bakhyt_new_45', name: 'Жақып Б.', fullName: 'Бақыт Жақып', birth: '1912', death: '1940', cemetery: 'Магадан', city: 'РФ', filter: 'historical', lat: 59.5667, lng: 150.8, photo: null },
    { id: 'mustafa_new_46', name: 'Байбатшаев М.', fullName: 'Мұстафа Байбатшаев', birth: '1898', death: '1938', cemetery: 'Жаңалық', city: 'Алматы обл', filter: 'historical', lat: 43.441215, lng: 77.172044, photo: null },
    { id: 'temirbek_new_47', name: 'Жүргенов Т.', fullName: 'Темірбек Жүргенов', birth: '1898', death: '1938', cemetery: 'Жаңалық', city: 'Алматы обл', filter: 'historical', lat: 43.441397, lng: 77.172072, photo: null },
    { id: 'zhalel_new_48', name: 'Қизатов Ж.', fullName: 'Жәлел Қизатов', birth: '1920', death: '1999', cemetery: 'Қызылжар', city: 'СҚО', filter: 'historical', lat: 54.872841, lng: 69.139524, photo: null },
    { id: 'bauyrzhan_a_new_49', name: 'Әбдішев Б.', fullName: 'Бауыржан Әбдішев', birth: '1912', death: '1994', cemetery: 'Қарағанды', city: 'Қарағанды', filter: 'historical', lat: 49.927965, lng: 73.082053, photo: null },
    { id: 'murzakhmet_new_50', name: 'Құлкенов М.', fullName: 'Мырзахмет Құлкенов', birth: '1890', death: '1942', cemetery: 'Гарлык', city: 'Қарақалпақстан', filter: 'historical', lat: 43.8333, lng: 59.8333, photo: null },
    { id: 'makhmud_new_51', name: 'Сыпытай М.', fullName: 'Махмұд Сыпытай', birth: '1802', death: '1868', cemetery: 'Тараз', city: 'Жамбыл обл', filter: 'historical', lat: 42.899145, lng: 71.397255, photo: null },
    { id: 'isbai_new_52', name: 'Тобышақов И.', fullName: 'Ісбай Тобышақов', birth: '1899', death: '1938', cemetery: 'Жаңалық', city: 'Алматы обл', filter: 'historical', lat: 43.441342, lng: 77.171713, photo: null },
    { id: 'bekarys_new_53', name: 'Жандарбек Б.', fullName: 'Бекарыс Жандарбек', birth: '1895', death: '1938', cemetery: 'Жаңалық', city: 'Алматы обл', filter: 'historical', lat: 43.44089, lng: 77.171725, photo: null },
    { id: 'kasim_zh_new_54', name: 'Жантасов Қ.', fullName: 'Қасым Жантасов', birth: '1910', death: '1975', cemetery: 'Алматы', city: 'Алматы', filter: 'historical', lat: 43.271207, lng: 77.00878, photo: null },
    { id: 'zhunis_new_55', name: 'Пұсырманов Ж.', fullName: 'Жүніс Пұсырманов', birth: '1892', death: '1938', cemetery: 'Жаңалық', city: 'Алматы обл', filter: 'historical', lat: 43.440563, lng: 77.17212, photo: null },
    { id: 'zhanai_new_56', name: 'Қаржау Ж.', fullName: 'Жанай Қаржау', birth: '1896', death: '1938', cemetery: 'Жаңалық', city: 'Алматы обл', filter: 'historical', lat: 43.441343, lng: 77.171694, photo: null },
    { id: 'altybay_new_57', name: 'Оңғар А.', fullName: 'Алтыбай Оңғар', birth: '1888', death: '1937', cemetery: 'Жаңалық', city: 'Алматы обл', filter: 'historical', lat: 43.440596, lng: 77.172187, photo: null },
    { id: 'nurtay_new_58', name: 'Нұртазин Н.', fullName: 'Нұртай Нұртазин', birth: '1914', death: '1998', cemetery: 'Ақтөбе', city: 'Ақтөбе', filter: 'historical', lat: 50.285505, lng: 57.167156, photo: null },
    { id: 'shirin_new_59', name: 'Шарапова Ш.', fullName: 'Шырын Шарапова', birth: '1905', death: '1945', cemetery: 'Көкшетау', city: 'Ақмола обл', filter: 'historical', lat: 53.284, lng: 69.384, photo: null },
    { id: 'yermakhan_new_60', name: 'Ибраимов Е.', fullName: 'Ермахан Ибраимов (туысы)', birth: '1900', death: '1960', cemetery: 'Тараз', city: 'Жамбыл обл', filter: 'historical', lat: 42.898277, lng: 71.39582, photo: null },
    { id: 'sabira_new_61', name: 'Майқанова С.', fullName: 'Сәбира Майқанова', birth: '1914', death: '1994', cemetery: 'Орталық қорым', city: 'Алматы', filter: 'historical', lat: 43.28206, lng: 76.924147, photo: null },
    { id: 'khadisha_new_62', name: 'Бөкеева Х.', fullName: 'Хадиша Бөкеева', birth: '1917', death: '2011', cemetery: 'Кеңсай-1', city: 'Алматы', filter: 'historical', lat: 43.265001, lng: 76.998122, photo: null },
    { id: 'farida_new_63', name: 'Шәріпова Ф.', fullName: 'Фарида Шәріпова', birth: '1936', death: '2010', cemetery: 'Кеңсай', city: 'Алматы', filter: 'historical', lat: 43.267581, lng: 76.998078, photo: null },
    { id: 'asanali_new_64', name: 'Әшімов А. (ұлы)', fullName: 'Мәди Әшімов', birth: '1959', death: '1999', cemetery: 'Кеңсай-1', city: 'Алматы', filter: 'historical', lat: 43.266831, lng: 76.997162, photo: null },
    { id: 'saghi_new_65', name: 'Әшімов С.', fullName: 'Сағи Әшімов', birth: '1961', death: '1999', cemetery: 'Кеңсай-1', city: 'Алматы', filter: 'historical', lat: 43.26522, lng: 76.997322, photo: null },
    { id: 'tolen_new_66', name: 'Досмұхамедов Т.', fullName: 'Төлеген Досмұхамедов', birth: '1934', death: '2010', cemetery: 'Қарағанды', city: 'Қарағанды', filter: 'historical', lat: 49.929689, lng: 73.082879, photo: null },
    { id: 'madina_new_67', name: 'Ералиева М.', fullName: 'Мәдина Ералиева', birth: '1954', death: '2000', cemetery: 'Кеңсай-1', city: 'Алматы', filter: 'historical', lat: 43.265571, lng: 76.998798, photo: null },
    { id: 'nurmagambet_new_68', name: 'Әбдіров Н.', fullName: 'Нұрмағамбет Әбдіров', birth: '1923', death: '1980', cemetery: 'Ақмола', city: 'Ақмола обл', filter: 'historical', lat: 51.1, lng: 71.4, photo: null },
    { id: 'kanat_new_69', name: 'Байшолақов Қ.', fullName: 'Қанат Байшолақов', birth: '1961', death: '2011', cemetery: 'Қарағанды', city: 'Қарағанды', filter: 'historical', lat: 49.928908, lng: 73.081564, photo: null },
    { id: 'aman_new_70', name: 'Жамишев А.', fullName: 'Амантай Жамишев', birth: '1940', death: '2015', cemetery: 'Алматы', city: 'Алматы', filter: 'historical', lat: 43.270398, lng: 77.004105, photo: null },
    { id: 'zhanibek_new_71', name: 'Кәрменов Ж.', fullName: 'Жәнібек Кәрменов', birth: '1949', death: '1992', cemetery: 'Алматы', city: 'Алматы', filter: 'historical', lat: 43.269705, lng: 77.004653, photo: null },
    { id: 'meirhan_new_72', name: 'Ақдәулетұлы М.', fullName: 'Мейірхан Ақдәулетұлы', birth: '1949', death: '2022', cemetery: 'Ақтөбе', city: 'Ақтөбе', filter: 'historical', lat: 50.28429, lng: 57.16732, photo: null },
    { id: 'qambar_new_73', name: 'Сарымсақов Қ.', fullName: 'Қамбар Сарымсақов', birth: '1930', death: '2000', cemetery: 'Тараз', city: 'Жамбыл обл', filter: 'historical', lat: 42.899595, lng: 71.397045, photo: null },
    { id: 'nursulu_new_74', name: 'Тапалова Н.', fullName: 'Нұрсұлу Тапалова', birth: '1923', death: '1998', cemetery: 'Орталық', city: 'Алматы', filter: 'historical', lat: 43.284819, lng: 76.924135, photo: null },
    { id: 'asqar_new_75', name: 'Тоқмағамбетов А.', fullName: 'Асқар Тоқмағамбетов', birth: '1905', death: '1983', cemetery: 'Қызылорда', city: 'Қызылорда', filter: 'historical', lat: 44.849235, lng: 65.49976, photo: null },
    { id: 'gali_new_76', name: 'Орманов Ғ.', fullName: 'Ғали Орманов', birth: '1907', death: '1978', cemetery: 'Кеңсай-1', city: 'Алматы', filter: 'historical', lat: 43.266141, lng: 76.997627, photo: null },
    { id: 'bektur_new_77', name: 'Төлегенов Б.', fullName: 'Бектұр Төлегенов', birth: '1912', death: '1989', cemetery: 'Алматы', city: 'Алматы', filter: 'historical', lat: 43.270043, lng: 77.004189, photo: null },
    { id: 'tengiz_new_78', name: 'Бекмаханов Т.', fullName: 'Теңіз Бекмаханов', birth: '1935', death: '2018', cemetery: 'Кеңсай-2', city: 'Алматы', filter: 'historical', lat: 43.260112, lng: 77.004415, photo: null },
    { id: 'nurbek_new_79', name: 'Кенжебек Н.', fullName: 'Нұрбек Кенжебек', birth: '1900', death: '1942', cemetery: 'Ленинград', city: 'РФ', filter: 'historical', lat: 59.9343, lng: 30.3351, photo: null },
    { id: 'sholpan_new_80', name: 'Жандарбекова Ш.', fullName: 'Шолпан Жандарбекова', birth: '1922', death: '2005', cemetery: 'Кеңсай-1', city: 'Алматы', filter: 'historical', lat: 43.26542, lng: 76.997187, photo: null },
    { id: 'kairat_new_81', name: 'Рысқұлбеков Қ.', fullName: 'Қайрат Рысқұлбеков', birth: '1966', death: '1988', cemetery: 'Тараз', city: 'Жамбыл обл', filter: 'historical', lat: 42.898399, lng: 71.395975, photo: null },
    { id: 'erlan_new_82', name: 'Оспанов Е.', fullName: 'Ерлан Оспанов', birth: '1958', death: '2020', cemetery: 'Астана', city: 'Астана', filter: 'historical', lat: 51.159041, lng: 71.447788, photo: null },
    { id: 'shamil_new_83', name: 'Хұсайынов Ш.', fullName: 'Шәміл Хұсайынов', birth: '1924', death: '2010', cemetery: 'Алматы', city: 'Алматы', filter: 'historical', lat: 43.27052, lng: 77.004391, photo: null },
    { id: 'bauka_new_84', name: 'Тукенов Б.', fullName: 'Бауыржан Тукенов', birth: '1940', death: '2015', cemetery: 'Аягөз', city: 'Абай обл', filter: 'historical', lat: 49.127283, lng: 79.324134, photo: null },
    { id: 'kasym_new_85', name: 'Аманжолов Қ.', fullName: 'Қасым Аманжолов', birth: '1911', death: '1955', cemetery: 'Орталық қорым', city: 'Алматы', filter: 'historical', lat: 43.284137, lng: 76.923662, photo: null },
    { id: 'aigul_new_86', name: 'Тәжен А.', fullName: 'Айгүл Тәжен', birth: '1960', death: '2011', cemetery: 'Алматы', city: 'Алматы', filter: 'historical', lat: 43.26937, lng: 77.004398, photo: null },
    { id: 'nura_new_87', name: 'Нұралы хан', fullName: 'Нұралы хан', birth: '1710', death: '1790', cemetery: 'Уфа', city: 'РФ', filter: 'historical', lat: 54.7388, lng: 55.9721, photo: null },
    { id: 'zhantore_new_88', name: 'Жантөре хан', fullName: 'Жантөре хан', birth: '1759', death: '1809', cemetery: 'Орынбор', city: 'РФ', filter: 'historical', lat: 51.7666, lng: 55.1, photo: null },
    { id: 'karasay_new_89', name: 'Қарасай батыр', fullName: 'Қарасай Алтынайұлы', birth: '1598', death: '1671', cemetery: 'Айыртау', city: 'СҚО', filter: 'historical', lat: 54.873362, lng: 69.138037, photo: null },
    { id: 'agyantai_new_90', name: 'Ағынтай батыр', fullName: 'Ағынтай батыр', birth: '1599', death: '1672', cemetery: 'Айыртау', city: 'СҚО', filter: 'historical', lat: 54.873353, lng: 69.139712, photo: null },
    { id: 'alibek_new_91', name: 'Қасымов Ә.', fullName: 'Әлібек Қасымов', birth: '1954', death: '1997', cemetery: 'Алматы', city: 'Алматы', filter: 'historical', lat: 43.270304, lng: 77.00345, photo: null },
    { id: 'sauran_new_92', name: 'Сауран батыр', fullName: 'Сауран батыр', birth: 'XVIII', death: 'XVIII', cemetery: 'Сауран', city: 'Түркістан обл', filter: 'historical', lat: 43.297866, lng: 68.270992, photo: null },
    { id: 'begim_new_93', name: 'Бегім ана', fullName: 'Бегім ана', birth: 'XI', death: 'XI', cemetery: 'Арал', city: 'Қызылорда обл', filter: 'historical', lat: 44.849835, lng: 65.499425, photo: null },
    { id: 'aisha_new_94', name: 'Айша бибі', fullName: 'Айша бибі', birth: 'XII', death: 'XII', cemetery: 'Айша бибі', city: 'Жамбыл обл', filter: 'historical', lat: 42.897889, lng: 71.39632, photo: null },
    { id: 'babazha_new_95', name: 'Бабаджа қатун', fullName: 'Бабаджа қатун', birth: 'XII', death: 'XII', cemetery: 'Айша бибі', city: 'Жамбыл обл', filter: 'historical', lat: 42.89785, lng: 71.396333, photo: null },
    { id: 'karakhan_new_96', name: 'Қарахан', fullName: 'Қарахан баба', birth: 'XI', death: 'XII', cemetery: 'Тараз', city: 'Жамбыл обл', filter: 'historical', lat: 42.899435, lng: 71.397481, photo: null },
    { id: 'alasha_new_97', name: 'Алаша хан', fullName: 'Алаша хан', birth: 'XV', death: 'XV', cemetery: 'Ұлытау', city: 'Ұлытау обл', filter: 'historical', lat: 48.3847, lng: 67.8286, photo: null },
    { id: 'zhoshy_new_98', name: 'Жошы хан', fullName: 'Жошы хан', birth: '1182', death: '1227', cemetery: 'Ұлытау', city: 'Ұлытау обл', filter: 'historical', lat: 48.1561, lng: 67.8189, photo: null },
    { id: 'dombaul_new_99', name: 'Домбауыл', fullName: 'Домбауыл', birth: 'XIII', death: 'XIII', cemetery: 'Ұлытау', city: 'Ұлытау обл', filter: 'historical', lat: 48.158, lng: 67.82, photo: null },

    // ═══════════════════════════════════════════
    // ХАНЫ ҚАЗАҚ ХАНДЫҒЫ — Полный список
    // ═══════════════════════════════════════════
    { id: 'kerey_khan_200', name: 'Керей хан', fullName: 'Керей хан', birth: '1425', death: '1482', cemetery: 'Хантау тауы', city: 'Жамбыл обл', filter: 'historical', lat: 44.05, lng: 69.78, photo: null },
    { id: 'burunduk_khan_201', name: 'Бурундук хан', fullName: 'Бурундук хан', birth: '1474', death: '1513', cemetery: 'Сарайшық (болжамды)', city: 'Атырау обл', filter: 'historical', lat: 47.1163, lng: 51.8838, photo: null },
    { id: 'mamash_khan_202', name: 'Мамаш хан', fullName: 'Мамаш хан', birth: '1495', death: '1522', cemetery: 'Сарайшық (болжамды)', city: 'Атырау обл', filter: 'historical', lat: 47.1165, lng: 51.8845, photo: null },
    { id: 'tahir_khan_203', name: 'Тахир хан', fullName: 'Тахир хан', birth: '1490', death: '1535', cemetery: 'Белгісіз (Моғолстан)', city: 'Түркістан обл', filter: 'historical', lat: 43.30, lng: 68.27, photo: null },
    { id: 'buydash_khan_204', name: 'Буйдаш хан', fullName: 'Буйдаш хан', birth: '1500', death: '1560', cemetery: 'Белгісіз', city: 'Түркістан обл', filter: 'historical', lat: 43.301, lng: 68.271, photo: null },
    { id: 'tugum_khan_205', name: 'Тұғым хан', fullName: 'Тұғым хан', birth: '1495', death: '1537', cemetery: 'Белгісіз (Түркістан маңы)', city: 'Түркістан обл', filter: 'historical', lat: 43.302, lng: 68.272, photo: null },
    { id: 'haknazar_khan_206', name: 'Хақназар хан', fullName: 'Хақназар хан', birth: '1509', death: '1580', cemetery: 'Белгісіз (Түркістан маңы)', city: 'Түркістан обл', filter: 'historical', lat: 43.298, lng: 68.269, photo: null },
    { id: 'shygai_khan_207', name: 'Шығай хан', fullName: 'Шығай хан', birth: '1500', death: '1582', cemetery: 'Мавзолей Яссауи', city: 'Түркістан', filter: 'historical', lat: 43.2974, lng: 68.2709, photo: null },
    { id: 'taukel_khan_208', name: 'Тәуекел хан', fullName: 'Тәуекел хан', birth: '1545', death: '1598', cemetery: 'Түркістан', city: 'Түркістан', filter: 'historical', lat: 43.2975, lng: 68.2712, photo: null },
    { id: 'esim_khan_209', name: 'Есім хан', fullName: 'Есім хан', birth: '1565', death: '1628', cemetery: 'Мавзолей Есім хан', city: 'Түркістан', filter: 'historical', lat: 43.2969, lng: 68.2719, photo: null },
    { id: 'kaiyp_khan_210', name: 'Кайып хан', fullName: 'Кайып хан', birth: '1660', death: '1718', cemetery: 'Белгісіз (Түркістан маңы)', city: 'Түркістан обл', filter: 'historical', lat: 43.299, lng: 68.273, photo: null },
    { id: 'bolat_khan_211', name: 'Болат хан', fullName: 'Болат хан', birth: '1670', death: '1724', cemetery: 'Белгісіз (Түркістан)', city: 'Түркістан', filter: 'historical', lat: 43.2976, lng: 68.2714, photo: null },
    { id: 'sameke_khan_212', name: 'Сәмеке хан', fullName: 'Сәмеке хан', birth: '1685', death: '1737', cemetery: 'Белгісіз (Сарайшық маңы)', city: 'Атырау обл', filter: 'historical', lat: 47.1168, lng: 51.885, photo: null },
    { id: 'abulkhair_khan_213', name: 'Абулхайыр хан', fullName: 'Абулхайыр хан', birth: '1693', death: '1748', cemetery: 'Хан моласы', city: 'Ақтөбе обл', filter: 'historical', lat: 49.9548, lng: 62.8904, photo: null },
    { id: 'uali_khan_214', name: 'Уәли хан', fullName: 'Уәли хан', birth: '1741', death: '1819', cemetery: 'Бұхара маңы', city: 'Бұхара (Өзб)', filter: 'historical', lat: 39.77, lng: 64.42, photo: null },
    { id: 'kenesary_khan_215', name: 'Кенесары хан', fullName: 'Кенесары Қасымұлы', birth: '1802', death: '1847', cemetery: 'Белгісіз (Қырғызстан)', city: 'Бішкек маңы', filter: 'historical', lat: 42.87, lng: 74.59, photo: null },
];
