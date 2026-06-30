import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import { useWebSocket } from '../context/WebSocketContext';
import { Paper, DashboardStats } from '../components/editor/Common';
import { Reviewer } from '../components/ReviewerFilterPanel';

export const useEditorDashboard = () => {
    const navigate = useNavigate();
    const [papers, setPapers] = useState<Paper[]>([]);
    const [reviewers, setReviewers] = useState<Reviewer[]>([]);
    const [stats, setStats] = useState<DashboardStats>({
        totalPapers: 0,
        acceptedPapers: 0,
        rejectedPapers: 0,
        underReview: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPapers, setTotalPapers] = useState(0);

    const { on, off } = useWebSocket();

    const fetchDashboardData = useCallback(async (currentPage = page) => {
        try {
            setLoading(true);
            const [papersRes, reviewersRes] = await Promise.all([
                api.get(`/api/editor/papers?page=${currentPage}&limit=20`),
                api.get('/api/editor/reviewers').catch(() => ({ data: { reviewers: [] } }))
            ]);

            const allPapers = papersRes.data.papers || [];
            setPapers(allPapers);
            setReviewers(reviewersRes.data.reviewers || []);
            setTotalPages(papersRes.data.pages || 1);
            setTotalPapers(papersRes.data.total || allPapers.length);

            setStats({
                totalPapers: papersRes.data.total || allPapers.length,
                acceptedPapers: allPapers.filter((p: any) => p.status === 'Accepted').length,
                rejectedPapers: allPapers.filter((p: any) => p.status === 'Rejected').length,
                underReview: allPapers.filter((p: any) =>
                    !['Accepted', 'Rejected', 'Withdrawn'].includes(p.status)
                ).length
            });
        } catch (error: any) {
            console.error('Error fetching dashboard data:', error);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, [page]);

    const verifyAccess = useCallback(async () => {
        try {
            await api.get('/api/editor/verify-access');
            fetchDashboardData();
        } catch (err: any) {
            setError('Authentication failed. Please login again.');
            setTimeout(() => navigate('/login'), 2000);
        }
    }, [fetchDashboardData, navigate]);

    useEffect(() => {
        verifyAccess();
    }, [verifyAccess, page]);

    useEffect(() => {
        const handleUpdate = () => fetchDashboardData();
        
        on('paper:updated', handleUpdate);
        on('paper:new', handleUpdate);
        on('review:assigned', handleUpdate);
        on('paper:status-changed', handleUpdate);

        return () => {
            off('paper:updated', handleUpdate);
            off('paper:new', handleUpdate);
            off('review:assigned', handleUpdate);
            off('paper:status-changed', handleUpdate);
        };
    }, [on, off, fetchDashboardData]);

    return {
        papers,
        setPapers,
        reviewers,
        setReviewers,
        stats,
        loading,
        error,
        fetchDashboardData,
        page,
        setPage,
        totalPages,
        totalPapers
    };
};
