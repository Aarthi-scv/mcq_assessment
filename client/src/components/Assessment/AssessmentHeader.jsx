import React from "react";
import { Cpu, User, Clock } from "lucide-react";

const AssessmentHeader = ({ user, timer }) => {
  // timer is null until server fetch completes
  const displayTime =
    timer === null
      ? "--:--"
      : `${Math.floor(timer / 60).toString().padStart(2, "0")}:${(timer % 60)
        .toString()
        .padStart(2, "0")}`;

  return (
    <header className="card sticky-header flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-primary/20 rounded-lg">
          <Cpu size={24} className="text-primary" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Assessment Module</h2>
          <div className="text-xs text-secondary flex items-center gap-1">
            <User size={12} /> {user?.name} ({user?.batch})
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl border border-white/5">
          <Clock
            size={18}
            className={
              timer !== null && timer < 120
                ? "text-danger animate-pulse"
                : "text-primary"
            }
          />
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "1.5rem",
              fontWeight: "bold",
            }}
          >
            {displayTime}
          </span>
        </div>
      </div>
    </header>
  );
};

export default AssessmentHeader;
