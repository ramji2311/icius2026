// Direct nodemailer test
import nodemailer from 'nodemailer';

// Create transporter with your web mail credentials
const transporter = nodemailer.createTransport({
    host: 'mail.isius.org', // Replace with your mail server if different
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'icius2026@isius.org',
        pass: 'Coimbatore@2026'
    },
    tls: {
        rejectUnauthorized: false // Accept self-signed certificates
    }
});

// Test email
async function testEmail() {
    try {
        console.log('🧪 Testing nodemailer...');
        
        // Verify connection
        await transporter.verify();
        console.log('✅ SMTP server connection successful');
        
        // Send test email
        const info = await transporter.sendMail({
            from: '"ICIUS 2026 Test" <icius2026@isius.org>',
            to: 'icius2026@isius.org', // Send to test recipient
            subject: '🧪 Nodemailer Test - ICIUS 2026',
            text: 'This is a test email to verify nodemailer is working with the web mail setup.',
            html: `
                <h2>🧪 Nodemailer Test</h2>
                <p>This is a test email to verify the email functionality is working.</p>
                <p><strong>From:</strong> ICIUS 2026 System</p>
                <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
                <hr>
                <p><em>If you receive this email, nodemailer is working correctly!</em></p>
            `
        });
        
        console.log('✅ Email sent successfully!');
        console.log('📧 Message ID:', info.messageId);
        console.log('📬 Check inbox: icius2026@isius.org');
        
    } catch (error) {
        console.error('❌ Email test failed:', error);
        console.error('Error details:', error.message);
    }
}

// Run the test
testEmail();
