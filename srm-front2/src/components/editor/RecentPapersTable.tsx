import React from 'react';
import { Eye } from 'lucide-react';
import { Paper, StatusBadge } from './Common';

interface RecentPapersTableProps {
    papers: Paper[];
    onView: (paper: Paper) => void;
}

export const RecentPapersTable = React.memo(({ papers, onView }: RecentPapersTableProps) => {
    return (
        <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Recent Papers</h3>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Author</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {papers.slice(0, 8).map((paper) => (
                            <tr 
                                key={paper._id} 
                                className="hover:bg-gray-50 cursor-pointer transition-colors" 
                                onClick={() => onView(paper)}
                            >
                                <td className="px-4 py-3 text-sm font-mono text-gray-500">{paper.submissionId}</td>
                                <td className="px-4 py-3 text-sm font-bold text-gray-800">{paper.paperTitle}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{paper.authorName}</td>
                                <td className="px-4 py-3">
                                    <StatusBadge status={paper.status} />
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onView(paper);
                                        }}
                                        className="p-2 text-[#F5A051] hover:bg-orange-50 rounded-lg transition"
                                    >
                                        <Eye className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {papers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    No recent papers found.
                </div>
            )}
        </div>
    );
});
