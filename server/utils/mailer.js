const { Resend } = require('resend');

/**
 * Sends a 6-digit OTP to the candidate's email via Resend HTTP API.
 * Uses HTTPS (port 443) — works on ALL cloud platforms including Render free tier.
 *
 * Required env var:
 *   RESEND_API_KEY  – from resend.com dashboard
 *   MAIL_FROM       – verified sender address  e.g.  noreply@yourdomain.com
 *                     (use  onboarding@resend.dev  if you have no custom domain yet)
 *
 * @param {string} toEmail  Recipient email
 * @param {string} name     Candidate name (personalisation)
 * @param {string} otp      6-digit OTP string
 */
async function sendOtpEmail(toEmail, name, otp) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set in environment variables.');
  }

  const resend = new Resend(apiKey);

  // MAIL_FROM should be a verified sender in your Resend dashboard.
  // If you haven't verified a domain yet, use: onboarding@resend.dev
  const from = process.env.MAIL_FROM || 'onboarding@resend.dev';

  const { data, error } = await resend.emails.send({
    from: `MCQ Assessment Platform <${from}>`,
    to: [toEmail],
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
  });

  if (error) {
    console.error('Resend error:', error);
    throw new Error(error.message || 'Failed to send email via Resend');
  }

  console.log('OTP email sent via Resend:', data?.id, '→', toEmail);
  return data;
}

module.exports = { sendOtpEmail };
