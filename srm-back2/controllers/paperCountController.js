import { PaperSubmission } from '../models/Paper.js';

import { withCache } from '../utils/cacheHelper.js';

export const getPaperCounts = async (req, res) => {
    const cacheKey = 'cache:paper:counts';
    
    const result = await withCache(
        cacheKey,
        async () => {
            try {
                const [totalCount, selectedCount] = await Promise.all([
                    PaperSubmission.countDocuments(),
                    (await import('../models/ConferenceSelectedUser.js')).default.countDocuments()
                ]);

                return {
                    success: true,
                    counts: {
                        main: totalCount,
                        multiple: 0,
                        selected: selectedCount,
                        total: totalCount
                    }
                };
            } catch (error) {
                console.error('Error in getPaperCounts callback:', error);
                throw error;
            }
        },
        300 // 5 minutes TTL
    );

    return res.json(result);
};
