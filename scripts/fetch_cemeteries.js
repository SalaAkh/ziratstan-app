const fs = require('fs');
const https = require('https');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const CEMETERIES_DATA_PATH = path.join(ROOT_DIR, 'cemeteries_data.js');

console.log("Бисмиллях, начинаем сбор данных о кладбищах Казахстана из OpenStreetMap (Overpass API)...");

// Мы ищем все полигоны и точки в Казахстане с landuse=cemetery или amenity=grave_yard
const query = `
  [out:json][timeout:300];
  area["ISO3166-1"="KZ"][admin_level=2]->.searchArea;
  (
    node["landuse"="cemetery"](area.searchArea);
    way["landuse"="cemetery"](area.searchArea);
    relation["landuse"="cemetery"](area.searchArea);
    node["amenity"="grave_yard"](area.searchArea);
    way["amenity"="grave_yard"](area.searchArea);
    relation["amenity"="grave_yard"](area.searchArea);
  );
  out center;
`;

const postData = 'data=' + encodeURIComponent(query);

const options = {
    hostname: 'overpass-api.de',
    port: 443,
    path: '/api/interpreter',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = https.request(options, (res) => {
    let chunks = [];
    res.on('data', (d) => {
        chunks.push(d);
    });

    res.on('end', () => {
        try {
            const body = Buffer.concat(chunks).toString();
            console.log("Ответ получен, размер: " + (body.length / 1024).toFixed(2) + " KB");

            if (!body.startsWith('{')) {
                console.error("Ошибка API (не JSON):", body.substring(0, 500));
                process.exit(1);
            }

            const data = JSON.parse(body);
            const cemeteries = [];

            if (data.elements) {
                data.elements.forEach(el => {
                    let lat = el.lat;
                    let lon = el.lon;

                    if (el.type === 'way' || el.type === 'relation') {
                        lat = el.center ? el.center.lat : null;
                        lon = el.center ? el.center.lon : null;
                    }

                    if (lat && lon) {
                        let name = "Неизвестное кладбище";
                        if (el.tags) {
                            if (el.tags["name:ru"]) name = el.tags["name:ru"];
                            else if (el.tags.name) name = el.tags.name;
                            else if (el.tags["name:kk"]) name = el.tags["name:kk"];
                            else if (el.tags["name:en"]) name = el.tags["name:en"];
                        }

                        cemeteries.push({
                            id: el.id,
                            n: name,
                            lt: parseFloat(lat.toFixed(5)),
                            ln: parseFloat(lon.toFixed(5))
                        });
                    }
                });
            }

            console.log("МашаАллах, найдено кладбищ: " + cemeteries.length);

            const fileContent = 'const CEMETERIES_DATA = ' + JSON.stringify(cemeteries) + ';\n';
            fs.writeFileSync(CEMETERIES_DATA_PATH, fileContent);
            console.log("Данные успешно сохранены в cemeteries_data.js");

        } catch (e) {
            console.error("Ошибка парсинга:", e);
        }
    });
});

req.on('error', (e) => {
    console.error("Ошибка запроса:", e);
});

req.write(postData);
req.end();
