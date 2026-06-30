import { isRedisAvailable, getFromCache, setCache, deleteCache } from '../config/redis.js';

// Cache middleware for GET requests
export const cacheMiddleware = (ttl = 3600, options = {}) => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Skip caching if Redis is not available
        if (!isRedisAvailable()) {
            console.log('🔍 Redis unavailable, proceeding to database');
            return next();
        }

        const { isPrivate = false } = options;
        
        // Generate cache key from URL and query params
        let cacheKey = `cache:${req.originalUrl || req.url}`;
        
        // If it's a private cache, append user ID to key
        if (isPrivate && req.user && (req.user.id || req.user._id || req.user.email)) {
            const userId = req.user.id || req.user._id || req.user.email;
            cacheKey = `${cacheKey}:user:${userId}`;
        }

        try {
            // Try to get from cache
            const cachedData = await getFromCache(cacheKey);
            
            if (cachedData) {
                console.log(`🚀 Cache HIT: ${cacheKey}`);
                // Add header to indicate cache hit
                res.setHeader('X-Cache', 'HIT');
                return res.json(cachedData);
            }

            console.log(`🔍 Cache MISS: ${cacheKey}`);
            res.setHeader('X-Cache', 'MISS');

            // Store original json method
            const originalJson = res.json.bind(res);

            // Override json method to cache response
            res.json = async function(data) {
                // Only cache successful responses (where success is not explicitly false)
                if (data && data.success !== false) {
                    try {
                        await setCache(cacheKey, data, ttl);
                        console.log(`💾 Cached: ${cacheKey}`);
                    } catch (cacheErr) {
                        console.log(`⚠️ Cache set error (proceeding normally): ${cacheErr.message}`);
                        // Don't throw error, just log and proceed
                    }
                }
                return originalJson(data);
            };

            next();
        } catch (error) {
            console.log('❌ Cache middleware error (proceeding to database):', error.message);
            // Always proceed to database even if cache fails
            next();
        }
    };
};

// Invalidate cache by pattern
export const invalidateCache = async (pattern) => {
    const { deleteCacheByPattern } = await import('../config/redis.js');
    await deleteCacheByPattern(pattern);
};

// Invalidate specific cache key
export const invalidateSpecificCache = async (key) => {
    const { deleteCache } = await import('../config/redis.js');
    await deleteCache(key);
};

// Cache key generators for different entities
export const cacheKeys = {
    // Admin analytics
    analyticsSummary: () => 'cache:analytics:summary',
    analyticsByInstitution: (institution) => `cache:analytics:institution:${institution}`,
    analyticsPapers: () => 'cache:analytics:papers',
    
    // Admin
    allEditors: () => 'cache:admin:editors',
    allUsers: () => 'cache:admin:users',
    dashboardStats: () => 'cache:admin:dashboard-stats',
    conferenceSelectedUsers: () => 'cache:admin:selected-users',
    
    // Admin paper acceptance
    allPendingPapers: () => 'cache:admin:pending-papers',
    
    // Committee
    allMembers: () => 'cache:committee:members',
    memberById: (id) => `cache:committee:member:${id}`,
    
    // Copyright
    authorCopyrightDashboard: (email) => `cache:copyright:dashboard:${email}`,
    allCopyrightForms: () => 'cache:copyright:forms',
    
    // Editor
    assignedPapers: (editorEmail) => `cache:editor:assigned-papers:${editorEmail}`,
    allReviewers: () => 'cache:editor:reviewers',
    paperReviews: (submissionId) => `cache:editor:reviews:${submissionId}`,
    editorDashboardStats: (editorEmail) => `cache:editor:dashboard-stats:${editorEmail}`,
    allPapers: () => 'cache:editor:papers',
    reviewerDetails: (reviewerEmail) => `cache:editor:reviewer:${reviewerEmail}`,
    nonRespondingReviewers: () => 'cache:editor:non-responding',
    revisionStatus: (submissionId) => `cache:editor:revision-status:${submissionId}`,
    paperReReviews: (submissionId) => `cache:editor:re-reviews:${submissionId}`,
    allAcceptedPapers: () => 'cache:editor:accepted-papers',
    acceptedPapersByCategory: (category) => `cache:editor:accepted:${category}`,
    acceptedPapersByAuthor: (authorEmail) => `cache:editor:accepted-author:${authorEmail}`,
    highRatedPapers: () => 'cache:editor:high-rated',
    acceptedPaperDetails: (submissionId) => `cache:editor:paper-details:${submissionId}`,
    acceptanceStatistics: () => 'cache:editor:acceptance-stats',
    
    // Paper
    userSubmission: (submissionId) => `cache:paper:submission:${submissionId}`,
    paperStatus: (submissionId) => `cache:paper:status:${submissionId}`,
    allPapers: () => 'cache:paper:all',
    paperById: (paperId) => `cache:paper:${paperId}`,
    revisionData: (submissionId) => `cache:paper:revision:${submissionId}`,
    allRevisions: () => 'cache:paper:revisions',
    paperHistory: (submissionId) => `cache:paper:history:${submissionId}`,
    
    // Paper count
    paperCounts: () => 'cache:paper:counts',
    
    // Reviewer
    reviewerAssignedPapers: (reviewerEmail) => `cache:reviewer:assigned:${reviewerEmail}`,
    paperForReview: (submissionId) => `cache:reviewer:paper:${submissionId}`,
    reviewDraft: (submissionId) => `cache:reviewer:draft:${submissionId}`,
    reviewerDashboardStats: (reviewerEmail) => `cache:reviewer:dashboard:${reviewerEmail}`,
    rejectionForm: (submissionId) => `cache:reviewer:rejection:${submissionId}`,
    assignmentDetails: (submissionId) => `cache:reviewer:assignment:${submissionId}`,
    
    // Support
    allSupportThreads: () => 'cache:support:threads'
};

// Invalidate all caches for a specific entity type
export const invalidateEntityCache = async (entityType) => {
    const patterns = {
        paper: 'cache:*paper*',
        user: 'cache:*user*',
        editor: 'cache:*editor*',
        reviewer: 'cache:*reviewer*',
        copyright: 'cache:*copyright*',
        committee: 'cache:*committee*',
        analytics: 'cache:*analytics*',
        dashboard: 'cache:*dashboard*'
    };

    const pattern = patterns[entityType];
    if (pattern) {
        await invalidateCache(pattern);
    }
};

export default {
    cacheMiddleware,
    invalidateCache,
    invalidateSpecificCache,
    cacheKeys,
    invalidateEntityCache
};
