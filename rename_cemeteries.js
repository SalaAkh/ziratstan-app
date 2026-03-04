const fs = require('fs');
const https = require('https');

// Calculate distance between two lat/lon points
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

const overpassUrl = 'https://overpass-api.de/api/interpreter';
const query = `
[out:json][timeout:120];
area["ISO3166-1"="KZ"][admin_level=2]->.searchArea;
(
  node["place"~"city|town|village|hamlet|suburb"](area.searchArea);
);
out center;
`;

console.log('Fetching populated places from OSM to name unknown cemeteries...');

const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
    }
};

const req = https.request(overpassUrl, options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const places = [];

            json.elements.forEach(el => {
                let name = el.tags.name || el.tags['name:ru'] || el.tags['name:kk'];
                if (name) {
                    places.push({
                        name: name,
                        lat: el.lat,
                        lon: el.lon,
                        type: el.tags.place
                    });
                }
            });

            console.log(`Fetched ${places.length} populated places.`);

            // Now read cemeteries_data.js
            const cemRaw = fs.readFileSync('cemeteries_data.js', 'utf8');
            // format is: const CEMETERIES_DATA = [...];
            const jsonStr = cemRaw.substring(cemRaw.indexOf('['), cemRaw.lastIndexOf(']') + 1);
            const cemeteries = JSON.parse(jsonStr);

            let renamedCount = 0;

            cemeteries.forEach(c => {
                if (c.n === 'Неизвестное кладбище') {
                    let nearestPlace = null;
                    let minDistance = Infinity;

                    for (let i = 0; i < places.length; i++) {
                        let d = getDistanceFromLatLonInKm(c.lt, c.ln, places[i].lat, places[i].lon);
                        if (d < minDistance) {
                            minDistance = d;
                            nearestPlace = places[i];
                        }
                    }

                    if (nearestPlace) {
                        // If the nearest place is reasonably close (e.g. within 20km)
                        if (minDistance <= 25) {
                            c.n = `Кладбище (вблизи ${nearestPlace.name})`;
                            renamedCount++;
                        }
                    }
                }
            });

            console.log(`Renamed ${renamedCount} unnamed cemeteries using nearest places.`);

            const newJsContent = 'const CEMETERIES_DATA = ' + JSON.stringify(cemeteries) + ';\n';
            fs.writeFileSync('cemeteries_data.js', newJsContent);
            console.log('Updated cemeteries_data.js');

        } catch (e) {
            console.error('Error parsing response:', e.message);
        }
    });
});

req.on('error', (e) => {
    console.error('Request error:', e.message);
});

req.write('data=' + encodeURIComponent(query));
req.end();
