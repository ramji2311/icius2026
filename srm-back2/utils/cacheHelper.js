import { getFromCache, setCache, isRedisAvailable } from '../config/redis.js';

/**
 * Caching wrapper for async functions
 * @param {string} cacheKey - The cache key to use
 * @param {Function} dataFetcher - The function to fetch data if cache miss
 * @param {number} ttl - Time to live in seconds (default: 3600 = 1 hour)
 * @returns {Promise<any>} - The cached or fetched data
 */
export const withCache = async (cacheKey, dataFetcher, ttl = 3600) => {
    // If Redis is not available, fetch data directly
    if (!isRedisAvailable()) {
        return await dataFetcher();
    }

    try {
        // Try to get from cache
        const cachedData = await getFromCache(cacheKey);
        
        if (cachedData !== null) {
            console.log(` Cache HIT: ${cacheKey}`);
            return cachedData;
        }

        console.log(` Cache MISS: ${cacheKey}`);
        
        // Fetch fresh data
        const freshData = await dataFetcher();
        
        // Cache the result (only if data exists and is not an error)
        if (freshData && freshData.success !== false) {
            await setCache(cacheKey, freshData, ttl);
        }
        
        return freshData;
    } catch (error) {
        console.log(` Cache error for ${cacheKey}:`, error.message);
        // Fallback to direct fetch on error
        return await dataFetcher();
    }
};

/**
 * Invalidate cache by key
 */
export const invalidate = async (cacheKey) => {
    if (!isRedisAvailable()) {
        return false;
    }
    
    const { deleteCache } = await import('../config/redis.js');
    return await deleteCache(cacheKey);
};

/**
 * Invalidate cache by pattern
 */
export const invalidatePattern = async (pattern) => {
    if (!isRedisAvailable()) {
        return false;
    }
    
    const { deleteCacheByPattern } = await import('../config/redis.js');
    return await deleteCacheByPattern(pattern);
};

export default {
    withCache,
    invalidate,
    invalidatePattern
};
