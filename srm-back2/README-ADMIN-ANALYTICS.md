# Admin conference analytics (implementation plan & reference)

This document records the plan for the admin dashboard analytics upgrade. The API and UI described here are implemented in this repo.

## Goals

1. **By institution (college)**: Papers submitted, accepted, rejected, in-review counts; verified payment totals; unique author count; filters by **domain/category** and institution search.
2. **By paper / author**: Table listing each paper with status, assigned **editor**, **reviewers**, submission/update times, and **verified payment amount** linked to that paper.
3. **Conference totals**: Total revenue from verified author registrations, optional final-registration payments, and listener payments—exposed from the backend (not summed only from the institutional table).

## API (under `/api/admin`, Admin JWT required)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/analytics/summary` | `categories[]` (distinct paper categories), `conferenceTotals` (revenue breakdown) |
| GET | `/api/admin/analytics/by-institution` | Query: `category`, `search`. Returns merged institution rows with paper counts, accepted/rejected/inReview, reg payment stats, unique authors |
| GET | `/api/admin/analytics/papers` | Query: `category`, `search`, `page`, `limit`. Paginated papers with editor/reviewers populated + `paymentTotal` |

## Data rules

- **Institution key**: Uppercased `institution` on `PaperSubmission`; missing → `OTHERS` (same as legacy dashboard).
- **Accepted statuses**: `Accepted`, `Published`, `Conditionally Accept`.
- **Rejected**: `Rejected`.
- **In review** (reporting bucket): `Under Review`, `Editor Assigned`, `Review Received`, `Revision Required`, `Revised Submitted`, `Submitted` (optional—tune as needed).
- **Verified payments**: `PaymentRegistration.paymentStatus === 'verified'`. Per-paper amount prefers matching `submissionId`, else falls back to `authorEmail`.
- **Conference revenue**: Sum verified `PaymentRegistration`; plus `PaymentDoneFinalUser` with `verifiedAt` set; plus `ListenerRegistration` with `paymentStatus === 'verified'`.

## Frontend

- [`srm-front2/src/components/AdminDashboardStats.tsx`](../srm-front2/src/components/AdminDashboardStats.tsx): filters (domain + institution search), extended institutional table, paper/author table, KPIs fed from `summary` and `by-institution`.
- **Fixed expense / P&L**: `VITE_CONFERENCE_FIXED_EXPENSE` (optional). If unset, P&L block uses `0` or hides the comparison.

## Future options (not all implemented)

- Timeline charts (submissions per week)
- Export CSV
- Stricter institution normalization (lookup table)

## Risks

- Institution strings may differ between papers and payments (spelling); normalization is best-effort.
- Revenue from multiple sources may need business rules to avoid double-counting; review totals for your finance process.
