import React from 'react';
import { Search, UserPlus, Mail, User, Edit2, Trash2, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { Reviewer } from '../ReviewerFilterPanel';

interface ReviewersTabProps {
    reviewers: Reviewer[];
    searchTerm: string;
    onSearchChange: (val: string) => void;
    onCreateClick: () => void;
    onEditClick: (reviewer: Reviewer) => void;
    onDeleteClick: (id: string) => void;
    expandedReviewerId: string | null;
    onToggleExpand: (id: string | null) => void;
}

export const ReviewersTab = React.memo(({
    reviewers,
    searchTerm,
    onSearchChange,
    onCreateClick,
    onEditClick,
    onDeleteClick,
    expandedReviewerId,
    onToggleExpand
}: ReviewersTabProps) => {
    const filteredReviewers = reviewers.filter(r =>
        r.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search reviewers by name, email or expertise..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-50 rounded-xl focus:border-[#F5A051] transition-all outline-none"
                    />
                </div>
                <button
                    onClick={onCreateClick}
                    className="shrink-0 px-6 py-3 bg-[#F5A051] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-all active:scale-95"
                >
                    <UserPlus className="w-5 h-5" />
                    Add New Reviewer
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReviewers.map(reviewer => (
                    <div 
                        key={reviewer._id} 
                        className={`bg-white rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                            expandedReviewerId === reviewer._id ? 'border-[#F5A051] ring-4 ring-orange-50' : 'border-gray-50 hover:border-orange-200'
                        }`}
                    >
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-[#F5A051] flex items-center justify-center text-white font-bold text-xl">
                                    {reviewer.username[0].toUpperCase()}
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => onEditClick(reviewer)}
                                        className="p-2 text-gray-400 hover:text-[#F5A051] hover:bg-orange-50 rounded-lg transition-all"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => onDeleteClick(reviewer._id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h4 className="text-lg font-bold text-gray-900 mb-1">{reviewer.username}</h4>
                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                                <Mail className="w-4 h-4" />
                                {reviewer.email}
                            </div>

                            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    <Clock className="w-3 h-3" />
                                    Reviewer Account
                                </div>
                                <button 
                                    onClick={() => onToggleExpand(expandedReviewerId === reviewer._id ? null : reviewer._id)}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-all"
                                >
                                    {expandedReviewerId === reviewer._id ? <ChevronUp /> : <ChevronDown />}
                                </button>
                            </div>
                        </div>

                        {expandedReviewerId === reviewer._id && (
                            <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                                <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">System Info</p>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">ID:</span>
                                        <span className="font-mono text-gray-700">{reviewer._id.slice(-8)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Role:</span>
                                        <span className="font-bold text-[#F5A051]">Reviewer</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredReviewers.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">No reviewers found</h3>
                    <p className="text-gray-500">Try adjusting your search or add a new reviewer.</p>
                </div>
            )}
        </div>
    );
});
