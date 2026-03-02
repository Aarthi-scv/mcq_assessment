import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  FileText,
  User,
  Calendar,
  ArrowLeft,
  Code2,
  FlaskConical,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import CodeHighlighter from "./Assessment/CodeHighlighter";
import "./AssessmentReport.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || "http://localhost:5000/uploads";

// ── Coding Submission Report ──────────────────────────────────────────────────
const CodingReport = ({ data, navigate }) => (
  <div className="container fade-in report-container">
    <div className="flex justify-between items-center mb-8">
      <button className="btn btn-secondary back-button" onClick={() => navigate("/candidate-dashboard")}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>
    </div>

    <div className="card mb-8">
      <h1 className="mb-6" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Code2 size={22} style={{ color: "#818cf8" }} /> Coding Assessment Report
      </h1>
      <div className="summary-details-grid">
        <div className="flex items-center gap-3">
          <User size={20} className="text-primary" />
          <div>
            <div className="text-xs text-secondary">Candidate</div>
            <div className="font-bold">{data.userName}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Calendar size={20} className="text-primary" />
          <div>
            <div className="text-xs text-secondary">Submitted</div>
            <div className="font-bold">{new Date(data.submittedAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>
      <div className="stats-grid" style={{ marginTop: "1.5rem" }}>
        <div className="card stat-item">
          <div className="stat-label">Total Score</div>
          <div className="stat-value text-primary">{data.totalScore ?? 0}</div>
        </div>
        <div className="card stat-item">
          <div className="stat-label">Max Score</div>
          <div className="stat-value">{data.maxScore ?? 0}</div>
        </div>
        <div className="card stat-item">
          <div className="stat-label">Questions</div>
          <div className="stat-value">{data.questions?.length ?? 0}</div>
        </div>
      </div>
    </div>

    <h2 className="mb-6 flex items-center gap-2">
      <FlaskConical size={22} className="text-primary" /> Question Details
    </h2>

    <div className="flex flex-col gap-6">
      {data.questions?.map((q, qi) => (
        <div key={qi} className="card question-card-report" style={{ borderLeft: `4px solid ${(q.score ?? 0) > 0 ? "var(--secondary-color)" : "var(--danger-color)"}` }}>
          <div className="flex justify-between items-start mb-4">
            <h3 className="q-header">
              <span className="q-number-report">Q{qi + 1}.</span> {q.questionText}
            </h3>
            <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--primary-color)", whiteSpace: "nowrap", marginLeft: "1rem" }}>
              {q.score ?? 0} / {q.maxScore ?? 3} pts
            </span>
          </div>

          {/* Code submitted */}
          {q.code && (
            <div style={{ marginBottom: "1rem" }}>
              <div className="text-xs text-secondary mb-1" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>Code Submitted</div>
              <pre style={{
                background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "8px", padding: "0.75rem 1rem",
                fontFamily: "JetBrains Mono, Courier New, monospace",
                fontSize: "0.8rem", lineHeight: 1.7,
                overflowX: "auto", whiteSpace: "pre",
                color: "#e4e4e7", maxHeight: "280px", overflowY: "auto"
              }}>{q.code}</pre>
            </div>
          )}

          {/* Test case results */}
          <div className="flex flex-col gap-2">
            {q.testCaseResults?.map((tc, ti) => (
              <div key={ti} style={{
                padding: "0.6rem 0.85rem", borderRadius: "8px",
                border: `1px solid ${tc.passed ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)"}`,
                background: tc.passed ? "rgba(16,185,129,0.04)" : "rgba(239,68,68,0.04)"
              }}>
                <div className="flex justify-between items-center mb-2">
                  <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>Case {ti + 1}</span>
                  {tc.passed
                    ? <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.68rem", color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "0.1rem 0.5rem", borderRadius: "99px", border: "1px solid rgba(16,185,129,0.2)" }}><CheckCircle2 size={11} /> Passed (+1 pt)</span>
                    : <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.68rem", color: "#ef4444", background: "rgba(239,68,68,0.1)", padding: "0.1rem 0.5rem", borderRadius: "99px", border: "1px solid rgba(239,68,68,0.2)" }}><XCircle size={11} /> Failed</span>
                  }
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", fontSize: "0.75rem" }}>
                  <div>
                    <div className="text-secondary" style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Input</div>
                    <pre style={{ margin: 0, fontFamily: "monospace", background: "rgba(0,0,0,0.2)", padding: "0.2rem 0.4rem", borderRadius: "4px", fontSize: "0.72rem", whiteSpace: "pre-wrap" }}>{tc.input || "(none)"}</pre>
                  </div>
                  <div>
                    <div className="text-secondary" style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Expected</div>
                    <pre style={{ margin: 0, fontFamily: "monospace", background: "rgba(0,0,0,0.2)", padding: "0.2rem 0.4rem", borderRadius: "4px", fontSize: "0.72rem", whiteSpace: "pre-wrap" }}>{tc.expectedOutput}</pre>
                  </div>
                  <div>
                    <div className="text-secondary" style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Your Output</div>
                    <pre style={{ margin: 0, fontFamily: "monospace", background: tc.passed ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)", padding: "0.2rem 0.4rem", borderRadius: "4px", fontSize: "0.72rem", whiteSpace: "pre-wrap", color: tc.passed ? "#6ee7b7" : "#fca5a5" }}>{tc.actualOutput || "(empty)"}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>

    <div className="flex justify-center mt-8">
      <button className="btn btn-primary" onClick={() => navigate("/candidate-dashboard")}>
        Return to Dashboard
      </button>
    </div>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
const AssessmentReport = () => {
  const navigate = useNavigate();
  const { submissionId } = useParams();
  const [reportData, setReportData] = useState(null);
  const [reportType, setReportType] = useState("mcq");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const isAdmin = !!localStorage.getItem("adminToken");
        const res = await axios.get(`${API_URL}/assessment-report/${submissionId}`);
        const data = res.data;

        // ── 1-Hour Security Check for Candidates ──────────────────────────
        if (!isAdmin && data.submittedAt) {
          const submissionTime = new Date(data.submittedAt).getTime();
          const currentTime = new Date().getTime();
          const oneHourInMs = 60 * 60 * 1000;
          if (currentTime - submissionTime < oneHourInMs) {
            toast.error("Report is locked for security. Please wait 1 hour after submission.");
            navigate("/candidate-dashboard");
            return;
          }
        }

        setReportData(data);
        setReportType("mcq");
        setLoading(false);
      } catch (err) {
        if (err.response?.status === 404) {
          // Might be a coding submission — try the coding report endpoint
          try {
            const isAdmin = !!localStorage.getItem("adminToken");
            const res2 = await axios.get(`${API_URL}/coding-report/${submissionId}`);
            const data2 = res2.data;

            if (!isAdmin && data2.submittedAt) {
              const submissionTime = new Date(data2.submittedAt).getTime();
              const currentTime = new Date().getTime();
              const oneHourInMs = 60 * 60 * 1000;
              if (currentTime - submissionTime < oneHourInMs) {
                toast.error("Coding report is locked for 1 hour after submission.");
                navigate("/candidate-dashboard");
                return;
              }
            }

            setReportData(data2);
            setReportType("coding");
            setLoading(false);
            return;
          } catch {
            // not found in either collection
          }
        }
        toast.error("Failed to load assessment report");
        setLoading(false);
      }
    };
    fetchReport();
  }, [submissionId, navigate]);

  if (loading) {
    return (
      <div className="container flex justify-center items-center h-screen">
        <div className="animate-pulse text-primary">Loading Report...</div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="container flex justify-center items-center h-screen">
        <div className="card text-center p-8">
          <p className="text-danger mb-4">Report not found</p>
          <button className="btn btn-secondary" onClick={() => navigate("/candidate-dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (reportType === "coding") {
    return <CodingReport data={reportData} navigate={navigate} />;
  }

  // ── MCQ Report ──────────────────────────────────────────────────────────────
  return (
    <div className="container fade-in report-container">
      <div className="flex justify-between items-center mb-8">
        <button className="btn btn-secondary back-button" onClick={() => navigate("/candidate-dashboard")}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      <div className="card mb-8">
        <h1 className="mb-6">Assessment Report</h1>
        <div className="summary-details-grid">
          <div className="flex items-center gap-3">
            <User size={20} className="text-primary" />
            <div>
              <div className="text-xs text-secondary">Candidate</div>
              <div className="font-bold">{reportData.userName}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar size={20} className="text-primary" />
            <div>
              <div className="text-xs text-secondary">Submitted</div>
              <div className="font-bold">{new Date(reportData.submittedAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="card stat-item">
            <div className="stat-label">Score</div>
            <div className="stat-value text-primary">{reportData.score}</div>
          </div>
          <div className="card stat-item">
            <div className="stat-label">Correct</div>
            <div className="stat-value text-secondary">{reportData.correct}</div>
          </div>
          <div className="card stat-item">
            <div className="stat-label">Wrong</div>
            <div className="stat-value text-danger">{reportData.wrong}</div>
          </div>
          <div className="card stat-item">
            <div className="stat-label">Total</div>
            <div className="stat-value">{reportData.totalQuestions}</div>
          </div>
        </div>
      </div>

      <h2 className="mb-6 flex items-center gap-2">
        <FileText size={24} className="text-primary" /> Detailed Review
      </h2>

      <div className="flex flex-col gap-6">
        {reportData.report.map((item, index) => (
          <div
            key={index}
            className="card question-card-report"
            style={{ borderLeft: `4px solid ${item.isCorrect ? "var(--secondary-color)" : "var(--danger-color)"}` }}
          >
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex justify-between items-start">
                <div style={{ flex: 1 }}>
                  <h3 className="q-header">
                    <span className="q-number-report">Q{index + 1}.</span>
                    {item.questionText}
                  </h3>
                  {item.questionType === "code" && item.codeSnippet && (
                    <CodeHighlighter code={item.codeSnippet} />
                  )}
                </div>
                <div className="flex items-center gap-2" style={{ marginLeft: "1rem", flexShrink: 0 }}>
                  {item.isCorrect ? (
                    <CheckCircle size={24} className="text-secondary" />
                  ) : item.userAnswer ? (
                    <XCircle size={24} className="text-danger" />
                  ) : (
                    <span className="text-xs px-2 py-1 bg-white/5 rounded border border-white/10 text-secondary">
                      Not Answered
                    </span>
                  )}
                </div>
              </div>
              {item.questionImage && (
                <div className="question-image-container" style={{ margin: 0, display: "flex", justifyContent: "center", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid var(--border-color)", padding: "10px" }}>
                  <img src={`${UPLOADS_URL}/${item.questionImage}`} alt={`Question ${index + 1}`} style={{ maxWidth: "100%", maxHeight: "300px", objectFit: "contain" }} />
                </div>
              )}
            </div>

            <div className="options-list">
              {Object.entries(item.options).map(([key, text]) => {
                const isUserAnswer = item.userAnswer === key;
                const isCorrectAnswer = item.correctAnswer === key;
                let optionClass = "option-item";
                if (isCorrectAnswer) optionClass += " correct";
                else if (isUserAnswer) optionClass += " wrong";
                return (
                  <div key={key} className={optionClass}>
                    <span className="option-key-report">{key}</span>
                    <span className="option-text">{text}</span>
                    {isUserAnswer && !isCorrectAnswer && <span className="option-badge text-danger">Your Answer</span>}
                    {isCorrectAnswer && <span className="option-badge text-secondary">Correct Answer</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <button className="btn btn-primary" onClick={() => navigate("/candidate-dashboard")}>
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default AssessmentReport;
