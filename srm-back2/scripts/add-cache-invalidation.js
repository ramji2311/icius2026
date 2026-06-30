import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache invalidation mappings for write operations
const invalidationMappings = {
    'adminController.js': {
        'createEditor': ['cache:admin:editors', 'cache:admin:users'],
        'deleteEditor': ['cache:admin:editors', 'cache:admin:users'],
        'assignEditor': ['cache:editor:assigned-papers:*', 'cache:editor:papers']
    },
    'paperController.js': {
        'submitPaper': ['cache:paper:all', 'cache:paper:counts'],
        'updatePaper': ['cache:paper:*'],
        'deletePaper': ['cache:paper:*', 'cache:paper:counts'],
        'submitRevision': ['cache:paper:*', 'cache:editor:revision-status:*']
    },
    'editorController.js': {
        'assignReviewer': ['cache:editor:reviews:*', 'cache:reviewer:assigned:*'],
        'submitReview': ['cache:editor:reviews:*', 'cache:paper:status:*'],
        'updatePaperStatus': ['cache:paper:status:*', 'cache:editor:papers'],
        'acceptPaper': ['cache:editor:accepted-papers', 'cache:editor:accepted:*', 'cache:paper:all'],
        'rejectPaper': ['cache:editor:accepted-papers', 'cache:paper:all']
    },
    'copyrightController.js': {
        'submitCopyright': ['cache:copyright:forms', 'cache:copyright:dashboard:*'],
        'approveCopyright': ['cache:copyright:forms', 'cache:admin:selected-users'],
        'rejectCopyright': ['cache:copyright:forms']
    },
    'committeeController.js': {
        'addMember': ['cache:committee:members'],
        'updateMember': ['cache:committee:members', 'cache:committee:member:*'],
        'deleteMember': ['cache:committee:members']
    },
    'reviewerController.js': {
        'submitReview': ['cache:editor:reviews:*', 'cache:reviewer:draft:*'],
        'updateReview': ['cache:editor:reviews:*']
    }
};

// Add cache invalidation import to file
function addInvalidationImport(content) {
    if (content.includes("invalidatePattern")) {
        return content; // Already has invalidation import
    }
    
    // Find the last import statement
    const importRegex = /import.*from ['"]\.\.\/[^'"]+['"];?\n/g;
    const imports = content.match(importRegex);
    
    if (imports) {
        const lastImport = imports[imports.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        const importStatement = `import { invalidatePattern } from '../utils/cacheHelper.js';\n`;
        
        return content.slice(0, lastImportIndex + lastImport.length) + importStatement + content.slice(lastImportIndex + lastImport.length);
    }
    
    return content;
}

// Add cache invalidation to a function
function addInvalidationToFunction(content, functionName, patterns) {
    const functionRegex = new RegExp(
        `export const ${functionName} = async \\(req, res\\) => {([\\s\\S]*?^};)`,
        'gm'
    );
    
    const match = functionRegex.exec(content);
    if (!match) return content;
    
    const originalFunction = match[0];
    const functionBody = match[1];
    
    // Check if already has invalidation
    if (originalFunction.includes('invalidatePattern')) {
        return content;
    }
    
    // Find the return statement or end of function
    const returnRegex = /return res\.status\([\d]+\)\.json\(([\s\S]*?)\);/g;
    const returnMatch = returnRegex.exec(functionBody);
    
    if (!returnMatch) return content;
    
    const returnStatement = returnMatch[0];
    const returnIndex = returnMatch.index;
    
    // Build invalidation code
    const invalidationCode = patterns.map(pattern => 
        `        await invalidatePattern('${pattern}');`
    ).join('\n');
    
    // Insert invalidation before return
    const newFunctionBody = 
        functionBody.slice(0, returnIndex) +
        invalidationCode + '\n\n' +
        functionBody.slice(returnIndex);
    
    const newFunction = originalFunction.replace(functionBody, newFunctionBody);
    
    return content.replace(originalFunction, newFunction);
}

// Process a single controller file
function processController(filePath, fileName) {
    console.log(`Processing ${fileName}...`);
    
    let content = fs.readFileSync(filePath, 'utf-8');
    const mappings = invalidationMappings[fileName];
    
    if (!mappings) {
        console.log(`  No invalidation mappings found for ${fileName}`);
        return;
    }
    
    // Add invalidation import
    content = addInvalidationImport(content);
    
    // Add invalidation to each function
    for (const [functionName, patterns] of Object.entries(mappings)) {
        content = addInvalidationToFunction(content, functionName, patterns);
        console.log(`  ✓ Added invalidation to ${functionName}`);
    }
    
    // Write back
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✓ Updated ${fileName}`);
}

// Main function
async function main() {
    const controllersDir = path.join(__dirname, '../controllers');
    const controllerFiles = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'));
    
    console.log('Adding cache invalidation to write operations...\n');
    
    for (const file of controllerFiles) {
        if (file === 'authController.js') {
            console.log(`Skipping ${file} (auth-related)`);
            continue;
        }
        
        const filePath = path.join(controllersDir, file);
        processController(filePath, file);
    }
    
    console.log('\n✅ Cache invalidation added to all controllers!');
}

main().catch(console.error);
