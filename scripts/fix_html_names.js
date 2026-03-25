const fs = require('fs');
const path = require('path');

const dir = 'd:/User/Desktop/Programms/Ziratstan.kz';

function processFile(filePath) {
    if (!filePath.endsWith('.html')) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Regex to find <input, <select, <textarea tags
    const tagRegex = /<(input|select|textarea)\b([^>]*)>/gi;
    content = content.replace(tagRegex, (match, tag, attrs) => {
        // If it already has a name attribute, leave it
        if (/name\s*=\s*['"]/.test(attrs)) {
            return match;
        }

        // Find the id attribute
        const idMatch = attrs.match(/id\s*=\s*(['"])(.*?)\1/i);
        if (idMatch && idMatch[2]) {
            const idVal = idMatch[2];
            // Add name attribute
            changed = true;
            return `<${tag} name="${idVal}"${attrs}>`;
        }

        return match;
    });

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated:', filePath);
    }
}

function walkDir(currentDirPath) {
    fs.readdirSync(currentDirPath).forEach(function(name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            processFile(filePath);
        } else if (stat.isDirectory() && name !== 'node_modules' && name !== '.git' && name !== '.next') {
            walkDir(filePath);
        }
    });
}

walkDir(dir);
console.log('Done.');
