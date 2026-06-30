import fs from 'fs';
import path from 'path';

const controllersDir = './controllers';

const fixFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern: return await withCache( ... );
    // We need to match the entire call including the nested callback
    // This regex matches "return await withCache(" followed by balanced parentheses
    // However, balanced parens are hard in regex. 
    // We can look for "return await withCache(" and the closing ");" at the same indentation level.
    
    const regex = /return await withCache\([\s\S]*?\);/g;
    
    const newContent = content.replace(regex, (match) => {
        // Find the indentation
        const lines = match.split('\n');
        const indentation = lines[0].match(/^\s*/)[0];
        
        // Remove 'return ' from the start
        const call = match.replace(/^\s*return /, '');
        
        return `${indentation}const result = ${call}\n${indentation}return res.json(result);`;
    });
    
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent);
        console.log(`Fixed: ${filePath}`);
    }
};

const files = fs.readdirSync(controllersDir);
files.forEach(file => {
    if (file.endsWith('.js')) {
        fixFile(path.join(controllersDir, file));
    }
});
