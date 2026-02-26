/**
 * In-memory OTP store.
 * Each entry: { otp, expiresAt, name, batch }
 * Keyed by email address (lowercased).
 * OTPs expire after 10 minutes and are purged on use or expiry.
 */

const store = new Map();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

/** Generate and store a 6-digit OTP for the given email */
function setOtp(email, otp, metadata = {}) {
    store.set(email.toLowerCase(), {
        otp: String(otp),
        expiresAt: Date.now() + OTP_TTL_MS,
        ...metadata,
    });
}

/** Retrieve the stored record for an email (or null if missing/expired) */
function getOtp(email) {
    const record = store.get(email.toLowerCase());
    if (!record) return null;
    if (Date.now() > record.expiresAt) {
        store.delete(email.toLowerCase());
        return null;
    }
    return record;
}

/** Delete the OTP record after successful verification */
function deleteOtp(email) {
    store.delete(email.toLowerCase());
}

module.exports = { setOtp, getOtp, deleteOtp };
