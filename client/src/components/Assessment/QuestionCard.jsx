import React from "react";
import { RotateCcw, Bookmark, BookmarkCheck } from "lucide-react";
import "./QuestionCard.css";

const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || "http://localhost:5000/uploads";

const QuestionCard = ({
  question,
  index,
  selectedOption,
  isMarkedForReview,
  onSelect,
  onClear,
  onToggleReview,
}) => {
  const isCode = question.questionType === "code";

  return (
    <div id={`q-${index}`} className="card question-card flex flex-col">
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <span className="question-number">Question {index + 1}</span>
          {isCode ? (
            /* Code-type question: full monospace block, no scroll */
            <pre
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: "0.88rem",
                lineHeight: 1.7,
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                padding: "1rem",
                marginTop: "0.6rem",
                whiteSpace: "pre-wrap",      /* wrap long lines */
                wordBreak: "break-word",
                overflowX: "hidden",         /* no horizontal scroll */
                color: "var(--text-primary)",
              }}
            >
              {question.questionText}
            </pre>
          ) : (
            <h3 className="question-title" style={{ marginTop: "0.4rem" }}>
              {question.questionText}
            </h3>
          )}
        </div>

        {question.questionImage && (
          <div className="question-image-container">
            <img
              src={`${UPLOADS_URL}/${question.questionImage}`}
              alt={`Question ${index + 1}`}
              className="question-image"
            />
          </div>
        )}
      </div>

      <div className="options-grid">
        {Object.entries(question.options).map(
          ([key, text]) =>
            text && (
              <button
                key={key}
                className={`option-button ${selectedOption === key ? "selected" : ""}`}
                onClick={() => onSelect(question._id, key)}
              >
                <span className="option-key">{key}</span>
                {text}
              </button>
            ),
        )}
      </div>

      <div className="card-footer">
        <div className="flex gap-3">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onClear(question._id)}
            disabled={!selectedOption}
          >
            <RotateCcw size={14} /> Clear Selection
          </button>
          <button
            className={`btn btn-sm ${isMarkedForReview ? "review-btn-active" : "btn-secondary"}`}
            onClick={() => onToggleReview(question._id)}
          >
            {isMarkedForReview ? (
              <BookmarkCheck size={14} />
            ) : (
              <Bookmark size={14} />
            )}
            {isMarkedForReview ? "Marked for Review" : "Mark for Review"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
