import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  Timer,
  Eye,
  Ban,
  CheckCircle,
  Info,
  ChevronLeft,
  ArrowRight,
} from "lucide-react";

const InstructionPage = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(10); // Reduced for demo/dev speed, but keeping logic

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="container"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
      }}
    >
      <div
        className="card fade-in"
        style={{ maxWidth: "700px", width: "100%", padding: "3rem" }}
      >
        <div className="flex items-center gap-4 mb-8">
          <div
            className="p-3 bg-warning/10 rounded-xl"
            style={{
              border: "1px solid var(--warning-color)",
              color: "var(--warning-color)",
            }}
          >
            <ShieldAlert size={32} />
          </div>
          <h1 style={{ margin: 0, fontSize: "2.5rem" }}>Core Protocols</h1>
        </div>

        <div className="grid gap-6 mb-8">
          <div className="flex gap-4 items-start p-4 rounded-xl bg-white/5 border border-white/5">
            <Timer className="text-primary shrink-0" size={24} />
            <div>
              <h4 className="font-bold mb-1">Time Distribution</h4>
              <p className="text-sm text-secondary">
                The system allocates specific cycles for each module. Failure to
                transmit before the deadline results in auto-submission.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start p-4 rounded-xl bg-white/5 border border-white/5">
            <Eye className="text-primary shrink-0" size={24} />
            <div>
              <h4 className="font-bold mb-1">Integrity Monitoring</h4>
              <p className="text-sm text-secondary">
                Advanced proctoring active. Multiple tab switches or UI
                interference will trigger a system lockout.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start p-4 rounded-xl bg-white/5 border border-white/5">
            <CheckCircle className="text-secondary shrink-0" size={24} />
            <div>
              <h4 className="font-bold mb-1">Scoring Matrix</h4>
              <p className="text-sm text-secondary">
                +1 for valid logic selection, -1 for invalid noise in data.
                Precision is critical.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start p-4 rounded-xl bg-white/5 border border-white/5">
            <Ban className="text-danger shrink-0" size={24} />
            <div>
              <h4 className="font-bold mb-1">Data Protection</h4>
              <p className="text-sm text-secondary">
                Screen capture and copy operations are strictly prohibited to
                protect intellectual property.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-secondary mb-8 p-3 rounded-lg bg-black/20 justify-center">
          <Info size={16} />
          <p className="text-sm">
            Safety interlock active. System ready in {timeLeft} seconds.
          </p>
        </div>

        <div className="flex justify-between gap-4 mt-4">
          <button
            className="btn btn-secondary flex-1"
            onClick={() => navigate("/")}
          >
            <ChevronLeft size={18} /> Return to Base
          </button>
          <button
            className="btn btn-primary flex-1"
            disabled={timeLeft > 0}
            onClick={() => navigate("/assessment")}
          >
            {timeLeft > 0 ? (
              `Initializing (${timeLeft}s)`
            ) : (
              <span className="flex items-center gap-2">
                Initiate Assessment <ArrowRight size={18} />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstructionPage;
