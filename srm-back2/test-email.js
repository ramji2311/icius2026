import { transporter } from './utils/emailService.js';

console.log('EMAIL_USER:', process.env.EMAIL_USER || '(missing)');

transporter.verify((err) => {
    if (err) {
        console.error('Verify failed:', err.message);
        process.exit(1);
    }
    transporter.sendMail(
        {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: 'ICIUS Gmail test',
            text: 'Test OK'
        },
        (e, info) => {
            if (e) {
                console.error(e.message);
                process.exit(1);
            }
            console.log('Sent:', info.messageId);
            process.exit(0);
        }
    );
});
