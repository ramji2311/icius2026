export const getReminderEmailContent = (reminderCount: number) => {
    const reminderTexts = {
        1: `This is a gentle reminder that we're still waiting for your review of the submitted paper.`,
        2: `We haven't received your review yet. This is our second reminder. Your timely feedback is crucial for our review process.`,
        3: `This is our final reminder. We urgently need your review to meet our publication timeline. Please submit your review as soon as possible.`
    };

    const count = Math.min(reminderCount + 1, 3);
    return reminderTexts[count as keyof typeof reminderTexts];
};

export const generateReminderEmail = (
    reviewerName: string,
    paperTitle: string,
    daysRemaining: number,
    reminderCount: number,
    reviewLink: string
) => {
    const reminderMessage = getReminderEmailContent(reminderCount);
    const urgencyClass = daysRemaining < 0 ? 'critical' : daysRemaining < 3 ? 'high' : 'normal';

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #f5f5f5;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .header {
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 600;
                }
                .urgency-badge {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                    margin-top: 10px;
                }
                .urgency-badge.critical {
                    background-color: rgba(239, 68, 68, 0.3);
                    color: #dc2626;
                }
                .urgency-badge.high {
                    background-color: rgba(249, 115, 22, 0.3);
                    color: #ea580c;
                }
                .urgency-badge.normal {
                    background-color: rgba(59, 130, 246, 0.3);
                    color: #2563eb;
                }
                .content {
                    padding: 30px;
                }
                .greeting {
                    margin-bottom: 20px;
                }
                .greeting p {
                    margin: 0 0 15px 0;
                    color: #555;
                }
                .reminder-box {
                    padding: 15px;
                    background-color: ${urgencyClass === 'critical' ? '#fee2e2' :
            urgencyClass === 'high' ? '#fed7aa' :
                '#dbeafe'
        };
                    border-left: 4px solid ${urgencyClass === 'critical' ? '#dc2626' :
            urgencyClass === 'high' ? '#ea580c' :
                '#2563eb'
        };
                    border-radius: 4px;
                    margin: 20px 0;
                }
                .reminder-box p {
                    margin: 0;
                    color: ${urgencyClass === 'critical' ? '#991b1b' :
            urgencyClass === 'high' ? '#92400e' :
                '#1e40af'
        };
                    font-weight: 500;
                }
                .paper-info {
                    background-color: #f9fafb;
                    padding: 15px;
                    border-radius: 6px;
                    margin: 20px 0;
                    border: 1px solid #e5e7eb;
                }
                .paper-info h3 {
                    margin: 0 0 10px 0;
                    color: #374151;
                    font-size: 14px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .paper-title {
                    margin: 0;
                    color: #1f2937;
                    font-weight: 600;
                    font-size: 15px;
                    word-break: break-word;
                }
                .deadline-section {
                    margin: 20px 0;
                    padding: 15px;
                    background-color: #fef3c7;
                    border-left: 4px solid #f59e0b;
                    border-radius: 4px;
                }
                .deadline-section p {
                    margin: 0;
                    color: #92400e;
                }
                .deadline-critical {
                    color: #dc2626;
                    font-weight: 600;
                }
                .cta-button {
                    display: inline-block;
                    padding: 12px 30px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                    margin: 20px 0;
                    font-weight: 600;
                    transition: opacity 0.3s;
                }
                .cta-button:hover {
                    opacity: 0.9;
                }
                .cta-link {
                    word-break: break-all;
                    padding: 10px;
                    background-color: #f3f4f6;
                    border-radius: 4px;
                    font-size: 12px;
                    margin: 10px 0;
                }
                .footer {
                    background-color: #f9fafb;
                    padding: 20px;
                    text-align: center;
                    color: #6b7280;
                    font-size: 12px;
                    border-top: 1px solid #e5e7eb;
                }
                .divider {
                    height: 1px;
                    background-color: #e5e7eb;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Review Reminder</h1>
                    ${reminderCount > 0 ? `<span class="urgency-badge ${urgencyClass}">Reminder #${reminderCount + 1}</span>` : ''}
                </div>
                <div class="content">
                    <div class="greeting">
                        <p>Dear ${reviewerName},</p>
                    </div>

                    <div class="reminder-box">
                        <p>${reminderMessage}</p>
                    </div>

                    <div class="paper-info">
                        <h3>Paper Under Review</h3>
                        <p class="paper-title">${paperTitle}</p>
                    </div>

                    ${daysRemaining < 0
            ? `<div class="deadline-section">
                            <p><strong class="deadline-critical">STATUS: OVERDUE</strong></p>
                            <p>The review deadline was ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''} ago. Your review is urgently needed.</p>
                        </div>`
            : `<div class="deadline-section">
                            <p><strong>Time Remaining: ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</strong></p>
                            <p>Please submit your review before the deadline to ensure timely publication.</p>
                        </div>`
        }

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${reviewLink}" class="cta-button">Submit Your Review</a>
                        <div class="cta-link">Or copy this link: ${reviewLink}</div>
                    </div>

                    <div class="divider"></div>

                    <p style="color: #6b7280; font-size: 14px;">
                        Your expert evaluation is crucial for maintaining the quality of our publication process. 
                        We appreciate your time and effort in reviewing this submission.
                    </p>

                    ${reminderCount >= 2
            ? `<div style="padding: 15px; background-color: #fee2e2; border-left: 4px solid #dc2626; border-radius: 4px; margin: 20px 0;">
                            <p style="margin: 0; color: #991b1b; font-weight: 500;">
                                If you have any concerns about completing this review or need an extension, 
                                please contact the editor immediately.
                            </p>
                        </div>`
            : ''
        }

                    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                        Thank you for your continued support of our publication.
                    </p>
                </div>
                <div class="footer">
                    <p style="margin: 0 0 8px 0;">This is an automated reminder. Please do not reply to this email.</p>
                    <p style="margin: 0;">© 2026 ICIUS Conference. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return {
        subject: `[REMINDER] Review Needed: ${paperTitle.substring(0, 50)}${paperTitle.length > 50 ? '...' : ''}`,
        html,
        text: `
Dear ${reviewerName},

${reminderMessage}

Paper Title: ${paperTitle}

${daysRemaining < 0
                ? `STATUS: OVERDUE - The review deadline was ${Math.abs(daysRemaining)} days ago.`
                : `Time Remaining: ${daysRemaining} days`
            }

Please submit your review using this link: ${reviewLink}

Thank you for your review.
        `.trim()
    };
};

export default {
    getReminderEmailContent,
    generateReminderEmail
};
