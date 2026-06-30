import { invalidateEntityCache } from '../middleware/cache.js';
import { connectDatabase } from '../config/database.js';

async function clearCommitteeCache() {
  try {
    await connectDatabase();
    console.log('🗑️  Clearing committee cache...');
    await invalidateEntityCache('committee');
    console.log('✅ Committee cache cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    process.exit(1);
  }
}

clearCommitteeCache();
