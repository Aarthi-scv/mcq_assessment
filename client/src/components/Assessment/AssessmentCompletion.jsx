import React from "react";
import { CheckCircle, Star, FileText } from "lucide-react";

const AssessmentCompletion = ({
  submissionResult,
  user,
  feedback,
  setFeedback,
  onReturnHome,
}) => {
  return (
    <div className="container flex justify-center items-center min-height-screen fade-in">
      <div
        className="card completion-card"
        style={{ maxWidth: "600px", textAlign: "center" }}
      >
        <div className="flex justify-center mb-6">
          <div
            className="p-4 bg-secondary/10 rounded-full"
            style={{ background: "rgba(16, 185, 129, 0.1)" }}
          >
            <CheckCircle size={64} className="text-secondary" />
          </div>
        </div>
        <h1>Assessment Completed</h1>
        <p className="text-secondary mb-8">
          Assessment completed for candidate: <strong>{user?.name}</strong>{" "}
          (Batch: {user?.batch})
        </p>

        <div
          className="grid grid-cols-2 gap-4 mb-8"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}
        >
          <div className="card bg-black/30">
            <span className="block text-secondary text-xs uppercase mb-1">
              Correct Answers
            </span>
            <span className="text-2xl font-bold text-secondary">
              {submissionResult.correct}
            </span>
          </div>
          <div className="card bg-black/30">
            <span className="block text-secondary text-xs uppercase mb-1">
              Incorrect Answers
            </span>
            <span className="text-2xl font-bold text-danger">
              {submissionResult.wrong}
            </span>
          </div>
        </div>

        <div
          className="card mb-8 py-6"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,245,255,0.1), transparent)",
          }}
        >
          <span className="block text-secondary text-sm uppercase mb-2">
            Final Score
          </span>
          <div
            style={{
              fontSize: "4rem",
              fontWeight: 900,
              color: "var(--primary-color)",
            }}
          >
            {submissionResult.score}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="mb-4">Internal System Feedback</h3>
          <div className="flex justify-center gap-3 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() =>
                  setFeedback((prev) => ({ ...prev, rating: star }))
                }
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <Star
                  size={32}
                  fill={
                    feedback.rating >= star ? "var(--warning-color)" : "none"
                  }
                  className={
                    feedback.rating >= star ? "text-warning" : "text-gray-600"
                  }
                />
              </button>
            ))}
          </div>
          <textarea
            placeholder="Operational observations..."
            value={feedback.comment}
            onChange={(e) =>
              setFeedback((prev) => ({ ...prev, comment: e.target.value }))
            }
            style={{ minHeight: "100px" }}
          />
        </div>

        <div className="flex flex-col gap-3">
          <button className="btn btn-primary w-full" onClick={onReturnHome}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentCompletion;
