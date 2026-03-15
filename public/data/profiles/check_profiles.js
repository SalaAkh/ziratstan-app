const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

const profiles = [];

for (const f of files) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    profiles.push({
      file: f,
      id: data.id,
      name: data.name,
      fullName: data.fullName,
      hasZhuz: !!data.zhuz,
      hasTribe: !!data.tribe
    });
  } catch (e) {
    console.error(`Error parsing ${f}: ${e.message}`);
  }
}

const pending = profiles.filter(p => !p.hasZhuz);
console.log(`Total: ${profiles.length}`);
console.log(`Updated: ${profiles.filter(p => p.hasZhuz).length}`);
console.log(`Pending: ${pending.length}`);

// Print up to 40 pending ones to process next
console.log("\nNext 40 pending:");
pending.slice(0, 40).forEach(p => console.log(`${p.file} - ${p.fullName || p.name}`));

