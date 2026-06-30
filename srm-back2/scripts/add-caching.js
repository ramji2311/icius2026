import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache key mappings for each controller
const cacheKeyMappings = {
    'adminAnalyticsController.js': {
        'getAnalyticsSummary': 'cache:analytics:summary',
        'getByInstitution': 'cache:analytics:institution:',
        'getAnalyticsPapers': 'cache:analytics:papers'
    },
    'adminController.js': {
        'getAllEditors': 'cache:admin:editors',
        'getAllUsers': 'cache:admin:users',
        'getDashboardStats': 'cache:admin:dashboard-stats',
        'getConferenceSelectedUsers': 'cache:admin:selected-users'
    },
    'adminPaperAcceptanceController.js': {
        'getAllPendingPapers': 'cache:admin:pending-papers'
    },
    'committeeController.js': {
        'getAllMembers': 'cache:committee:members',
        'getMemberById': 'cache:committee:member:'
    },
    'copyrightController.js': {
        'getAuthorCopyrightDashboard': 'cache:copyright:dashboard:',
        'getAllCopyrightForms': 'cache:copyright:forms'
    },
    'editorController.js': {
        'getAssignedPapers': 'cache:editor:assigned-papers:',
        'getAllReviewers': 'cache:editor:reviewers',
        'getPaperReviews': 'cache:editor:reviews:',
        'getEditorDashboardStats': 'cache:editor:dashboard-stats:',
        'getAllPapers': 'cache:editor:papers',
        'getReviewerDetails': 'cache:editor:reviewer:',
        'getNonRespondingReviewers': 'cache:editor:non-responding',
        'getRevisionStatus': 'cache:editor:revision-status:',
        'getPaperReReviews': 'cache:editor:re-reviews:',
        'getAllAcceptedPapers': 'cache:editor:accepted-papers',
        'getAcceptedPapersByCategory': 'cache:editor:accepted:',
        'getAcceptedPapersByAuthor': 'cache:editor:accepted-author:',
        'getHighRatedPapers': 'cache:editor:high-rated',
        'getAcceptedPaperDetails': 'cache:editor:paper-details:',
        'getAcceptanceStatistics': 'cache:editor:acceptance-stats'
    },
    'paperController.js': {
        'getUserSubmission': 'cache:paper:submission:',
        'getPaperStatus': 'cache:paper:status:',
        'getAllPapers': 'cache:paper:all',
        'getPaperById': 'cache:paper:',
        'getRevisionData': 'cache:paper:revision:',
        'getAllRevisions': 'cache:paper:revisions',
        'getPaperHistory': 'cache:paper:history:'
    },
    'paperCountController.js': {
        'getPaperCounts': 'cache:paper:counts'
    },
    'reviewerController.js': {
        'getAssignedPapers': 'cache:reviewer:assigned:',
        'getPaperForReview': 'cache:reviewer:paper:',
        'getReviewDraft': 'cache:reviewer:draft:',
        'getReviewerDashboardStats': 'cache:reviewer:dashboard:',
        'getRejectionForm': 'cache:reviewer:rejection:',
        'getAssignmentDetails': 'cache:reviewer:assignment:'
    },
    'supportMessageController.js': {
        'getAllSupportThreads': 'cache:support:threads'
    }
};

// Add cache import to file
function addCacheImport(content) {
    if (content.includes("from '../config/redis.js'")) {
        return content; // Already has cache import
    }
    
    // Find the last import statement
    const importRegex = /import.*from ['"]\.\.\/[^'"]+['"];?\n/g;
    const imports = content.match(importRegex);
    
    if (imports) {
        const lastImport = imports[imports.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        const importStatement = `import { withCache } from '../utils/cacheHelper.js';\n`;
        
        return content.slice(0, lastImportIndex + lastImport.length) + importStatement + content.slice(lastImportIndex + lastImport.length);
    }
    
    return content;
}

// Wrap a function with caching
function wrapFunctionWithCache(content, functionName, cacheKeyPattern) {
    const functionRegex = new RegExp(
        `export const ${functionName} = async \\(req, res\\) => {([\\s\\S]*?^};)`,
        'gm'
    );
    
    const match = functionRegex.exec(content);
    if (!match) return content;
    
    const originalFunction = match[0];
    const functionBody = match[1];
    
    // Check if already wrapped
    if (originalFunction.includes('withCache')) {
        return content;
    }
    
    // Create the wrapped version
    const wrappedFunction = `export const ${functionName} = async (req, res) => {
    const cacheKey = '${cacheKeyPattern}';
    
    return await withCache(
        cacheKey,
        async () => {${functionBody}
        },
        3600 // 1 hour TTL
    );
};`;
    
    return content.replace(originalFunction, wrappedFunction);
}

// Process a single controller file
function processController(filePath, fileName) {
    console.log(`Processing ${fileName}...`);
    
    let content = fs.readFileSync(filePath, 'utf-8');
    const mappings = cacheKeyMappings[fileName];
    
    if (!mappings) {
        console.log(`  No cache mappings found for ${fileName}`);
        return;
    }
    
    // Add cache import
    content = addCacheImport(content);
    
    // Wrap each function
    for (const [functionName, cacheKeyPattern] of Object.entries(mappings)) {
        content = wrapFunctionWithCache(content, functionName, cacheKeyPattern);
        console.log(`  ✓ Wrapped ${functionName}`);
    }
    
    // Write back
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✓ Updated ${fileName}`);
}

// Main function
async function main() {
    const controllersDir = path.join(__dirname, '../controllers');
    const controllerFiles = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'));
    
    console.log('Adding Redis caching to all controllers...\n');
    
    for (const file of controllerFiles) {
        if (file === 'authController.js') {
            console.log(`Skipping ${file} (auth-related)`);
            continue;
        }
        
        const filePath = path.join(controllersDir, file);
        processController(filePath, file);
    }
    
    console.log('\n✅ Caching added to all controllers!');
}

main().catch(console.error);
