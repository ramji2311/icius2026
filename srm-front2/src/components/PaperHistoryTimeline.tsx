import React, { useState, useEffect } from 'react';
import api from '../config/api';
import {
    Clock, FileText, User, MessageCircle, CheckCircle,
    AlertCircle, Calendar, ExternalLink,
    MapPin, Send, Search, ArrowRight, Activity, History as HistoryIcon
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PaperHistoryTimelineProps {
    submissionId: string;
}

const PaperHistoryTimeline: React.FC<PaperHistoryTimelineProps> = ({ submissionId }) => {
    const [history, setHistory] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);



    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/api/papers/${submissionId}/history`);

                if (response.data.success) {
                    setHistory(response.data);
                    setError(null);
                } else {
                    setError(response.data.message || 'Failed to load history');
                }
            } catch (err: any) {
                console.error('Error fetching paper history:', err);
                setError(err.response?.data?.message || 'Error fetching paper history');
            } finally {
                setLoading(false);
            }
        };

        if (submissionId) {
            fetchHistory();
        }
    }, [submissionId]);

    const getEventStyles = (type: string) => {
        switch (type) {
            case 'submission':
                return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: <FileText className="w-5 h-5" /> };
            case 'version_upload':
                return { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', icon: <Clock className="w-5 h-5" /> };
            case 'assignment':
                return { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: <User className="w-5 h-5" /> };
            case 'reviewer_assigned':
                return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: <Activity className="w-5 h-5" /> };
            case 'review_submitted':
                return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle className="w-5 h-5" /> };
            case 'revision_cycle':
                return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: <AlertCircle className="w-5 h-5" /> };
            case 'revised_submission_detailed':
                return { color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200', icon: <Send className="w-5 h-5" /> };
            case 'message':
                return { color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-200', icon: <MessageCircle className="w-5 h-5" /> };
            case 'final_decision':
                return { color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', icon: <MapPin className="w-5 h-5" /> };
            default:
                return { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', icon: <Clock className="w-5 h-5" /> };
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center py-20 space-y-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-100 rounded-full animate-pulse"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-blue-600 rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-500 font-medium tracking-wide">Tracing Operations...</p>
            </div>
        );
    }

    if (error) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 sm:p-8 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex flex-col items-center text-center gap-3"
            >
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h4 className="font-bold text-lg">Unable to Trace Paper</h4>
                <p className="text-sm opacity-80 max-w-xs">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition"
                >
                    Try Again
                </button>
            </motion.div>
        );
    }

    if (!history || !history.timeline || history.timeline.length === 0) {
        return (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4 opacity-50" />
                <h4 className="text-gray-600 font-bold text-lg">No Records Found</h4>
                <p className="text-gray-400 text-sm mt-2">We couldn't find any operational history for this identity.</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 max-w-full min-w-0 overflow-x-hidden">
            {/* Header Info Card */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 text-white">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900 leading-tight">{history.paperTitle}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 uppercase tracking-tighter">
                                {history.submissionId}
                            </span>
                            <span className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" /> {history.authorName}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-1">Current Status</span>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-sm"></div>
                        <span className="text-sm font-black text-gray-800 uppercase tracking-tight">{history.currentStatus}</span>
                    </div>
                </div>
            </motion.div>

            {/* Horizontal Wrapping Tracking Timeline */}
            <div className="flex flex-wrap gap-x-4 gap-y-12 justify-center py-4">
                {history.timeline.map((event: any, index: number) => {
                    const style = getEventStyles(event.type);
                    const isLatest = index === history.timeline.length - 1;

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                            className="relative flex flex-col items-center group w-full sm:w-[280px] lg:w-[320px]"
                        >
                            {/* Connector Line (Desktop) */}
                            {index < history.timeline.length - 1 && (
                                <div className="hidden sm:block absolute left-[50%] top-8 w-full h-[3px] bg-gray-100 z-0">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: '100%' }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.8, delay: index * 0.1 }}
                                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20"
                                    />
                                </div>
                            )}

                            {/* Node Icon */}
                            <div className={`relative w-16 h-16 rounded-2xl ${style.bg} ${style.border} border-2 shadow-sm flex items-center justify-center z-10 
                                ${isLatest ? 'ring-4 ring-offset-2 ring-blue-100 group-hover:scale-105 transition-transform' : 'opacity-80 scale-90'} 
                                transition-all duration-300`}
                            >
                                <div className={`${style.color}`}>
                                    {style.icon}
                                </div>

                                {isLatest && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-ping"></div>
                                )}
                            </div>

                            {/* Content Bubble */}
                            <div className="mt-4 text-center w-full">
                                <div className="mb-2">
                                    <h4 className="font-black text-gray-900 text-base lg:text-lg tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                                        {event.title}
                                    </h4>
                                    <div className="text-[10px] font-bold text-gray-400 flex items-center justify-center mt-1 opacity-70">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {new Date(event.date).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm group-hover:shadow-md transition-shadow duration-300 min-h-[120px] flex flex-col">
                                    <p className="text-gray-600 text-[11px] font-medium leading-relaxed mb-3 line-clamp-2">
                                        {event.description}
                                    </p>

                                    {event.details && (
                                        <div className="bg-gray-50/50 rounded-xl p-3 space-y-2 border border-gray-100/50 mt-auto">
                                            {event.type === 'submission' && (
                                                <div className="flex flex-col gap-1">
                                                    <p className="text-[10px] font-bold text-gray-700">{event.details.category}</p>
                                                    {event.details.pdfUrl && (
                                                        <a
                                                            href={event.details.pdfUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-[10px] font-black text-blue-600 hover:underline flex items-center justify-center gap-1"
                                                        >
                                                            VIEW <ArrowRight className="w-3 h-3" />
                                                        </a>
                                                    )}
                                                </div>
                                            )}

                                            {event.type === 'version_upload' && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black bg-white px-2 py-0.5 rounded border">v{event.details.version}</span>
                                                    <a
                                                        href={event.details.pdfUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] font-black text-blue-600 hover:underline"
                                                    >
                                                        FILE <ExternalLink className="w-3 h-3 inline" />
                                                    </a>
                                                </div>
                                            )}

                                            {event.type === 'reviewer_assigned' && (
                                                <p className="text-[10px] font-bold text-amber-600 truncate">{event.details.reviewer}</p>
                                            )}

                                            {event.type === 'review_submitted' && (
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="text-[9px] font-black px-1.5 py-0.5 bg-green-600 text-white rounded uppercase">{event.details.recommendation}</span>
                                                    <span className="text-[9px] font-bold text-gray-400">{event.details.overall}/5</span>
                                                </div>
                                            )}

                                            {event.type === 'revised_submission_detailed' && (
                                                <div className="flex gap-1 justify-center">
                                                    {event.details.cleanPdf && <div className="w-2 h-2 rounded-full bg-emerald-500" title="Clean Copy" />}
                                                    {event.details.highlightedPdf && <div className="w-2 h-2 rounded-full bg-orange-500" title="Highlighted Copy" />}
                                                    {event.details.responsePdf && <div className="w-2 h-2 rounded-full bg-blue-500" title="Response Doc" />}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-12 text-center"
            >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                    <HistoryIcon className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Complete History Trace</span>
                </div>
            </motion.div>
        </div>
    );
};

export default PaperHistoryTimeline;
