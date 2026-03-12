const nodemailer = require('nodemailer');

/**
 * Sends a 6-digit OTP via Nodemailer (SMTP).
 * Better for hosting on VPS like Hetzner.
 *
 * Required env vars:
 *   SMTP_HOST   – SMTP server (e.g., mail.yourdomain.com or smtp.gmail.com)
 *   SMTP_PORT   – SMTP port (587 for STARTTLS, 465 for SSL)
 *   SMTP_USER   – Your email account/username
 *   SMTP_PASS   – Your password or App Password
 *   MAIL_FROM   – The email to display as sender
 */

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // Helpful for many shared hosting/VPN environments to prevent certificate errors
    rejectUnauthorized: false
  }
});

async function sendOtpEmail(toEmail, name, otp) {
  const fromEmail = process.env.MAIL_FROM || process.env.SMTP_USER;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
     console.error('SMTP configuration missing in .env');
     throw new Error('SMTP_HOST, SMTP_USER, and SMTP_PASS must be set in environment variables.');
  }

  const mailOptions = {
    from: `"MCQ Assessment" <${fromEmail}>`,
    to: toEmail,
    subject: 'Your OTP for Registration – MCQ Assessment',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;
                  background: #0d1117; color: #e6edf3; padding: 32px; border-radius: 12px;
                  border: 1px solid #30363d;">
        <h2 style="color: #00f5ff; margin-bottom: 8px;">MCQ Assessment Platform</h2>
        <p style="color: #8b949e; margin-bottom: 24px;">Email Verification</p>

        <p>Hi <strong>${name}</strong>,</p>
        <p>Use the OTP below to complete your registration.
           It expires in <strong>10 minutes</strong>.</p>

        <div style="background: #161b22; border: 1px solid #30363d; border-radius: 8px;
                    padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 42px; letter-spacing: 12px; font-weight: 700;
                        color: #00f5ff; font-family: monospace;">${otp}</span>
        </div>

        <p style="color: #8b949e; font-size: 13px;">
          If you did not attempt to register, please ignore this email.
        </p>
        <hr style="border-color: #30363d; margin: 24px 0;" />
        <p style="color: #484f58; font-size: 12px; text-align: center;">
          MCQ Assessment Platform &bull; Do not reply to this email
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent via Nodemailer, messageId:', info.messageId, '→', toEmail);
    return info;
  } catch (error) {
    console.error('Nodemailer Error:', error.message);
    throw error;
  }
}

module.exports = { sendOtpEmail };

