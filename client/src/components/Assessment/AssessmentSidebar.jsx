import { Clock } from "lucide-react";

const AssessmentSidebar = ({
  user,
  questions,
  answers,
  revisitWork,
  timer,
  displayTime,
  onQuestionClick,
  onSubmit,
}) => {
  const answeredCount = Object.keys(answers).length;
  const totalCount = questions.length;

  return (
    <div className="drawer-container">
      {/* Premium Timer Section */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[0_0_20px_rgba(0,245,255,0.05)] backdrop-blur-xl">
        <div className={`flex items-center justify-center gap-3 border-b border-white/10 ${timer < 120 ? 'bg-danger/20' : 'bg-primary/10'}`}>
          <Clock
            size={24}
            className={timer !== null && timer < 120 ? "text-danger animate-pulse" : "text-primary"}
          />
           <div className="flex flex-col items-center">
          <span
            style={{
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: "2.4rem",
              fontWeight: "900",
              letterSpacing: "-1.5px",
              color: timer < 120 ? "var(--danger-color)" : "white",
              textShadow: "0 0 10px rgba(255,255,255,0.1)"
            }}
          >
            {displayTime}
          </span>
        </div>
        </div>
       
      </div>

      <div className="mb-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl border border-white/10 text-center">
            <div className="text-2xl font-black text-secondary">{answeredCount}</div>
            <div className="text-[10px] text-secondary/60 uppercase font-bold tracking-widest">Answered</div>
          </div>
          <div className="bg-white/5 rounded-xl border border-white/10 text-center">
            <div className="text-2xl font-black" style={{ opacity: 0.5 }}>{totalCount - answeredCount}</div>
            <div className="text-[10px] text-secondary/60 uppercase font-bold tracking-widest">Left</div>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto pr-2 no-scrollbar">
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
          <div className="flex items-center justify-between text-xs text-secondary">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded bg-secondary"
                style={{ background: "var(--secondary-color)" }}
              ></div>
              <span>Answered</span>
            </div>
            <span className="font-bold">{answeredCount}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-secondary">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded bg-warning"
                style={{ background: "var(--warning-color)" }}
              ></div>
              <span>Marked for Review</span>
            </div>
            <span className="font-bold">{revisitWork.size}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-secondary">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded border border-white/20"></div>
              <span>Not Attempted</span>
            </div>
            <span className="font-bold">{totalCount - answeredCount}</span>
          </div>
        </div>

        <button
          className="btn-large btn-primary w-full "
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
