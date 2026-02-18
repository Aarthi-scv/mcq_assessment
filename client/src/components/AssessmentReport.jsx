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
} from "lucide-react";
import toast from "react-hot-toast";
import "./AssessmentReport.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || "http://localhost:5000/uploads";

const AssessmentReport = () => {
  const navigate = useNavigate();
  const { submissionId } = useParams();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/assessment-report/${submissionId}`,
        );
        setReportData(res.data);
        setLoading(false);
      } catch (err) {
        toast.error("Failed to load assessment report");
        setLoading(false);
      }
    };
    fetchReport();
  }, [submissionId]);

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
          <button
            className="btn btn-secondary"
            onClick={() => navigate("/candidate-dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container fade-in report-container">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <button
          className="btn btn-secondary back-button"
          onClick={() => navigate("/candidate-dashboard")}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>

      {/* Summary Card */}
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
              <div className="font-bold">
                {new Date(reportData.submittedAt).toLocaleDateString()}
              </div>
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
            <div className="stat-value text-secondary">
              {reportData.correct}
            </div>
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

      {/* Questions Review */}
      <h2 className="mb-6 flex items-center gap-2">
        <FileText size={24} className="text-primary" />
        Detailed Review
      </h2>

      <div className="flex flex-col gap-6">
        {reportData.report.map((item, index) => (
          <div
            key={index}
            className="card question-card-report"
            style={{
              borderLeft: `4px solid ${item.isCorrect ? "var(--secondary-color)" : "var(--danger-color)"}`,
            }}
          >
            {/* Question Header */}
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex justify-between items-start">
                <h3 className="q-header">
                  <span className="q-number-report">Q{index + 1}.</span>
                  {item.questionText}
                </h3>
                <div className="flex items-center gap-2">
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
                <div
                  className="question-image-container"
                  style={{
                    margin: "0",
                    display: "flex",
                    justifyContent: "center",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    padding: "10px",
                  }}
                >
                  <img
                    src={`${UPLOADS_URL}/${item.questionImage}`}
                    alt={`Question ${index + 1}`}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "300px",
                      objectFit: "contain",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Options */}
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
                    {isUserAnswer && !isCorrectAnswer && (
                      <span className="option-badge text-danger">
                        Your Answer
                      </span>
                    )}
                    {isCorrectAnswer && (
                      <span className="option-badge text-secondary">
                        Correct Answer
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex justify-center mt-8">
        <button
          className="btn btn-primary"
          onClick={() => navigate("/candidate-dashboard")}
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};

export default AssessmentReport;
