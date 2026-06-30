import { createClient } from 'redis';

let redisClient = null;
let isRedisConnected = false;

// Initialize Redis connection
export const initRedis = async () => {
    try {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        
        redisClient = createClient({
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries) => {
                    // Fail fast - don't retry if Redis is unavailable
                    if (retries > 2) {
                        console.log(' Redis reconnection failed after 2 attempts, disabling Redis cache');
                        return new Error('Max reconnection attempts reached');
                    }
                    const delay = Math.min(retries * 100, 500);
                    console.log(` Redis reconnection attempt ${retries} in ${delay}ms`);
                    return delay;
                },
                connectTimeout: 2000 // 2 second connection timeout
            }
        });

        redisClient.on('error', (err) => {
            console.log(' Redis Client Error:', err.message);
            isRedisConnected = false;
        });

        redisClient.on('connect', () => {
            console.log(' Redis Client Connected');
            isRedisConnected = true;
        });

        redisClient.on('disconnect', () => {
            console.log(' Redis Client Disconnected');
            isRedisConnected = false;
        });

        // Try to connect with timeout
        await Promise.race([
            redisClient.connect(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 3000))
        ]);
        
        isRedisConnected = true;
        console.log(' Redis initialized successfully');
        return true;
    } catch (error) {
        console.log(' Redis initialization failed, running without cache:', error.message);
        isRedisConnected = false;
        return false;
    }
};

// Get Redis client
export const getRedisClient = () => {
    return redisClient;
};

// Check if Redis is connected
export const isRedisAvailable = () => {
    return isRedisConnected && redisClient !== null && process.env.CACHE_DISABLED !== 'true';
};

// Get data from cache
export const getFromCache = async (key) => {
    if (!isRedisAvailable()) {
        return null;
    }
    
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.log(` Error getting cache for key ${key}:`, error.message);
        return null;
    }
};

// Set data in cache
export const setCache = async (key, value, ttl = 3600) => {
    if (!isRedisAvailable()) {
        return false;
    }
    
    try {
        await redisClient.setEx(key, ttl, JSON.stringify(value));
        return true;
    } catch (error) {
        console.log(` Error setting cache for key ${key}:`, error.message);
        return false;
    }
};

// Delete cache by key
export const deleteCache = async (key) => {
    if (!isRedisAvailable()) {
        return false;
    }
    
    try {
        await redisClient.del(key);
        return true;
    } catch (error) {
        console.log(` Error deleting cache for key ${key}:`, error.message);
        return false;
    }
};

// Delete cache by pattern
export const deleteCacheByPattern = async (pattern) => {
    if (!isRedisAvailable()) {
        return false;
    }
    
    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
        return true;
    } catch (error) {
        console.log(` Error deleting cache pattern ${pattern}:`, error.message);
        return false;
    }
};

// Clear all cache
export const clearAllCache = async () => {
    if (!isRedisAvailable()) {
        return false;
    }
    
    try {
        await redisClient.flushAll();
        return true;
    } catch (error) {
        console.log(' Error clearing all cache:', error.message);
        return false;
    }
};

// Close Redis connection
export const closeRedis = async () => {
    if (redisClient) {
        await redisClient.quit();
        isRedisConnected = false;
        console.log(' Redis connection closed');
    }
};

export default {
    initRedis,
    getRedisClient,
    isRedisAvailable,
    getFromCache,
    setCache,
    deleteCache,
    deleteCacheByPattern,
    clearAllCache,
    closeRedis
};
