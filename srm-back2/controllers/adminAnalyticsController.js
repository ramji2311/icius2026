import * as XLSX from 'xlsx';
import { PaperSubmission } from '../models/Paper.js';
import PaymentRegistration from '../models/PaymentRegistration.js';
import { PaymentDoneFinalUser } from '../models/PaymentDoneFinalUser.js';
import ListenerRegistration from '../models/ListenerRegistration.js';
import { Copyright } from '../models/Copyright.js';
import FinalAcceptance from '../models/FinalAcceptance.js';
import { paymentRegistrationEffectiveAmountStage } from '../utils/paymentRegistrationEffectiveAmount.js';

const ACCEPTED_STATUSES = ['Accepted', 'Published', 'Conditionally Accept'];
const REJECTED_STATUSES = ['Rejected'];
const IN_REVIEW_STATUSES = [
    'Submitted',
    'Editor Assigned',
    'Under Review',
    'Review Received',
    'Revision Required',
    'Revised Submitted'
];

function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildPaperMatchQuery(query) {
    const { category, search } = query;
    const match = {};
    if (category && String(category).trim()) {
        match.category = new RegExp(`^${escapeRegex(String(category).trim())}$`, 'i');
    }
    if (search && String(search).trim()) {
        match.institution = new RegExp(escapeRegex(String(search).trim()), 'i');
    }
    return match;
}

async function buildVerifiedPaymentMap() {
    const rows = await PaymentRegistration.find({ paymentStatus: 'verified' })
        .select('submissionId authorEmail amount verifiedAmount papers')
        .lean();

    const bySubmissionId = new Map();
    const byEmailOnly = new Map();

    for (const r of rows) {
        const papers = r.papers || [];
        let usedPerPaper = false;
        if (papers.length > 0) {
            for (const p of papers) {
                const sid = p.submissionId && String(p.submissionId).trim();
                const ap = Number(p.amountPaid);
                if (sid && Number.isFinite(ap) && ap > 0) {
                    usedPerPaper = true;
                    bySubmissionId.set(sid, (bySubmissionId.get(sid) || 0) + ap);
                }
            }
        }
        if (usedPerPaper) continue;

        const amt = Number(r.verifiedAmount ?? r.amount) || 0;
        if (r.submissionId && String(r.submissionId).trim()) {
            const sid = String(r.submissionId).trim();
            bySubmissionId.set(sid, (bySubmissionId.get(sid) || 0) + amt);
        } else if (r.authorEmail) {
            const em = String(r.authorEmail).toLowerCase().trim();
            byEmailOnly.set(em, (byEmailOnly.get(em) || 0) + amt);
        }
    }

    return { bySubmissionId, byEmailOnly };
}

function paymentForPaper(map, submissionId, email) {
    const sid = submissionId ? String(submissionId).trim() : '';
    const em = email ? String(email).toLowerCase().trim() : '';
    let total = 0;
    if (sid && map.bySubmissionId.has(sid)) {
        total += map.bySubmissionId.get(sid);
    }
    if (em && map.byEmailOnly.has(em)) {
        total += map.byEmailOnly.get(em);
    }
    return Math.round((total + Number.EPSILON) * 100) / 100;
}

