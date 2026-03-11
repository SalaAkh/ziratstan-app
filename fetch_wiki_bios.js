const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT_DIR = path.resolve(__dirname, '..');
const profilesPath = path.join(ROOT_DIR, 'profiles_data.js');
let profilesContent = fs.readFileSync(profilesPath, 'utf8');

let profiles = [];
try {
    const functionBody = profilesContent + '\nreturn PROFILES_STATIC;';
    profiles = new Function(functionBody)();
} catch (e) {
    console.error("Ошибка парсинга profiles_data.js:", e.message);
    process.exit(1);
}

const OUT_DIR = path.join(ROOT_DIR, 'public', 'data', 'profiles');
if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Википедия требует User-Agent
function fetchUrl(urlStr) {
    return new Promise((resolve) => {
        const url = new URL(urlStr);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            headers: {
                'User-Agent': 'ZiratstanBot/1.0 (https://ziratstan.kz; contacts@ziratstan.kz) Node.js'
            }
        };
        https.get(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if(res.statusCode === 200) {
                    resolve(data);
                } else {
                    console.log(`HTTP Error ${res.statusCode} for ${urlStr}`);
                    resolve(null);
                }
            });
        }).on('error', (err) => {
            console.log("Req error:", err.message);
            resolve(null);
        });
    });
}

function fetchWiki(lang, query) {
    return new Promise(async (resolve) => {
        const title = encodeURIComponent(query);
        const url = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&redirects=1&titles=${title}&format=json`;
        
        const data = await fetchUrl(url);
        if (!data) return resolve(null);
        
        try {
            const parsed = JSON.parse(data);
            const pages = parsed.query?.pages || {};
            const pageId = Object.keys(pages)[0];
            
            if (pageId === '-1' || !pages[pageId].extract) {
                // Ищем через search api
                const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${title}&utf8=&format=json`;
                const sData = await fetchUrl(searchUrl);
                if (!sData) return resolve(null);
                
                const sParsed = JSON.parse(sData);
                if (sParsed.query?.search?.length > 0) {
                    const firstTitleOrig = sParsed.query.search[0].title;
                    const firstTitle = encodeURIComponent(firstTitleOrig);
                    const exactUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&redirects=1&titles=${firstTitle}&format=json`;
                    
                    const eData = await fetchUrl(exactUrl);
                    if (!eData) return resolve(null);
                    
                    const eParsed = JSON.parse(eData);
                    const ePages = eParsed.query?.pages || {};
                    const ePageId = Object.keys(ePages)[0];
                    if (ePageId && ePageId !== '-1' && ePages[ePageId].extract) {
                        resolve({
                            extract: ePages[ePageId].extract.replace(/\n+/g, '\n').trim(),
                            url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(firstTitleOrig.replace(/ /g, '_'))}`
                        });
                    } else { resolve(null); }
                } else { resolve(null); }
            } else {
                resolve({
                    extract: pages[pageId].extract.replace(/\n+/g, '\n').trim(),
                    url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(parsed.query.pages[pageId].title.replace(/ /g, '_'))}`
                });
            }
        } catch (e) {
            console.log("Parse error:", e.message);
            resolve(null);
        }
    });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function processProfiles() {
    console.log(`Найдено ${profiles.length} профилей. Начинаем сбор биографий с User-Agent...`);
    
    let filledCount = 0;
    
    for (const [i, p] of profiles.entries()) {
        const id = p.id;
        const outFile = path.join(OUT_DIR, `${id}.json`);
        
        const q1 = p.fullName || p.name;
        
        console.log(`[${i+1}/${profiles.length}] Запрос для: ${q1}`);
        
        let res_kk = await fetchWiki('kk', q1);
        if (!res_kk) res_kk = await fetchWiki('kk', p.name);
        
        let res_ru = await fetchWiki('ru', q1);
        if (!res_ru) res_ru = await fetchWiki('ru', p.name);
        
        if (res_kk || res_ru) filledCount++;
        
        const existingPhotos = [];
        const existingVideo = null;
        
        const extendedProfile = {
            ...p,
            bio_kk: res_kk ? res_kk.extract : null,
            bio_ru: res_ru ? res_ru.extract : null,
            wiki_link_kk: res_kk ? res_kk.url : null,
            wiki_link_ru: res_ru ? res_ru.url : null,
            photos: existingPhotos,
            video_link: existingVideo
        };
        
        fs.writeFileSync(outFile, JSON.stringify(extendedProfile, null, 2), 'utf8');
        
        // Задержка 200мс
        await sleep(200);
    }
    
    console.log(`Сбор завершен. Заполнено: ${filledCount} профилей из ${profiles.length}. Альхамдулиллях!`);
}

processProfiles();
