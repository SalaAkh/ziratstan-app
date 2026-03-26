/* eslint-disable */
const fs = require('fs');
const path = require('path');

const dir = 'd:/User/Desktop/Programms/Ziratstan.kz';

function findBadInputs(filePath) {
    if (!filePath.endsWith('.html')) return;
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Very basic tag finding for single-line tags
        const matches = line.match(/<(input|select|textarea)[^>]*>/gi);
        if (matches) {
            matches.forEach(match => {
                const hasId = /id=['"]([^'"]+)['"]/i.test(match);
                const hasName = /name=['"]([^'"]+)['"]/i.test(match);
                if (!hasId && !hasName) {
                    console.log(`[ID/NAME MISSING] ${filePath}:${i+1} -> ${match}`);
                }
                const hasAriaLabel = /aria-label=['"]/.test(match);
                const idMatch = match.match(/id=['"]([^'"]+)['"]/i);
                
                // Extremely simple heuristic for lack of label
                if (!hasAriaLabel && idMatch) {
                    const id = idMatch[1];
                    // Check if there is a <label for="id"> nearby
                    const hasLabelFor = new RegExp(`<label[^>]*for=['"]${id}['"]`, 'i').test(content);
                    const isInsideLabel = new RegExp(`<label[^>]*>[\\s\\S]*?id=['"]${id}['"][\\s\\S]*?</label>`, 'i').test(content);
                    if (!hasLabelFor && !isInsideLabel) {
                        // console.log(`[LABEL MISSING] ${filePath}:${i+1} -> ${match} (id=${id})`); 
                        // Too noisy right now, let's just flag the missing name/id first.
                    }
                } else if (!hasAriaLabel && !hasId) {
                    console.log(`[LABEL ALMOST CERTAINLY MISSING] ${filePath}:${i+1} -> ${match}`);
                }
            });
        }
    }
}

function walkDir(currentDirPath) {
    fs.readdirSync(currentDirPath).forEach(function(name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            findBadInputs(filePath);
        } else if (stat.isDirectory() && name !== 'node_modules' && name !== '.git' && name !== '.next') {
            walkDir(filePath);
        }
    });
}

walkDir(dir);
console.log('Done scanning.');