export const getAnalyticsSummary = async (req, res) => {
    try {
        const categories = await PaperSubmission.distinct('category');

        const [regSum, finalAgg, listenerSum] = await Promise.all([
            PaymentRegistration.aggregate([
                { $match: { paymentStatus: 'verified' } },
                paymentRegistrationEffectiveAmountStage,
                { $group: { _id: null, total: { $sum: '$effectiveRegAmount' } } }
            ]),
            PaymentDoneFinalUser.aggregate([
                { $match: { verifiedAt: { $ne: null } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            ListenerRegistration.aggregate([
                { $match: { paymentStatus: 'verified' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ])
        ]);

        const registrationPayments = regSum[0]?.total || 0;
        const finalPayments = finalAgg[0]?.total || 0;
        const listenerPayments = listenerSum[0]?.total || 0;

        return res.json({
            success: true,
            categories: categories.filter(Boolean).sort(),
            conferenceTotals: {
                currency: 'INR',
                registrationPaymentsVerified: registrationPayments,
                finalPaymentsVerified: finalPayments,
                listenerPaymentsVerified: listenerPayments,
                totalRevenue: registrationPayments + finalPayments + listenerPayments
            }
        });
    } catch (error) {
        console.error('getAnalyticsSummary:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to load analytics summary'
        });
    }
};

export const getByInstitution = async (req, res) => {
    try {
        const match = buildPaperMatchQuery(req.query);

        const paperAgg = await PaperSubmission.aggregate([
            { $match: Object.keys(match).length ? match : {} },
            {
                $group: {
                    _id: { $toUpper: { $ifNull: ['$institution', 'OTHERS'] } },
                    totalPapers: { $sum: 1 },
                    accepted: {
                        $sum: {
                            $cond: [{ $in: ['$status', ACCEPTED_STATUSES] }, 1, 0]
                        }
                    },
                    rejected: {
                        $sum: {
                            $cond: [{ $in: ['$status', REJECTED_STATUSES] }, 1, 0]
                        }
                    },
                    inReview: {
                        $sum: {
                            $cond: [{ $in: ['$status', IN_REVIEW_STATUSES] }, 1, 0]
                        }
                    },
                    authors: { $addToSet: '$email' }
                }
            },
            {
                $project: {
                    institution: '$_id',
                    count: '$totalPapers',
                    accepted: 1,
                    rejected: 1,
                    inReview: 1,
                    uniqueAuthors: { $size: '$authors' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const rawPaymentsByCollege = await PaymentRegistration.aggregate([
            { $match: { paymentStatus: 'verified' } },
            paymentRegistrationEffectiveAmountStage,
            {
                $group: {
                    _id: { $toUpper: { $ifNull: ['$institution', 'OTHERS'] } },
                    regCount: { $sum: 1 },
                    totalAmount: { $sum: '$effectiveRegAmount' }
                }
            }
        ]);

        const collegeMap = {};
        for (const row of paperAgg) {
            const org = row.institution || 'OTHERS';
            collegeMap[org] = {
                institution: org,
                count: row.count,
                accepted: row.accepted,
                rejected: row.rejected,
                inReview: row.inReview,
                uniqueAuthors: row.uniqueAuthors,
                regCnt: 0,
                nonRegCnt: row.count,
                amount: 0
            };
        }

        for (const item of rawPaymentsByCollege) {
            const org = item._id || 'OTHERS';
            if (!collegeMap[org]) {
                collegeMap[org] = {
                    institution: org,
                    count: 0,
                    accepted: 0,
                    rejected: 0,
                    inReview: 0,
                    uniqueAuthors: 0,
                    regCnt: 0,
                    nonRegCnt: 0,
                    amount: 0
                };
            }
            collegeMap[org].regCnt = item.regCount;
            collegeMap[org].amount = item.totalAmount || 0;
            collegeMap[org].nonRegCnt = Math.max(0, (collegeMap[org].count || 0) - item.regCount);
        }

        const collegeStats = Object.values(collegeMap).sort((a, b) => b.count - a.count);

        const papersForBuckets = await PaperSubmission.find(
            Object.keys(match).length ? match : {}
        )
            .select('submissionId email institution')
            .lean();

        const payMapBuckets = await buildVerifiedPaymentMap();
        const pendingRegs = await PaymentRegistration.find({ paymentStatus: 'pending' })
            .select('submissionId authorEmail papers')
            .lean();

        const pendingSubmissionSet = new Set();
        const pendingEmailSet = new Set();
        for (const r of pendingRegs) {
            if (r.submissionId) pendingSubmissionSet.add(String(r.submissionId).trim());
            if (r.authorEmail) pendingEmailSet.add(String(r.authorEmail).toLowerCase().trim());
            for (const p of r.papers || []) {
                if (p.submissionId) pendingSubmissionSet.add(String(p.submissionId).trim());
            }
        }

        const bucketByInst = {};
        for (const p of papersForBuckets) {
            const inst = String(p.institution || 'OTHERS').toUpperCase();
            if (!bucketByInst[inst]) {
                bucketByInst[inst] = { papersPaid: 0, papersPending: 0, papersUnpaid: 0 };
            }
            const sid = p.submissionId ? String(p.submissionId).trim() : '';
            const em = p.email ? String(p.email).toLowerCase().trim() : '';
            const amt = paymentForPaper(payMapBuckets, sid, em);
            if (amt > 0) {
                bucketByInst[inst].papersPaid += 1;
            } else if (
                (sid && pendingSubmissionSet.has(sid)) ||
                (em && pendingEmailSet.has(em))
            ) {
                bucketByInst[inst].papersPending += 1;
            } else {
                bucketByInst[inst].papersUnpaid += 1;
            }
        }

        for (const row of collegeStats) {
            const b = bucketByInst[row.institution] || {
                papersPaid: 0,
                papersPending: 0,
                papersUnpaid: 0
            };
            row.papersPaid = b.papersPaid;
            row.papersPending = b.papersPending;
            row.papersUnpaid = b.papersUnpaid;
        }

        return res.json({ success: true, collegeStats });
    } catch (error) {
        console.error('getByInstitution:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed institution analytics'
        });
    }
};

export const getAnalyticsPapers = async (req, res) => {
    try {
        const match = buildPaperMatchQuery(req.query);
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
        const skip = (page - 1) * limit;

        const filter = Object.keys(match).length ? match : {};

        const [total, papers, payMap] = await Promise.all([
            PaperSubmission.countDocuments(filter),
            PaperSubmission.find(filter)
                .populate('assignedEditor', 'username email')
                .populate('reviewAssignments.reviewer', 'username email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            buildVerifiedPaymentMap()
        ]);

        const rows = papers.map((p) => {
            const editor = p.assignedEditor
                ? {
                      username: p.assignedEditor.username,
                      email: p.assignedEditor.email
                  }
                : null;
            const reviewers = (p.reviewAssignments || [])
                .map((a) => {
                    const rv = a.reviewer;
                    if (!rv) return null;
                    return {
                        username: rv.username,
                        email: rv.email,
                        assignmentStatus: a.status
                    };
                })
                .filter(Boolean);

            const paymentTotal = paymentForPaper(payMap, p.submissionId, p.email);

            return {
                _id: p._id,
                submissionId: p.submissionId,
                paperTitle: p.paperTitle,
                authorName: p.authorName,
                email: p.email,
                institution: p.institution,
                category: p.category,
                status: p.status,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
                editor,
                reviewers,
                paymentTotal
            };
        });

        return res.json({
            success: true,
            page,
            limit,
            total,
            pages: Math.ceil(total / limit) || 1,
            papers: rows
        });
    } catch (error) {
        console.error('getAnalyticsPapers:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed papers analytics'
        });
    }
};

function fmtExportDate(d) {
    if (d == null) return '';
    try {
        return new Date(d).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return '';
    }
}

/** GET /api/admin/analytics/export-accepted-excel — all accepted papers as .xlsx */
export const exportAcceptedPapersExcel = async (req, res) => {
    try {
        const payMap = await buildVerifiedPaymentMap();
        const papers = await PaperSubmission.find({ status: { $in: ACCEPTED_STATUSES } })
            .populate('assignedEditor', 'username email')
            .populate('reviewAssignments.reviewer', 'username email')
            .sort({ createdAt: 1 })
            .lean();

        const sids = papers.map((p) => p.submissionId).filter(Boolean);
        const [copyrights, finals, verifiedRegs] = await Promise.all([
            Copyright.find({ submissionId: { $in: sids } }).lean(),
            FinalAcceptance.find({ submissionId: { $in: sids } }).lean(),
            PaymentRegistration.find({ paymentStatus: 'verified' })
                .select('submissionId verifiedAt papers')
                .sort({ verifiedAt: -1 })
                .lean()
        ]);

        const crBySub = Object.fromEntries(copyrights.map((c) => [c.submissionId, c]));
        const faBySub = Object.fromEntries(finals.map((f) => [f.submissionId, f]));

        const verifiedAtBySub = new Map();
        for (const r of verifiedRegs) {
            const at = r.verifiedAt;
            const addSid = (sid) => {
                if (!sid) return;
                const k = String(sid).trim();
                if (!verifiedAtBySub.has(k)) verifiedAtBySub.set(k, at);
            };
            addSid(r.submissionId);
            for (const p of r.papers || []) addSid(p.submissionId);
        }

        const headers = [
            'S.No.',
            'Reference',
            'Certificate status',
            'Conf.Sub.ID',
            'TITLE',
            'AUTHORS',
            'UNIVERSITY',
            'E-Mail',
            'Plag %',
            'Status',
            'Amount (INR)',
            'Registered Y/N',
            'UNIVERSITY (repeat)',
            'Remarks',
            'Reviewers',
            'Editor',
            'Submitted date',
            'Accepted date',
            'Payment verified date',
            'Copyright form URL',
            'Camera ready URL',
            'Main PDF URL',
            'Category'
        ];

        const dataRows = papers.map((p, idx) => {
            const sid = p.submissionId;
            const cr = crBySub[sid];
            const fa = faBySub[sid];
            const amt = paymentForPaper(payMap, sid, p.email);
            const registered = amt > 0 ? 'Y' : 'N';
            const reviewers = (p.reviewAssignments || [])
                .map((a) => {
                    const rv = a.reviewer;
                    return rv && (rv.username || rv.email) ? `${rv.username || ''} <${rv.email || ''}>`.trim() : '';
                })
                .filter(Boolean)
                .join('; ');
            const editor = p.assignedEditor
                ? `${p.assignedEditor.username || ''} <${p.assignedEditor.email || ''}>`.trim()
                : '';
            const ref = fa?.acceptanceCertificateNumber || sid || '';
            const certParts = [];
            if (cr?.status) certParts.push(`Copyright: ${cr.status}`);
            if (fa?.acceptanceCertificateNumber) certParts.push(`Cert# ${fa.acceptanceCertificateNumber}`);
            const certStatus = certParts.join(' | ') || '—';
            const remarks = [p.editorComments, p.finalDecision].filter(Boolean).join(' | ') || '';
            const uni = p.institution || '';

            return [
                idx + 1,
                ref,
                certStatus,
                sid,
                p.paperTitle,
                p.authorName,
                uni,
                p.email,
                '',
                p.status,
                amt,
                registered,
                uni,
                remarks,
                reviewers,
                editor,
                fmtExportDate(p.createdAt),
                fmtExportDate(fa?.acceptanceDate),
                fmtExportDate(verifiedAtBySub.get(sid)),
                cr?.copyrightFormUrl || '',
                cr?.cameraReadyUrl || '',
                p.pdfUrl || '',
                p.category || ''
            ];
        });

        const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
        ws['!cols'] = headers.map(() => ({ wch: 18 }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Accepted papers');

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename="accepted-papers-export.xlsx"'
        );
        return res.send(Buffer.from(buffer));
    } catch (error) {
        console.error('exportAcceptedPapersExcel:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Export failed'
        });
    }
};
