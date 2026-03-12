import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { User, Mail, Layers, ShieldCheck, KeyRound, RefreshCw } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Register = () => {
  const [step, setStep] = useState(1); // 1 = fill details, 2 = verify OTP
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    batch: "",
  });
  const [batches, setBatches] = useState([]);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    const storedUser = localStorage.getItem("candidateUser");
    const token = localStorage.getItem("candidateToken");
    if (storedUser && token) {
      navigate("/candidate-dashboard");
    }
  }, [navigate]);

  // Load batches on mount
  React.useEffect(() => {
    const fetchBatches = async () => {
      try {
        const response = await axios.get(`${API_URL}/batches`);
        setBatches(response.data);
      } catch (err) {
        console.error("Failed to fetch batches:", err);
      }
    };
    fetchBatches();
  }, []);

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/send-otp`, formData);
      toast.success("OTP sent! Please check your email.");
      setStep(2);
      startResendCooldown();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP & Register ───────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      return toast.error("Please enter the full 6-digit OTP");
    }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/register`, {
        email: formData.email,
        otp,
      });
      toast.success("Registration successful! Please login.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP with cooldown ─────────────────────────────────────────────────
  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await axios.post(`${API_URL}/send-otp`, formData);
      toast.success("New OTP sent! Please check your email.");
      startResendCooldown();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-height-screen fade-in">
      <div className="card" style={{ maxWidth: "450px", width: "100%" }}>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div
              style={{
                background: "rgba(0, 245, 255, 0.1)",
                padding: "1rem",
                borderRadius: "12px",
              }}
            >
              {step === 1
                ? <ShieldCheck size={32} className="text-primary" />
                : <KeyRound size={32} className="text-primary" />
              }
            </div>
          </div>
          <h2 className="justify-center">
            {step === 1 ? "Register your details" : "Verify your email"}
          </h2>
          {step === 2 && (
            <p className="text-secondary text-sm mt-2">
              A 6-digit OTP was sent to <strong>{formData.email}</strong>
            </p>
          )}
        </div>

        {/* ── STEP 1: Registration Form ── */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="mb-4">
              <label className="flex items-center gap-2">
                <User size={16} /> Candidate Name
              </label>
              <input
                type="text"
                placeholder="Enter full name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2">
                <Mail size={16} /> Email
              </label>
              <input
                type="email"
                placeholder="candidate@email.com"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-2">
                <Layers size={16} /> Assigned Batch
              </label>
              <select
                required
                value={formData.batch}
                onChange={(e) =>
                  setFormData({ ...formData, batch: e.target.value })
                }
              >
                <option value="" disabled>
                  Select Batch Designation
                </option>
                {batches.map((b) => (
                  <option key={b._id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* ── STEP 2: OTP Verification Form ── */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div className="mb-6">
              <label className="flex items-center gap-2">
                <KeyRound size={16} /> Enter OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                required
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                style={{ letterSpacing: "0.4em", fontSize: "1.4rem", textAlign: "center" }}
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify & Register"}
            </button>

            {/* Resend + Go Back */}
            <div className="flex items-center justify-between mt-4" style={{ gap: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-secondary text-sm"
                style={{ flex: 1 }}
                onClick={() => { setStep(1); setOtp(""); }}
              >
                ← Go Back
              </button>
              <button
                type="button"
                className="btn btn-secondary text-sm"
                style={{ flex: 1 }}
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || loading}
              >
                <RefreshCw size={14} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend OTP"}
              </button>
            </div>
          </form>
        )}

        <p className="text-center mt-6 text-sm text-secondary">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary"
            style={{ textDecoration: "none" }}
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
