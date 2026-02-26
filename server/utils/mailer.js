const axios = require('axios');

/**
 * Sends a 6-digit OTP via Brevo (ex-Sendinblue) Transactional Email API.
 * Uses HTTPS (port 443) — works on Render free tier.
 * No domain verification required — just verify your sender email once.
 *
 * Required env vars:
 *   BREVO_API_KEY  – from app.brevo.com → Settings → API Keys
 *   MAIL_FROM      – your verified sender email (e.g. aarthi7813@gmail.com)
 *
 * @param {string} toEmail  Recipient email address
 * @param {string} name     Candidate name
 * @param {string} otp      6-digit OTP string
 */
async function sendOtpEmail(toEmail, name, otp) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.MAIL_FROM;

  if (!apiKey || !fromEmail) {
    throw new Error('BREVO_API_KEY and MAIL_FROM must be set in environment variables.');
  }

  const response = await axios.post(
    'https://api.brevo.com/v3/smtp/email',
    {
      sender: {
        name: 'MCQ Assessment Platform',
        email: fromEmail,
      },
      to: [{ email: toEmail, name }],
      subject: 'Your OTP for Registration – MCQ Assessment',
      htmlContent: `
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
    },
    {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }
  );

  console.log('OTP email sent via Brevo, messageId:', response.data?.messageId, '→', toEmail);
  return response.data;
}

module.exports = { sendOtpEmail };
