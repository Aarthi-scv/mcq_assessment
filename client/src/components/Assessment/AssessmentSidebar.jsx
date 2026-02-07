import React from "react";

const AssessmentSidebar = ({
  user,
  questions,
  answers,
  revisitWork,
  onQuestionClick,
  onSubmit,
}) => {
  const answeredCount = Object.keys(answers).length;
  const totalCount = questions.length;

  return (
    <div className="drawer-container">
      <div className="mb-2">
        <h3 className="text-lg font-bold mb-2">Candidate Info</h3>
        <div className="p-4 bg-white/5 rounded-xl border border-white/5">
          <div className="text-sm text-secondary mb-1">
            Name: <span>{user?.name}</span>{" "}
          </div>
          <div className="text-sm text-secondary mb-1">
            Batch: <span className="badge badge-primary">{user?.batch}</span>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-bold mb-2">Test Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-center">
            <div className="text-2xl font-bold text-secondary">
              {answeredCount}
            </div>
            <div className="text-xs text-secondary uppercase">Answered</div>
          </div>
          <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-center">
            <div className="text-2xl font-bold" style={{ opacity: 0.5 }}>
              {totalCount - answeredCount}
            </div>
            <div className="text-xs text-secondary uppercase">Remaining</div>
          </div>
        </div>
      </div>

      <div className="mb-8 overflow-y-auto pr-2 no-scrollbar">
        <h3 className="text-sm font-bold uppercase tracking-wider text-secondary mb-4">
          Question Palette
        </h3>
        <div className="question-grid">
          {questions.map((q, idx) => (
            <div
              key={q._id}
              className={`q-badge ${answers[q._id] ? "answered" : ""} ${revisitWork.has(q._id) ? "review" : ""}`}
              onClick={() => onQuestionClick(idx)}
            >
              {idx + 1}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-white/5">
        <div className="mb-6 space-y-2">
          <div className="flex items-center gap-3 text-xs text-secondary">
            <div
              className="w-4 h-4 rounded bg-secondary"
              style={{ background: "var(--secondary-color)" }}
            ></div>
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-secondary">
            <div
              className="w-4 h-4 rounded bg-warning"
              style={{ background: "var(--warning-color)" }}
            ></div>
            <span>Marked for Review</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-secondary">
            <div className="w-4 h-4 rounded border border-white/20"></div>
            <span>Not Attempted</span>
          </div>
        </div>

        <button
          className="btn btn-primary w-full"
          style={{ height: "56px", borderRadius: "12px" }}
          onClick={() => onSubmit(false)}
        >
          Submit Assessment
        </button>
      </div>
    </div>
  );
};

export default AssessmentSidebar;
