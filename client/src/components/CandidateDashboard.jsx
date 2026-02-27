import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  User,
  Layers,
  Clock,
  Play,
  AlertCircle,
  LogOut,
  Cpu,
  CheckCircle,
  FileText,
  Radio,
  Code2,
} from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const CandidateDashboard = () => {
  const [user, setUser] = useState(null);
  const [activeModule, setActiveModule] = useState(null);
  const [activeCodingModule, setActiveCodingModule] = useState(null);
  const [codingSubmissions, setCodingSubmissions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false); // live indicator
  const navigate = useNavigate();

  // Keep refs so the interval callback always has current values
  const activeModuleRef = useRef(null);
  const batchRef = useRef(null);
  const pollingInterval = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("candidateUser");
    const token = localStorage.getItem("candidateToken");
    if (!storedUser || !token) { navigate("/login"); return; }

    const userData = JSON.parse(storedUser);
    setUser(userData);
    batchRef.current = userData.batch;

    // Initial fetch
    fetchActiveAssessment(userData.batch);
    fetchActiveCodingAssessment(userData.batch);
    fetchUserSubmissions(userData.name, token);
    fetchUserCodingSubmissions(userData.name, token);

    // ── Auto-poll every 5 s for an active assessment ──────────────────────
    setIsPolling(true);
    pollingInterval.current = setInterval(async () => {
      // Stop polling once we have an active module already
      if (activeModuleRef.current) {
        clearInterval(pollingInterval.current);
        setIsPolling(false);
        return;
      }
      try {
        const res = await axios.get(
          `${API_URL}/active-assessment/${batchRef.current}`
        );
        if (res.data && res.data._id) {
          activeModuleRef.current = res.data;
          setActiveModule(res.data);
          clearInterval(pollingInterval.current);
          setIsPolling(false);
          // Notify candidate
          toast("🚀 Your assessment is now live! Click to begin.", {
            duration: 8000,
            style: {
              background: "#0f172a",
              color: "#fff",
              border: "1px solid var(--primary-color)",
              borderRadius: "10px",
            },
          });
        }
      } catch {
        // No active session yet — keep waiting silently
      }
    }, 5000); // poll every 5 seconds

    return () => clearInterval(pollingInterval.current); // cleanup on unmount
  }, [navigate]);

  const fetchActiveAssessment = async (batch) => {
    try {
      const res = await axios.get(`${API_URL}/active-assessment/${batch}`);
      activeModuleRef.current = res.data || null;
      setActiveModule(res.data);
      // If already active on initial load, stop polling immediately
      if (res.data && res.data._id) {
        clearInterval(pollingInterval.current);
        setIsPolling(false);
      }
    } catch (err) {
      console.log("No active assessment for this batch.");
      setActiveModule(null);
    }
  };

  const fetchActiveCodingAssessment = async (batch) => {
    try {
      const res = await axios.get(`${API_URL}/active-coding-assessment/${batch}`);
      if (res.data?._id) setActiveCodingModule(res.data);
    } catch { /* none active */ }
  };

  const fetchUserCodingSubmissions = async (userName, token) => {
    try {
      const tkn = token || localStorage.getItem("candidateToken");
      const res = await axios.get(
        `${API_URL}/candidate-coding-submissions/${encodeURIComponent(userName)}`,
        { headers: { Authorization: `Bearer ${tkn}` } }
      );
      setCodingSubmissions(res.data || []);
    } catch { /* ignore */ }
  };

  const fetchUserSubmissions = async (userName, token) => {
    try {
      const tkn = token || localStorage.getItem("candidateToken");
      const res = await axios.get(
        `${API_URL}/candidate-submissions/${userName}`,
        { headers: { Authorization: `Bearer ${tkn}` } }
      );
      setSubmissions(res.data);
    } catch (err) {
      console.log("Error fetching submissions");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("candidateUser");
    localStorage.removeItem("candidateToken");
    navigate("/login");
  };

  const startAssessment = () => {
    if (activeModule) {
      // Pass the moduleId so AssessmentPage knows which one to load
      navigate("/assessment", { state: { moduleId: activeModule._id } });
    }
  };

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-height-screen">
        <div className="animate-pulse text-primary">
          Synchronizing Access Control...
        </div>
      </div>
    );
  }

  return (
    <div className="container fade-in">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl" style={{ marginBottom: "0.5rem" }}>Candidate Dashboard</h1>
          <p className="text-secondary">Welcome back, {user?.name}</p>
        </div>
        <button className="btn btn-secondary" onClick={handleLogout}>
          <LogOut size={18} /> Logout
        </button>
      </header>

      <div className="grid gap-8" style={{ gridTemplateColumns: "1fr 2fr" }}>
        {/* Profile Card */}
        <div className="card">
          <h3 className="mb-6 flex items-center gap-2">
            <User size={20} className="text-primary" /> Candidate Profile
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-secondary block mb-1">
                DESIGNATION
              </label>
              <div className="font-bold">{user?.name}</div>
            </div>
            <div>
              <label className="text-xs text-secondary block mb-1">
                SYSTEM EMAIL
              </label>
              <div className="font-bold">{user?.email}</div>
            </div>
            <div>
              <label className="text-xs text-secondary block mb-1">
                ASSIGNED BATCH
              </label>
              <div className="badge badge-primary">{user?.batch}</div>
            </div>
          </div>

          {/* Submissions Section */}
          <div className="mt-8 pt-8 border-t border-white/5">
            <h3 className="mb-4 text-sm flex items-center gap-2">
              <Layers size={16} className="text-secondary" /> Recent Activity
            </h3>
            <div className="space-y-3">
              {submissions.length > 0 ? (
                submissions.map((sub) => (
                  <div
                    key={sub._id}
                    className="p-3 bg-white/5 rounded-lg border border-white/5"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-secondary">
                        {new Date(sub.submittedAt).toLocaleDateString()}
                      </span>
                      <span className="font-bold text-primary">
                        {sub.score} Pts
                      </span>
                    </div>
                    <button
                      className="btn btn-secondary w-full text-xs"
                      style={{ padding: "0.4rem" }}
                      onClick={() => navigate(`/assessment-report/${sub._id}`)}
                    >
                      View Report
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-secondary italic">
                  No previous submissions found.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Coding Assessment Card */}
        {activeCodingModule && (() => {
          const alreadySubmitted = codingSubmissions.some(
            s => s.moduleId?.toString() === activeCodingModule._id?.toString()
          );
          return (
            <div className="card" style={{ borderColor: "rgba(129,140,248,0.3)" }}>
              <h3 className="mb-4 flex items-center gap-2">
                <Code2 size={20} style={{ color: "#818cf8" }} /> Coding Assessment
              </h3>
              <div style={{ background: "rgba(129,140,248,0.06)", border: "1px solid rgba(129,140,248,0.2)", borderRadius: "12px", padding: "1.25rem" }}>
                <h2 style={{ margin: "0 0 0.5rem", color: "#818cf8", fontSize: "1.05rem" }}>{activeCodingModule.title}</h2>
                <div className="flex gap-2 mb-4">
                  <span className="badge">{activeCodingModule.questions.length} Questions</span>
                  <span className="badge"><Clock size={11} /> {activeCodingModule.timer} min</span>
                </div>
                {alreadySubmitted ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem", borderRadius: "8px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981", fontSize: "0.88rem", fontWeight: 600 }}>
                    <CheckCircle size={16} /> You have already submitted this coding assessment.
                  </div>
                ) : (
                  <>
                    <p className="text-secondary" style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>
                      A coding assessment has been assigned to your batch. Each question has test cases — run your code and submit.
                    </p>
                    <button
                      className="btn w-full"
                      style={{ background: "rgba(129,140,248,0.15)", color: "#818cf8", border: "1px solid rgba(129,140,248,0.3)" }}
                      onClick={() => navigate(`/coding-assessment?moduleId=${activeCodingModule._id}`)}
                    >
                      <Code2 size={16} /> Start Coding Assessment
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* Assessment Card */}
        <div className="card">
          <h3 className="mb-6 flex items-center gap-2">
            <Cpu size={20} className="text-primary" /> Active Payload
            Transmission
          </h3>

          {activeModule ? (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 style={{ margin: 0, color: "var(--primary-color)" }}>
                    {activeModule.topicName}
                  </h2>
                  <div className="flex gap-2 mt-2">
                    <span className="badge">{activeModule.courseType}</span>
                    <span className="badge">
                      {activeModule.difficultyLevel}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Clock size={18} /> {activeModule.timer} MINS
                </div>
              </div>

              <p className="text-secondary mb-8">
                Your batch ({user?.batch}) has been authorized for this
                assessment. Please ensure you have a stable connection before
                initiating the sequence.
              </p>

              {submissions.some((s) => s.moduleId === activeModule._id) ? (
                <div className="flex flex-col gap-4">
                  <div
                    className="p-4 rounded-xl border border-secondary/30 bg-secondary/10 text-center"
                    style={{ borderStyle: "dashed" }}
                  >
                    <CheckCircle
                      className="mx-auto mb-2 text-secondary"
                      size={32}
                    />
                    <div className="font-bold text-secondary uppercase tracking-wider text-sm">
                      Missions Objectives Completed
                    </div>
                    <p className="text-xs text-secondary mt-1 opacity-70">
                      Assessment data has been synchronized and locked.
                    </p>
                  </div>
                  <button
                    className="btn btn-secondary w-full flex items-center justify-center gap-2 text-4xl"
                    onClick={() => {
                      const sub = submissions.find(
                        (s) => s.moduleId === activeModule._id,
                      );
                      if (sub) navigate(`/assessment-report/${sub._id}`);
                    }}
                  >
                    <FileText size={18} /> View Detailed Assessment Report
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-primary w-full"
                  onClick={startAssessment}
                >
                  <Play size={18} fill="currentColor" /> Initialize Assessment
                  Sequence
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-xl">
              <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-secondary">
                No active assessment modules found for batch {user?.batch}.
              </p>
              <p className="text-xs text-secondary mt-2">
                Please wait for admin authorization.
              </p>
              {/* Live polling indicator */}
              {isPolling && (
                <div
                  className="flex items-center justify-center gap-2 mt-5"
                  style={{ color: "var(--primary-color)", fontSize: "0.75rem" }}
                >
                  <Radio size={13} className="animate-pulse" />
                  <span style={{ opacity: 0.7 }}>
                    Listening for admin activation&hellip;
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;
