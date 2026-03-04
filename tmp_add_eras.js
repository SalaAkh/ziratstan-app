const fs = require('fs');

const data = fs.readFileSync('profiles_data.js', 'utf8');

let updatedData = data.replace(/\{ id: '([^']+)', name: '([^']+)', fullName: '([^']*)', birth: '([^']*)', death: '([^']*)',(.*?) \}/g, (match, id, name, fullName, birth, death, rest) => {
    // Skip if it already has an era
    if (match.includes("era:")) return match;

    let era = 'soviet'; // default for most modern ones

    // Crude heuristic based on death year or name
    if (death.includes('Х') || death.includes('18') || death.includes('17') || death.includes('16') || death.includes('15')) {
        era = 'khanate'; // 15-19th century basically ханство/батыры
    }

    if (birth.includes('18') && death.includes('19')) {
        era = 'alash'; // 19th-20th century basically alash/enlightenment
    }

    if (death.includes('14') || death.includes('13') || death.includes('12') || death.includes('11')) {
        era = 'medieval';
    }

    // Some specific overrides based on names
    if (name.includes('хан') || name.includes('батыр') || name.includes('би')) era = 'khanate';
    if (name.includes('Абай') || name.includes('Шоқан') || name.includes('Ахмет') || name.includes('Міржақып') || name.includes('Әлихан')) era = 'alash';
    if (name.includes('Қарахан') || name.includes('Айша') || name.includes('Жошы') || name.includes('Алаша')) era = 'medieval';

    return `{ id: '${id}', name: '${name}', fullName: '${fullName}', era: '${era}', birth: '${birth}', death: '${death}',${rest} }`;
});

fs.writeFileSync('profiles_data.js', updatedData);
console.log("Era tags added!");
