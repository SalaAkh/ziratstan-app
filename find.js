const fs = require('fs');
const content = fs.readFileSync('profiles_data.js', 'utf8');

const objects = [];
const blocks = content.match(/\{[\s\S]*?\}/g);
if (blocks) {
    blocks.forEach(block => {
        const nameMatch = block.match(/fullName:\s*'([^']+)'/);
        const idMatch = block.match(/id:\s*'([^']+)'/);
        if (nameMatch && idMatch) {
            objects.push({ name: nameMatch[1], id: idMatch[1] });
        }
    });
}

const nameMap = new Map();
const toRemove = [];

objects.forEach(obj => {
    const key = obj.name.toLowerCase().trim();
    if (nameMap.has(key)) {
        console.log(`Duplicate found: ${obj.name} -> Keeping ${nameMap.get(key)}, Removing ${obj.id}`);
        toRemove.push(obj.id);
    } else {
        nameMap.set(key, obj.id);
    }
});

console.log('----- IDs TO REMOVE -----');
console.log(toRemove.join(','));
