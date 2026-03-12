import React from "react";
import { RotateCcw, Bookmark, BookmarkCheck } from "lucide-react";
import CodeHighlighter from "./CodeHighlighter";
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
      <div className="flex flex-col gap-4 mb-2">
        <div>
          <div className="flex justify-between">

          <span className="question-number text-sm">Question {index + 1}</span>
            <button
            className={`btn btn-sm ${isMarkedForReview ? "review-btn-active" : "btn-secondary"}`}
            onClick={() => onToggleReview(question._id)}
          >
            {isMarkedForReview ? (
              <BookmarkCheck size={14} style={{marginRight:'5px'}} />
            ) : (
              <Bookmark size={14} style={{marginRight:'5px'}}/>
            )}
            {isMarkedForReview ? "Marked for Review" : "Mark for Review"}
          </button>
          </div>

          {/* Question text — always shown as a readable heading */}
          <h3 className="text-sm mb-4" style={{ marginTop: "0.4rem" }}>
            {question.questionText}
          </h3>

          {/* Code block — syntax-highlighted for code-type questions */}
          {isCode && question.codeSnippet && (
            <CodeHighlighter code={question.codeSnippet} />
          )}
        </div>

        {question.questionImage && (
          <div className="question-image-container">
            <img
              src={question.questionImage.startsWith('http')
                ? question.questionImage
                : `${UPLOADS_URL}/${question.questionImage}`}
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
                <span className=" text-sm">{key}</span>
                {text}
              </button>
            ),
        )}
      </div>

      <div className="card-footer mt-4">
        <div className="flex gap-3">
          <button
            className="btn btn-secondary "
            onClick={() => onClear(question._id)}
            disabled={!selectedOption}
          >
            <RotateCcw size={10} style={{marginRight:'5px'}} /> Clear Selection
          </button>
        
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
