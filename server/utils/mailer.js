const nodemailer = require('nodemailer');

/**
 * Creates a nodemailer transporter using Gmail SMTP credentials from .env
 * Required env vars:
 *   MAIL_USER  – Gmail address (e.g. yourapp@gmail.com)
 *   MAIL_PASS  – Gmail App Password (not your regular password)
 */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

/**
 * Sends a 6-digit OTP to the candidate's email.
 * @param {string} toEmail   Recipient email address
 * @param {string} name      Candidate's name (for personalisation)
 * @param {string} otp       6-digit OTP string
 */
async function sendOtpEmail(toEmail, name, otp) {
    const mailOptions = {
        from: `"MCQ Assessment Platform" <${process.env.MAIL_USER}>`,
        to: toEmail,
        subject: 'Your OTP for Registration – MCQ Assessment',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;
                  background: #0d1117; color: #e6edf3; padding: 32px; border-radius: 12px;
                  border: 1px solid #30363d;">
        <h2 style="color: #00f5ff; margin-bottom: 8px;">MCQ Assessment Platform</h2>
        <p style="color: #8b949e; margin-bottom: 24px;">Email Verification</p>

        <p>Hi <strong>${name}</strong>,</p>
        <p>Use the OTP below to complete your registration. It expires in <strong>10 minutes</strong>.</p>

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

    await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail };
