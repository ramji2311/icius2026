import React from 'react';
import { X, History } from 'lucide-react';
import PaperHistoryTimeline from '../PaperHistoryTimeline';
import { Paper } from './Common';

interface HistoryModalProps {
    paper: Paper;
    onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = React.memo(({ paper, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Paper Operation History
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex-1 overflow-auto p-6">
                    <PaperHistoryTimeline submissionId={paper.submissionId} />
                </div>
            </div>
        </div>
    );
});
