import React, { useState, useMemo } from 'react';
import { Search, Filter, X, Users, Star, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Reviewer {
    _id: string;
    name: string;
    username: string;
    email: string;
    expertise: string[];
    assignedPapers: number;
    completedReviews: number;
    pendingReviews: number;
    overdueReviews: number;
    averageRating?: number;
    responseTime?: number; // in hours
    status: 'active' | 'inactive';
    joinedDate: Date;
}

interface ReviewerFilterPanelProps {
    reviewers: Reviewer[];
    selectedReviewer: Reviewer | null;
    onFilterChange: (filtered: Reviewer[]) => void;
    onSelectReviewer: (reviewer: Reviewer) => void;
    onClearSearch: () => void;
}

type ReviewerStatus = 'all' | 'active' | 'inactive' | 'overdue' | 'high-performers';
type SortOption = 'name' | 'assigned' | 'completed' | 'pending' | 'rating' | 'recent';

const ReviewerFilterPanel: React.FC<ReviewerFilterPanelProps> = ({
    reviewers,
    selectedReviewer,
    onFilterChange,
    onSelectReviewer,
    onClearSearch
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<ReviewerStatus>('all');
    const [sortBy, setSortBy] = useState<SortOption>('assigned');
    const [minRating, setMinRating] = useState(0);
    const [expandedFilters, setExpandedFilters] = useState(true);
    const [expertiseFilter, setExpertiseFilter] = useState<string[]>([]);

    // Get all unique expertise areas
    const allExpertise = useMemo(() => {
        const expertise = new Set<string>();
        reviewers.forEach(r => {
            r.expertise?.forEach(e => expertise.add(e));
        });
        return Array.from(expertise).sort();
    }, [reviewers]);

    // Filter reviewers
    const filteredReviewers = useMemo(() => {
        let result = [...reviewers];

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(reviewer =>
                reviewer.name.toLowerCase().includes(query) ||
                reviewer.email.toLowerCase().includes(query) ||
                reviewer.expertise?.some(e => e.toLowerCase().includes(query))
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            if (statusFilter === 'active') {
                result = result.filter(r => r.status === 'active');
            } else if (statusFilter === 'inactive') {
                result = result.filter(r => r.status === 'inactive');
            } else if (statusFilter === 'overdue') {
                result = result.filter(r => r.overdueReviews > 0);
            } else if (statusFilter === 'high-performers') {
                result = result.filter(r => (r.averageRating || 0) >= 4.5 && r.completedReviews >= 5);
            }
        }

        // Rating filter
        if (minRating > 0) {
            result = result.filter(r => (r.averageRating || 0) >= minRating);
        }

        // Expertise filter
        if (expertiseFilter.length > 0) {
            result = result.filter(r =>
                expertiseFilter.some(exp => r.expertise?.includes(exp))
            );
        }

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'assigned':
                    return b.assignedPapers - a.assignedPapers;
                case 'completed':
                    return b.completedReviews - a.completedReviews;
                case 'pending':
                    return b.pendingReviews - a.pendingReviews;
                case 'rating':
                    return (b.averageRating || 0) - (a.averageRating || 0);
                case 'recent':
                    return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
                default:
                    return 0;
            }
        });

        return result;
    }, [reviewers, searchQuery, statusFilter, minRating, expertiseFilter, sortBy]);

    // Update parent with filtered reviewers
    React.useEffect(() => {
        onFilterChange(filteredReviewers);
    }, [filteredReviewers, onFilterChange]);

    // Statistics
    const stats = useMemo(() => {
        const activeCount = reviewers.filter(r => r.status === 'active').length;
        const overdueCount = reviewers.filter(r => r.overdueReviews > 0).length;
        const topPerformersCount = reviewers.filter(r => (r.averageRating || 0) >= 4.5).length;
        const totalReviews = reviewers.reduce((sum, r) => sum + r.completedReviews, 0);

        return {
            total: reviewers.length,
            active: activeCount,
            overdue: overdueCount,
            topPerformers: topPerformersCount,
            totalReviews
        };
    }, [reviewers]);

    const toggleExpertise = (expertise: string) => {
        setExpertiseFilter(prev =>
            prev.includes(expertise)
                ? prev.filter(e => e !== expertise)
                : [...prev, expertise]
        );
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-purple-600" />
                    Reviewers ({filteredReviewers.length})
                </h3>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, expertise..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                onClearSearch();
                            }}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Toggle */}
            <button
                onClick={() => setExpandedFilters(!expandedFilters)}
                className="px-4 py-2 flex items-center gap-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 border-b border-gray-200"
            >
                <Filter className="w-4 h-4" />
                {expandedFilters ? 'Hide Filters' : 'Show Filters'}
            </button>

            {/* Filters */}
            {expandedFilters && (
                <div className="p-4 border-b border-gray-200 space-y-4 bg-gray-50 overflow-y-auto max-h-96">
                    {/* Status Filter */}
                    <div>
                        <label className="text-xs font-semibold text-gray-700 uppercase block mb-2">
                            Status
                        </label>
                        <div className="space-y-2">
                            {[
                                { value: 'all' as const, label: 'All Reviewers' },
                                { value: 'active' as const, label: ' Active' },
                                { value: 'inactive' as const, label: '⭕ Inactive' },
                                { value: 'overdue' as const, label: '⚠️ Has Overdue Reviews' },
                                { value: 'high-performers' as const, label: '⭐ High Performers (4.5+)' }
                            ].map(option => (
                                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="statusFilter"
                                        value={option.value}
                                        checked={statusFilter === option.value}
                                        onChange={(e) => setStatusFilter(e.target.value as ReviewerStatus)}
                                        className="w-4 h-4"
                                    />
                                    <span className="text-sm text-gray-700">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Sort Options */}
                    <div>
                        <label className="text-xs font-semibold text-gray-700 uppercase block mb-2">
                            Sort By
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm bg-white"
                        >
                            <option value="assigned">Most Assigned Papers</option>
                            <option value="completed">Most Completed Reviews</option>
                            <option value="pending">Most Pending Reviews</option>
                            <option value="rating">Highest Rated</option>
                            <option value="name">Name (A-Z)</option>
                            <option value="recent">Recently Joined</option>
                        </select>
                    </div>

                    {/* Minimum Rating Filter */}
                    <div>
                        <label className="text-xs font-semibold text-gray-700 uppercase block mb-2">
                            Minimum Rating: {minRating > 0 ? `${minRating}⭐` : 'All'}
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.5"
                            value={minRating}
                            onChange={(e) => setMinRating(parseFloat(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    {/* Expertise Filter */}
                    {allExpertise.length > 0 && (
                        <div>
                            <label className="text-xs font-semibold text-gray-700 uppercase block mb-2">
                                Expertise Areas ({expertiseFilter.length})
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {allExpertise.map(expertise => (
                                    <button
                                        key={expertise}
                                        onClick={() => toggleExpertise(expertise)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                                            expertiseFilter.includes(expertise)
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        {expertise}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Statistics */}
            <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center">
                        <div className="font-bold text-purple-700">{stats.active}</div>
                        <div className="text-gray-600">Active</div>
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-red-700">{stats.overdue}</div>
                        <div className="text-gray-600">Overdue</div>
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-green-700">{stats.topPerformers}</div>
                        <div className="text-gray-600">Top Performers</div>
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-blue-700">{stats.totalReviews}</div>
                        <div className="text-gray-600">Total Reviews</div>
                    </div>
                </div>
            </div>

            {/* Reviewers List */}
            <div className="flex-1 overflow-y-auto">
                {filteredReviewers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                        <Users className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No reviewers found</p>
                        <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="space-y-2 p-3">
                        {filteredReviewers.map((reviewer) => {
                            const isSelected = selectedReviewer?._id === reviewer._id;
                            const hasOverdue = reviewer.overdueReviews > 0;
                            const isHighPerformer = (reviewer.averageRating || 0) >= 4.5;

                            return (
                                <button
                                    key={reviewer._id}
                                    onClick={() => onSelectReviewer(reviewer)}
                                    className={`w-full p-3 rounded-lg text-left transition-all ${
                                        isSelected
                                            ? 'bg-purple-100 border border-purple-300'
                                            : hasOverdue
                                            ? 'bg-red-50 border border-red-200 hover:bg-red-100'
                                            : isHighPerformer
                                            ? 'bg-green-50 border border-green-200 hover:bg-green-100'
                                            : 'bg-white border border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-gray-800 text-sm">{reviewer.name}</h4>
                                            <p className="text-xs text-gray-500 truncate">{reviewer.email}</p>
                                        </div>
                                        <div className="ml-2 flex items-center gap-1 flex-shrink-0">
                                            {reviewer.status === 'active' ? (
                                                <div className="w-2 h-2 bg-green-500 rounded-full" title="Active" />
                                            ) : (
                                                <div className="w-2 h-2 bg-gray-400 rounded-full" title="Inactive" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Expertise */}
                                    {reviewer.expertise && reviewer.expertise.length > 0 && (
                                        <div className="mb-2 flex flex-wrap gap-1">
                                            {reviewer.expertise.slice(0, 2).map((exp, idx) => (
                                                <span
                                                    key={idx}
                                                    className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full"
                                                >
                                                    {exp}
                                                </span>
                                            ))}
                                            {reviewer.expertise.length > 2 && (
                                                <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full">
                                                    +{reviewer.expertise.length - 2}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Stats */}
                                    <div className="grid grid-cols-4 gap-2 mb-2">
                                        <div className="text-center bg-gray-100 p-1 rounded">
                                            <div className="text-xs font-bold text-gray-800">
                                                {reviewer.assignedPapers}
                                            </div>
                                            <div className="text-xs text-gray-500">Assigned</div>
                                        </div>
                                        <div className="text-center bg-green-100 p-1 rounded">
                                            <div className="text-xs font-bold text-green-800">
                                                {reviewer.completedReviews}
                                            </div>
                                            <div className="text-xs text-gray-500">Completed</div>
                                        </div>
                                        <div className="text-center bg-orange-100 p-1 rounded">
                                            <div className="text-xs font-bold text-orange-800">
                                                {reviewer.pendingReviews}
                                            </div>
                                            <div className="text-xs text-gray-500">Pending</div>
                                        </div>
                                        <div className="text-center bg-red-100 p-1 rounded">
                                            <div className="text-xs font-bold text-red-800">
                                                {reviewer.overdueReviews}
                                            </div>
                                            <div className="text-xs text-gray-500">Overdue</div>
                                        </div>
                                    </div>

                                    {/* Rating and Status */}
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1">
                                            {reviewer.averageRating && (
                                                <>
                                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                    <span className="font-semibold text-gray-700">
                                                        {reviewer.averageRating.toFixed(1)}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-500">
                                            {hasOverdue ? (
                                                <>
                                                    <AlertCircle className="w-3 h-3 text-red-600" />
                                                    <span>Overdue</span>
                                                </>
                                            ) : reviewer.pendingReviews > 0 ? (
                                                <>
                                                    <Clock className="w-3 h-3 text-orange-600" />
                                                    <span>In Progress</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-3 h-3 text-green-600" />
                                                    <span>On Track</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewerFilterPanel;
export type { Reviewer };
