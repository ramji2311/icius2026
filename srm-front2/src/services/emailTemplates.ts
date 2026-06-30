// Email template service for different scenarios

export const emailTemplates = {
    // Reply to reviewer
    replyToReviewer: {
        subject: 'Re: Your Review - Paper {submissionId}',
        defaultTemplate: `Dear {reviewerName},

Thank you for your thorough review of the paper "{paperTitle}".

We appreciate your valuable feedback and insights. Your comments have been carefully reviewed.

{userMessage}

Best regards,
{editorName}
Editorial Team`,
    },

    // Reply to author
    replyToAuthor: {
        subject: 'Regarding Your Submission - {submissionId}',
        defaultTemplate: `Dear {authorName},

Thank you for submitting your paper "{paperTitle}" to ICIUS 2026.

We have reviewed your paper and would like to share the following feedback:

{userMessage}

We look forward to your response.

Best regards,
{editorName}
Editorial Team`,
    },

    // Paper accepted
    paperAccepted: {
        subject: 'Paper Accepted - {submissionId}: {paperTitle}',
        defaultTemplate: `Dear {authorName},

Congratulations! We are pleased to inform you that your paper "{paperTitle}" (Submission ID: {submissionId}) has been **ACCEPTED** for presentation at ICIUS 2026.

**Paper Details:**
- Submission ID: {submissionId}
- Title: {paperTitle}
- Category: {category}

Your paper will be featured in the conference proceedings. Please proceed with the final submission and registration.

**Next Steps:**
1. Complete final registration
2. Prepare your presentation slides
3. Submit camera-ready version by {deadline}

Congratulations on your acceptance!

Best regards,
{editorName}
Editorial Team
ICIUS 2026`,
    },

    // Paper rejected
    paperRejected: {
        subject: 'Paper Decision - {submissionId}: {paperTitle}',
        defaultTemplate: `Dear {authorName},

Thank you for submitting your paper "{paperTitle}" (Submission ID: {submissionId}) to ICIUS 2026.

After careful review by our expert committee, we regret to inform you that your paper has not been accepted for presentation at this time.

**Reviewer Feedback:**
{reviewerComments}

We encourage you to revise your paper based on the feedback and consider submitting to future conferences or journals.

Best regards,
{editorName}
Editorial Team
ICIUS 2026`,
    },

    // Major revision needed
    majorRevision: {
        subject: 'Major Revision Required - {submissionId}: {paperTitle}',
        defaultTemplate: `Dear {authorName},

Thank you for submitting your paper "{paperTitle}" (Submission ID: {submissionId}) to ICIUS 2026.

After review by our experts, your paper shows promise but requires **major revisions** before acceptance.

**Reviewer Feedback:**
{reviewerComments}

**Action Required:**
Please revise your paper addressing all comments and resubmit within {revisedDeadline} days.

We look forward to receiving your revised submission.

Best regards,
{editorName}
Editorial Team
ICIUS 2026`,
    },

    // Minor revision needed
    minorRevision: {
        subject: 'Minor Revision Required - {submissionId}: {paperTitle}',
        defaultTemplate: `Dear {authorName},

Thank you for submitting your paper "{paperTitle}" (Submission ID: {submissionId}) to ICIUS 2026.

Your paper shows good quality and requires only **minor revisions** for acceptance.

**Reviewer Feedback:**
{reviewerComments}

**Action Required:**
Please revise your paper addressing the minor issues and resubmit within {revisedDeadline} days.

Best regards,
{editorName}
Editorial Team
ICIUS 2026`,
    },
};

export const getTemplateVariables = () => {
    const variables: { [key: string]: string } = {
        '{submissionId}': 'Paper Submission ID',
        '{paperTitle}': 'Paper Title',
        '{authorName}': 'Author Name',
        '{reviewerName}': 'Reviewer Name',
        '{category}': 'Paper Category',
        '{editorName}': 'Your Name',
        '{userMessage}': 'Your custom message',
        '{reviewerComments}': 'Reviewer feedback/comments',
        '{deadline}': 'Deadline date',
        '{revisedDeadline}': 'Revision deadline (days)',
    };
    return variables;
};

export const replaceTemplateVariables = (
    template: string,
    replacements: { [key: string]: string }
): string => {
    let result = template;
    Object.keys(replacements).forEach((key) => {
        result = result.replace(new RegExp(key, 'g'), replacements[key]);
    });
    return result;
};
