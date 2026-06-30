/**
 * Pagination utility for Mongoose queries
 * @param {Object} query - The query parameters (req.query)
 * @returns {Object} - Pagination details (page, limit, skip)
 */
export const getPagination = (query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip
    };
};

/**
 * Format pagination response
 * @param {Array} data - The data fetched
 * @param {number} total - Total count of documents
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} - Formatted response object
 */
export const formatPaginatedResponse = (data, total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    
    return {
        success: true,
        count: data.length,
        total,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        data
    };
};
