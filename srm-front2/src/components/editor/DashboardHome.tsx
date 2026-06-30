import React from 'react';
import { FileText, CheckCircle, TrendingUp, Clock } from 'lucide-react';
import { StatCard, Paper, DashboardStats } from './Common';
import { RecentPapersTable } from './RecentPapersTable';

interface DashboardHomeProps {
    stats: DashboardStats;
    papers: Paper[];
    onViewPaper: (paper: Paper) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = React.memo(({ stats, papers, onViewPaper }) => {
    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Papers"
                    value={stats.totalPapers}
                    icon={FileText}
                    color="bg-[#F5A051]"
                    trend={`Submissions received`}
                />
                <StatCard
                    title="Accepted"
                    value={stats.acceptedPapers}
                    icon={CheckCircle}
                    color="bg-[#F5A051]"
                />
                <StatCard
                    title="Rejected"
                    value={stats.rejectedPapers}
                    icon={TrendingUp}
                    color="bg-[#F5A051]"
                />
                <StatCard
                    title="Under Review"
                    value={stats.underReview}
                    icon={Clock}
                    color="bg-[#F5A051]"
                />
            </div>

            <RecentPapersTable 
                papers={papers} 
                onView={onViewPaper} 
            />
        </div>
    );
});
