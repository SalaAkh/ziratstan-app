const fs = require('fs');
let html = fs.readFileSync('map.html', 'utf8');

const newVips = `
            { id: 'al_farabi_104', name: 'Әл-Фараби', fullName: 'Әбу Насыр әл-Фараби', birth: '870', death: '950', cemetery: 'Баб әс-Сағир', city: 'Дамаск (Сирия)', filter: 'historical', lat: 33.5068, lng: 36.3031, photo: null },
            { id: 'sultan_baibars_105', name: 'Сұлтан Бейбарыс', fullName: 'Сұлтан Бейбарыс', birth: '1223', death: '1277', cemetery: 'Аз-Захирия', city: 'Дамаск (Сирия)', filter: 'historical', lat: 33.5136, lng: 36.3069, photo: null },
            { id: 'smagul_106', name: 'Сәдуақасов С.', fullName: 'Смағұл Сәдуақасов', birth: '1900', death: '1933', cemetery: 'Мұсылман зираты', city: 'Астана', filter: 'historical', lat: 51.1593, lng: 71.4482, photo: null },
            { id: 'bekzat_107', name: 'Саттарханов Б.', fullName: 'Бекзат Саттарханов', birth: '1980', death: '2000', cemetery: 'Түркістан', city: 'Түркістан', filter: 'historical', lat: 43.297, lng: 68.27, photo: null },
            { id: 'gani_108', name: 'Мұратбаев Ғ.', fullName: 'Ғани Мұратбаев', birth: '1902', death: '1925', cemetery: 'Ваганьковское', city: 'Москва (РФ)', filter: 'historical', lat: 55.768, lng: 37.549, photo: null },
            { id: 'kalybek_109', name: 'Қуанышбаев Қ.', fullName: 'Қалыбек Қуанышбаев', birth: '1893', death: '1968', cemetery: 'Орталық қорым', city: 'Алматы', filter: 'historical', lat: 43.285, lng: 76.924, photo: null },
            { id: 'kurmanbek_110', name: 'Жандарбеков Қ.', fullName: 'Құрманбек Жандарбеков', birth: '1905', death: '1973', cemetery: 'Орталық қорым', city: 'Алматы', filter: 'historical', lat: 43.284, lng: 76.923, photo: null },
            { id: 'shafik_111', name: 'Шөкин Ш.', fullName: 'Шапық Шөкин', birth: '1912', death: '2003', cemetery: 'Кеңсай-1', city: 'Алматы', filter: 'historical', lat: 43.266, lng: 76.998, photo: null },
            { id: 'patoliy_112', name: 'Храпатый А.', fullName: 'Анатолий Храпатый', birth: '1963', death: '2008', cemetery: 'Астана', city: 'Астана', filter: 'historical', lat: 51.16, lng: 71.45, photo: null },
            { id: 'kashagan_113', name: 'Күржіманұлы Қ.', fullName: 'Қашаған Күржіманұлы', birth: '1841', death: '1929', cemetery: 'Хиуа', city: 'Хорезм (Узб)', filter: 'historical', lat: 41.37, lng: 60.36, photo: null },
            { id: 'zhahansha_114', name: 'Досмұхамедов Ж.', fullName: 'Жаһанша Досмұхамедов', birth: '1887', death: '1938', cemetery: 'Бутово', city: 'Москва (РФ)', filter: 'historical', lat: 55.533, lng: 37.595, photo: null },
            { id: 'khalifa_115', name: 'Алтай Х.', fullName: 'Халифа Алтай', birth: '1931', death: '2003', cemetery: 'Кеңсай', city: 'Алматы', filter: 'historical', lat: 43.267, lng: 76.999, photo: null },
            { id: 'makhambet_116', name: 'Махамбет Б.', fullName: 'Бибол Махамбет', birth: '1889', death: '1930', cemetery: 'Қызылорда', city: 'Қызылорда', filter: 'historical', lat: 44.84, lng: 65.51, photo: null },
            { id: 'salqam_117', name: 'Жәңгір хан', fullName: 'Салқам Жәңгір хан', birth: '1610', death: '1652', cemetery: 'Мавзолей Яссауи', city: 'Түркістан', filter: 'historical', lat: 43.297, lng: 68.271, photo: null },
            { id: 'hakim_118', name: 'Абай Қ. (мүсін)', fullName: 'Абай Құнанбайұлы', birth: '1845', death: '1904', cemetery: 'Жидебай', city: 'Абай обл', filter: 'historical', lat: 49.127, lng: 79.324, photo: null }
`;

// Insert the new objects right before the closing bracket of PROFILES array
let insertionPoint = html.lastIndexOf('        ];', html.indexOf('let currentFilter'));
if (insertionPoint > -1) {
    html = html.substring(0, insertionPoint) + newVips + html.substring(insertionPoint);
    fs.writeFileSync('map.html', html);
    console.log('Added ' + process.argv[2] + ' new VIPs.');
} else {
    console.log('Could not find PROFILES array end.');
}
