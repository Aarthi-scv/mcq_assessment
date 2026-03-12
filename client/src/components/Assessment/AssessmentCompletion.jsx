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
        <p className="text-secondary mb-4">
          Assessment completed for candidate: <strong>{user?.name}</strong>{" "}
          (Batch: {user?.batch})
        </p>
        <p className="text-secondary mb-4">
          Your responses have been successfully submitted.
        </p>
        <p className="text-secondary mb-4">
          Score will be updated soon in dashboard
        </p>
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
          <button className="btn-large btn-primary w-full" onClick={onReturnHome}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentCompletion;
