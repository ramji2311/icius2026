import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, Clock, CheckCircle, AlertCircle, Zap } from 'lucide-react';

interface SearchFilterPanelProps {
    papers: any[];
    selectedPaper: any | null;
    onFilterChange: (filteredPapers: any[]) => void;
    onSelectPaper: (paper: any) => void;
    onClearSearch: () => void;
}

const SearchFilterPanel: React.FC<SearchFilterPanelProps> = ({
    papers,
    selectedPaper,
    onFilterChange,
    onSelectPaper,
    onClearSearch
}) => {
    const [searchText, setSearchText] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedRating, setSelectedRating] = useState('all');
    const [sortBy, setSortBy] = useState('deadline');
    const [expandedFilters, setExpandedFilters] = useState(true);
    const [filteredPapers, setFilteredPapers] = useState(papers);

    // Get unique categories from papers
    const getCategories = () => {
        const cats = [...new Set(papers.map(p => p.category))].filter(Boolean);
        return cats.sort();
    };

    // Get paper status
    const getPaperStatus = (paper: any) => {
        const deadline = new Date(paper.assignmentDetails?.deadline);
        const now = new Date();
        const daysLeft = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft < 0) return 'overdue';
        if (daysLeft <= 2) return 'urgent';
        return 'pending';
    };

    // Get saved rating for paper
    const getSavedRating = (_paper: any) => {
        // Check if this paper has a saved rating (from localStorage or API)
        // This would come from your review data
        return null; // Or actual rating if available
    };

    // Apply all filters
    useEffect(() => {
        let filtered = papers;

        // Text search (title, author, submission ID)
        if (searchText.trim()) {
            const searchLower = searchText.toLowerCase();
            filtered = filtered.filter(p =>
                p.paperTitle?.toLowerCase().includes(searchLower) ||
                p.authorName?.toLowerCase().includes(searchLower) ||
                p.submissionId?.toLowerCase().includes(searchLower) ||
                p.email?.toLowerCase().includes(searchLower)
            );
        }

        // Status filter
        if (selectedStatus !== 'all') {
            filtered = filtered.filter(p => getPaperStatus(p) === selectedStatus);
        }

        // Category filter
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(p => p.category === selectedCategory);
        }

        // Rating filter (for papers already reviewed)
        if (selectedRating !== 'all') {
            filtered = filtered.filter(p => {
                const rating = getSavedRating(p);
                if (selectedRating === 'reviewed') return rating !== null;
                if (selectedRating === 'pending') return rating === null;
                return true;
            });
        }

        // Sorting
        if (sortBy === 'deadline') {
            filtered.sort((a, b) => {
                const deadlineA = new Date(a.assignmentDetails?.deadline).getTime();
                const deadlineB = new Date(b.assignmentDetails?.deadline).getTime();
                return deadlineA - deadlineB;
            });
        } else if (sortBy === 'status') {
            const statusOrder = { overdue: 0, urgent: 1, pending: 2 };
            filtered.sort((a, b) => statusOrder[getPaperStatus(a) as keyof typeof statusOrder] - statusOrder[getPaperStatus(b) as keyof typeof statusOrder]);
        } else if (sortBy === 'title') {
            filtered.sort((a, b) => a.paperTitle.localeCompare(b.paperTitle));
        } else if (sortBy === 'author') {
            filtered.sort((a, b) => a.authorName.localeCompare(b.authorName));
        }

        setFilteredPapers(filtered);
        onFilterChange(filtered);
    }, [searchText, selectedStatus, selectedCategory, selectedRating, sortBy, papers]);

    const clearAllFilters = () => {
        setSearchText('');
        setSelectedStatus('all');
        setSelectedCategory('all');
        setSelectedRating('all');
        setSortBy('deadline');
        onClearSearch();
    };

    const hasActiveFilters = searchText || selectedStatus !== 'all' || selectedCategory !== 'all' || selectedRating !== 'all';

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'overdue':
                return <AlertCircle className="w-4 h-4 text-red-600" />;
            case 'urgent':
                return <Zap className="w-4 h-4 text-orange-600" />;
            case 'pending':
                return <Clock className="w-4 h-4 text-blue-600" />;
            default:
                return <CheckCircle className="w-4 h-4 text-green-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'overdue':
                return 'bg-red-50 border-red-200';
            case 'urgent':
                return 'bg-orange-50 border-orange-200';
            case 'pending':
                return 'bg-blue-50 border-blue-200';
            default:
                return 'bg-green-50 border-green-200';
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'overdue':
                return 'bg-red-100 text-red-800';
            case 'urgent':
                return 'bg-orange-100 text-orange-800';
            case 'pending':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-green-100 text-green-800';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-4 h-full overflow-y-auto">
            {/* Header */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-gray-600" />
                        <h3 className="font-semibold text-gray-800">Assigned Papers</h3>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                        {filteredPapers.length}/{papers.length}
                    </span>
                </div>

                {/* Search Input */}
                <div className="relative mb-4">
                    <input
                        type="text"
                        placeholder="Search by title, author, ID..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    {searchText && (
                        <button
                            onClick={() => setSearchText('')}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Toggle */}
            <button
                onClick={() => setExpandedFilters(!expandedFilters)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg mb-3 transition"
            >
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-700">Filters</span>
                    {hasActiveFilters && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                            Active
                        </span>
                    )}
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-gray-600 transition ${expandedFilters ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Filters Section */}
            {expandedFilters && (
                <div className="space-y-4 mb-6 pb-4 border-b border-gray-200">
                    {/* Status Filter */}
                    <div>
                        <label className="text-xs font-semibold text-gray-700 uppercase mb-2 block">
                            Status
                        </label>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            <option value="all">All Statuses</option>
                            <option value="overdue">⏰ Overdue</option>
                            <option value="urgent">⚡ Urgent (≤2 days)</option>
                            <option value="pending">⏳ Pending</option>
                        </select>
                    </div>

                    {/* Category Filter */}
                    <div>
                        <label className="text-xs font-semibold text-gray-700 uppercase mb-2 block">
                            Category
                        </label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            <option value="all">All Categories</option>
                            {getCategories().map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Rating Status Filter */}
                    <div>
                        <label className="text-xs font-semibold text-gray-700 uppercase mb-2 block">
                            Review Status
                        </label>
                        <select
                            value={selectedRating}
                            onChange={(e) => setSelectedRating(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            <option value="all">All</option>
                            <option value="pending">Pending Review</option>
                            <option value="reviewed">✓ Already Reviewed</option>
                        </select>
                    </div>

                    {/* Sort Options */}
                    <div>
                        <label className="text-xs font-semibold text-gray-700 uppercase mb-2 block">
                            Sort By
                        </label>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            <option value="deadline">📅 Deadline (Urgent First)</option>
                            <option value="status">🚨 Status Priority</option>
                            <option value="title">📄 Paper Title (A-Z)</option>
                            <option value="author">👤 Author Name (A-Z)</option>
                        </select>
                    </div>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <button
                            onClick={clearAllFilters}
                            className="w-full px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-semibold rounded-lg transition"
                        >
                            Clear All Filters
                        </button>
                    )}
                </div>
            )}

            {/* Papers List */}
            <div className="space-y-2">
                {filteredPapers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No papers match your filters</p>
                    </div>
                ) : (
                    filteredPapers.map(paper => {
                        const status = getPaperStatus(paper);
                        const isSelected = selectedPaper?._id === paper._id;
                        const deadline = new Date(paper.assignmentDetails?.deadline);
                        const now = new Date();
                        const daysLeft = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                        return (
                            <button
                                key={paper._id}
                                onClick={() => onSelectPaper(paper)}
                                className={`w-full text-left p-3 rounded-lg border-2 transition ${
                                    isSelected
                                        ? 'border-blue-500 bg-blue-50'
                                        : `border-gray-200 hover:border-gray-300 ${getStatusColor(status)}`
                                }`}
                            >
                                {/* Paper Header */}
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-800 text-xs leading-tight line-clamp-2">
                                            {paper.paperTitle}
                                        </h4>
                                        <p className="text-xs text-gray-600 mt-1">{paper.submissionId}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ml-2 ${getStatusBadgeColor(status)}`}>
                                        {status === 'overdue' ? 'Overdue' : status === 'urgent' ? 'Urgent' : 'Pending'}
                                    </span>
                                </div>

                                {/* Author and Category */}
                                <div className="mb-2">
                                    <p className="text-xs text-gray-700">
                                        <strong>By:</strong> {paper.authorName}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        <strong>Category:</strong> {paper.category}
                                    </p>
                                </div>

                                {/* Deadline Info */}
                                <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                                    {getStatusIcon(status)}
                                    <span>
                                        {status === 'overdue'
                                            ? `Overdue ${Math.abs(daysLeft)} days`
                                            : `${daysLeft} days left`}
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-300 rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full transition ${
                                            status === 'overdue'
                                                ? 'bg-red-500'
                                                : status === 'urgent'
                                                    ? 'bg-orange-500'
                                                    : 'bg-blue-500'
                                        }`}
                                        style={{
                                            width: `${Math.max(0, Math.min(100, ((14 - Math.max(0, daysLeft)) / 14) * 100))}%`
                                        }}
                                    ></div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>

            {/* Statistics Section */}
            {papers.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-red-50 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-red-600">
                                {papers.filter(p => getPaperStatus(p) === 'overdue').length}
                            </div>
                            <div className="text-xs text-gray-600">Overdue</div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-orange-600">
                                {papers.filter(p => getPaperStatus(p) === 'urgent').length}
                            </div>
                            <div className="text-xs text-gray-600">Urgent</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-blue-600">
                                {papers.filter(p => getPaperStatus(p) === 'pending').length}
                            </div>
                            <div className="text-xs text-gray-600">Pending</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2 text-center">
                            <div className="text-lg font-bold text-green-600">
                                {papers.length}
                            </div>
                            <div className="text-xs text-gray-600">Total</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchFilterPanel;
