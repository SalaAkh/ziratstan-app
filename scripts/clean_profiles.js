const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const file = path.join(ROOT_DIR, 'data', 'profiles_data.js');
let content = fs.readFileSync(file, 'utf8');

const blocks = [...content.matchAll(/\{[\s\S]*?\}/g)];
const nameMap = new Map();
const toRemove = [];

for (const blockMatch of blocks) {
    const block = blockMatch[0];
    const idMatch = block.match(/id:\s*'([^']+)'/);
    const nameMatch = block.match(/fullName:\s*'([^']+)'/);

    if (idMatch && nameMatch) {
        let name = nameMatch[1].toLowerCase().trim();

        if (nameMap.has(name)) {
            toRemove.push(idMatch[1]);
        } else {
            nameMap.set(name, idMatch[1]);
        }
    }
}

// Manually add known typo duplicates
if (toRemove.indexOf('shafiq_new_24') === -1) toRemove.push('shafiq_new_24');

let newContent = content;
let removedCount = 0;
for (const id of toRemove) {
    // regex to match the object. Handles both single-line and multi-line
    const regex = new RegExp(`[ \\t]*\\{[\\s\\S]*?id:\\s*'${id}'[\\s\\S]*?\\},?\\s*\\n?`, 'g');
    if (newContent.match(regex)) {
        newContent = newContent.replace(regex, '');
        removedCount++;
    }
}

fs.writeFileSync(file, newContent);
console.log('Successfully removed ' + removedCount + ' remaining duplicate objects from profiles_data.js');
