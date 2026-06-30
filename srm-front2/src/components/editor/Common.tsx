import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface Paper {
    _id: string;
    submissionId: string;
    paperTitle: string;
    authorName: string;
    email: string;
    category: string;
    status: string;
    pdfUrl: string;
    assignedReviewers: any[];
    reviewAssignments?: any[];
    createdAt: string;
}

export interface DashboardStats {
    totalPapers: number;
    acceptedPapers: number;
    rejectedPapers: number;
    underReview: number;
}

interface NavItemProps {
    icon: LucideIcon;
    label: string;
    active: boolean;
    onClick: () => void;
    collapsed: boolean;
}

export const NavItem = React.memo(({ icon: Icon, label, active, onClick, collapsed }: NavItemProps) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition mb-2 ${active ? 'bg-[#F5A051] text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
    >
        <Icon className="w-5 h-5" />
        {!collapsed && <span>{label}</span>}
    </button>
));

export const StatusBadge = React.memo(({ status }: { status: string }) => {
    const colors: Record<string, string> = {
        'Submitted': 'bg-blue-100 text-blue-800',
        'Editor Assigned': 'bg-purple-100 text-purple-800',
        'Under Review': 'bg-yellow-100 text-yellow-800',
        'Review Received': 'bg-indigo-100 text-indigo-800',
        'Accepted': 'bg-green-100 text-green-800',
        'Rejected': 'bg-red-100 text-red-800',
        'Revision Required': 'bg-orange-100 text-orange-800'
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
            {status}
        </span>
    );
});

interface StatCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    color: string;
    trend?: string;
}

export const StatCard = React.memo(({ title, value, icon: Icon, color }: StatCardProps) => (
    <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            </div>
            <div className={`p-3 rounded-full ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </div>
));
