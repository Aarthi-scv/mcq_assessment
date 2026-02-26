/**
 * Quick test: run with  node test-mailer.js
 * Tests that MAIL_USER + MAIL_PASS can authenticate with Gmail SMTP on port 587.
 */
require('dotenv').config();
const nodemailer = require('nodemailer');

const user = process.env.MAIL_USER;
const pass = process.env.MAIL_PASS;

console.log('\n=== Gmail SMTP Test (port 587 / STARTTLS) ===');
console.log('MAIL_USER:', user || '❌ NOT SET');
console.log('MAIL_PASS:', pass ? `✅ SET (${pass.length} chars)` : '❌ NOT SET');

if (!user || !pass || user === 'your_gmail@gmail.com') {
    console.error('\n❌ Credentials are missing or still using placeholder values in .env');
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
});

console.log('\nConnecting to smtp.gmail.com:587 ...');

transporter.verify((error) => {
    if (error) {
        console.error('\n❌ FAILED:', error.code, '–', error.message);
        console.error('\n👉 Fix checklist:');
        console.error('   1. 2-Step Verification must be ON  →  myaccount.google.com/security');
        console.error('   2. Use an App Password (NOT your Gmail login password)');
        console.error('      →  myaccount.google.com/apppasswords');
        console.error('   3. MAIL_USER and the Google account used for App Password must match');
        console.error('   4. On Render: add MAIL_USER + MAIL_PASS in Dashboard → Environment');
    } else {
        console.log('\n✅ SUCCESS — Gmail SMTP credentials are valid!');
        console.log('   Restart the server on Render (Manual Deploy) and OTP will work.');
    }
    process.exit(error ? 1 : 0);
});
