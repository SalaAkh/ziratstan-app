const fs = require('fs');

const content = fs.readFileSync('profiles_data.js', 'utf8');

// Match all fullName: '...' values
const nameMatches = [...content.matchAll(/fullName:\s*'([^']+)'/g)];
const idMatches = [...content.matchAll(/id:\s*'([^']+)'/g)];

const objects = [];
// Assuming ids and fullNames map 1:1 in order (which they do in this file format)
for (let i = 0; i < nameMatches.length; i++) {
    objects.push({
        id: idMatches[i][1],
        name: nameMatches[i][1]
    });
}

const nameMap = {};
const idsToRemove = [];

for (const obj of objects) {
    const key = obj.name.toLowerCase().trim();
    if (nameMap[key]) {
        idsToRemove.push(obj.id); // Mark the second (or subsequent) one for removal
    } else {
        nameMap[key] = obj;
    }
}

fs.writeFileSync('dupes_to_remove.json', JSON.stringify(idsToRemove, null, 2));

// Create a new version of profiles_data.js
let newContent = content;
const lines = content.split('\n');

let resultLines = [];
let skipMode = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line starts an entry
    let isEntryStart = false;
    let entryId = null;

    const idMatch = line.match(/id:\s*'([^']+)'/);
    if (idMatch) {
        entryId = idMatch[1];
    }

    if (entryId && idsToRemove.includes(entryId)) {
        // If it's a single line entry
        if (line.includes('photo: null }') || line.includes('}')) {
            // Skip this line entirely
            continue;
        } else {
            // It's a multi-line entry starting here
            skipMode = true;
            continue;
        }
    }

    if (skipMode) {
        if (line.includes('},') && !line.includes('id:')) {
            skipMode = false; // End of multi-line entry
        }
        continue;
    }

    resultLines.push(line);
}

fs.writeFileSync('profiles_data_cleaned.js', resultLines.join('\n'));
console.log(`Created profiles_data_cleaned.js with ${idsToRemove.length} duplicates removed!`);
