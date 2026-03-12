/**
 * Quick test: run with `node test-mailer.js`
 * Tests the SMTP configuration defined in your .env file.
 */
require('dotenv').config();
const nodemailer = require('nodemailer');

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

console.log('\n=== SMTP Configuration Test ===');
console.log('SMTP_HOST:', host || '❌ NOT SET');
console.log('SMTP_PORT:', port || '❌ NOT SET (defaulting to 587)');
console.log('SMTP_USER:', user || '❌ NOT SET');
console.log('SMTP_PASS:', pass ? `✅ SET (${pass.length} chars)` : '❌ NOT SET');

if (!host || !user || !pass) {
    console.error('\n❌ Required SMTP credentials are missing in .env');
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    host: host,
    port: parseInt(port || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
});

console.log(`\nConnecting to ${host}:${port || 587} ...`);

transporter.verify((error) => {
    if (error) {
        console.error('\n❌ FAILED:', error.code, '–', error.message);
        console.error('\n👉 Troubleshooting Tips:');
        console.log('1. Check if your SMTP host and port are correct.');
        console.log('2. Ensure your SMTP user and password (or App Password) are correct.');
        console.log('3. If using a VPS like Hetzner, check if the outbound port (e.g., 587) is blocked by a firewall.');
        console.log('4. Try setting SMTP_SECURE=true if using port 465.');
    } else {
        console.log('\n✅ SUCCESS — SMTP credentials are valid!');
        console.log('The server can now send OTP emails using Nodemailer.');
    }
    process.exit(error ? 1 : 0);
});

