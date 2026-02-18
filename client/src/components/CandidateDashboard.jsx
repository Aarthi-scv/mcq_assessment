import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const CandidateDashboard = () => {
  const [user, setUser] = useState(null);
  const [activeModule, setActiveModule] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("candidateUser");
    if (!storedUser) {
      navigate("/login");
      return;
    }
    const userData = JSON.parse(storedUser);
    setUser(userData);
    fetchActiveAssessment(userData.batch);
    fetchUserSubmissions(userData.name);
  }, [navigate]);

  const fetchActiveAssessment = async (batch) => {
    try {
      const res = await axios.get(`${API_URL}/active-assessment/${batch}`);
      setActiveModule(res.data);
    } catch (err) {
      console.log("No active assessment for this batch.");
      setActiveModule(null);
    }
  };

  const fetchUserSubmissions = async (userName) => {
    try {
      const res = await axios.get(
        `${API_URL}/candidate-submissions/${userName}`,
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;
