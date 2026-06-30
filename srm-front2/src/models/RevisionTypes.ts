
export interface RevisionFile {
    _id?: string;
    fileName: string;
    fileSize: number;
    base64: string;
    uploadedAt: Date;
    version: number;
}

export interface RevisionSubmission {
    _id?: string;
    submissionId: string;
    paperId: string;
    authorId: string;
    originalDecision: 'majorRevision' | 'minorRevision';
    deadline: Date;
    revisionFiles: RevisionFile[];
    authorNotes: string;
    editorComments?: string;
    revisionStatus: 'pending' | 'submitted' | 'under-review' | 'accepted' | 'rejected' | 'revise-again';
    createdAt: Date;
    submittedAt?: Date;
    reviewedAt?: Date;
    daysRemaining?: number;
}

export interface ReviewerReminder {
    _id?: string;
    submissionId: string;
    reviewerId: string;
    reviewerEmail: string;
    reminderSentAt: Date;
    reminderCount: number;
    response?: 'responded' | 'pending';
}

export interface RevisionTimeline {
    decision: string;
    decidedAt: Date;
    decisionBy: string;
}
