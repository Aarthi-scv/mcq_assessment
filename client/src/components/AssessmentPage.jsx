import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { WifiOff, Wifi } from "lucide-react";

// Sub-components
import LoadingScreen from "./Assessment/LoadingScreen";
import AssessmentCompletion from "./Assessment/AssessmentCompletion";
import AssessmentHeader from "./Assessment/AssessmentHeader";
import QuestionCard from "./Assessment/QuestionCard";
import AssessmentSidebar from "./Assessment/AssessmentSidebar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ─── localStorage keys ────────────────────────────────────────────────────────
const LS_MODULE_ID = "mcq_moduleId";
const LS_ANSWERS = "mcq_answers";
const LS_TIMER = "mcq_timer";
const LS_REVISIT = "mcq_revisit";
const LS_QUESTION_ORDER = "mcq_question_order"; // persisted shuffle order
const LS_ACTIVATED_AT = "mcq_activated_at";   // track session instance

/** Remove every session key from localStorage after a successful submission */
const clearSession = () => {
  [LS_MODULE_ID, LS_ANSWERS, LS_TIMER, LS_REVISIT, LS_QUESTION_ORDER, LS_ACTIVATED_AT].forEach(
    (k) => localStorage.removeItem(k)
  );
};

/**
 * Fisher-Yates shuffle — returns a NEW shuffled array, does not mutate input.
 * Each candidate gets a unique random order.
 */
const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const AssessmentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Prefer live navigation state; fall back to what we persisted on last load
  const moduleId =
    location.state?.moduleId || localStorage.getItem(LS_MODULE_ID) || null;

  // ── State ──────────────────────────────────────────────────────────────────
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_ANSWERS)) || {}; }
    catch { return {}; }
  });
  const [revisitWork, setRevisitWork] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(LS_REVISIT)) || []); }
    catch { return new Set(); }
  });
  const [timer, setTimer] = useState(null); // null = not yet known; set after fetch
  const [timerReady, setTimerReady] = useState(false); // true once real value is set
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [feedback, setFeedback] = useState({ rating: 0, comment: "" });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryPending, setRetryPending] = useState(false); // queued submit

  // Keep a ref to the latest answers/moduleId for use inside timer callbacks
  const answersRef = useRef(answers);
  const moduleIdRef = useRef(moduleId);
  const userRef = useRef(user);
  const feedbackRef = useRef(feedback);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { moduleIdRef.current = moduleId; }, [moduleId]);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { feedbackRef.current = feedback; }, [feedback]);

  // ── Persist answers to localStorage on every change ────────────────────────
  useEffect(() => {
    localStorage.setItem(LS_ANSWERS, JSON.stringify(answers));
  }, [answers]);

  // ── Persist revisit set to localStorage on every change ───────────────────
  useEffect(() => {
    localStorage.setItem(LS_REVISIT, JSON.stringify([...revisitWork]));
  }, [revisitWork]);

  // ── Persist moduleId to localStorage as soon as we know it ────────────────
  useEffect(() => {
    if (moduleId) localStorage.setItem(LS_MODULE_ID, moduleId);
  }, [moduleId]);

  // ── Online / Offline detection ─────────────────────────────────────────────
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // ── When connectivity is restored, retry a pending submission ──────────────
  useEffect(() => {
    if (isOnline && retryPending) {
      toast("🌐 Connection restored — submitting your answers…", {
        duration: 4000,
        style: { background: "#1e293b", color: "#fff" },
      });
      setRetryPending(false);
      handleSubmit(true, true); // auto=true, isRetry=true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, retryPending]);

  // ── 1. Fetch Questions & Assessment Details ────────────────────────────────
  useEffect(() => {
    const storedUser = localStorage.getItem("candidateUser");
    if (!storedUser) { navigate("/login"); return; }

    const userData = JSON.parse(storedUser);
    setUser(userData);

    if (!moduleId) {
      toast.error("Invalid assessment entry point.");
      navigate("/candidate-dashboard");
      return;
    }

    const fetchData = async () => {
      try {
        const [qRes, aRes] = await Promise.all([
          axios.get(`${API_URL}/questions/${moduleId}`),
          axios.get(`${API_URL}/active-assessment/${userData.batch}`),
        ]);

        if (qRes.data.length === 0) toast.error("No questions found for this module.");

        // ── Randomize question order (unique per candidate) ─────────────────
        // Check if we already have a saved order from a previous session/refresh
        const savedOrderRaw = localStorage.getItem(LS_QUESTION_ORDER);
        let orderedQuestions;

        if (savedOrderRaw) {
          // Resume: restore exact same order as before the refresh
          try {
            const savedOrder = JSON.parse(savedOrderRaw); // array of _id strings
            const qMap = Object.fromEntries(qRes.data.map((q) => [q._id, q]));
            const restored = savedOrder.map((id) => qMap[id]).filter(Boolean);
            // If any new questions were added since last save, append them
            const restoredIds = new Set(savedOrder);
            const extra = qRes.data.filter((q) => !restoredIds.has(q._id));
            orderedQuestions = [...restored, ...extra];
          } catch {
            orderedQuestions = shuffleArray(qRes.data); // fallback
          }
        } else {
          // Fresh start: shuffle and persist the order
          orderedQuestions = shuffleArray(qRes.data);
          localStorage.setItem(
            LS_QUESTION_ORDER,
            JSON.stringify(orderedQuestions.map((q) => q._id))
          );
        }

        setQuestions(orderedQuestions);

        if (aRes.data && aRes.data.timer) {
          const serverActivatedAt = aRes.data.activatedAt ? new Date(aRes.data.activatedAt).getTime() : 0;
          const freshTimerSeconds = aRes.data.timer * 60;

          const savedTimer = parseInt(localStorage.getItem(LS_TIMER), 10);
          const savedModuleId = localStorage.getItem(LS_MODULE_ID);
          const savedActivatedAt = localStorage.getItem(LS_ACTIVATED_AT);

          // A session is resumable only if it belongs to the same ACTIVATION instance
          const isSameInstance = savedActivatedAt && parseInt(savedActivatedAt, 10) === serverActivatedAt;
          const isResumable = isSameInstance && savedTimer > 0 && savedModuleId === moduleId;

          if (isResumable) {
            setTimer(savedTimer);
          } else {
            // Requirement 2: Start from FULL duration when user first attends this activation
            setTimer(freshTimerSeconds);
            setAnswers({});
            setRevisitWork(new Set());
            localStorage.setItem(LS_TIMER, freshTimerSeconds);
            localStorage.setItem(LS_ANSWERS, JSON.stringify({}));
            localStorage.setItem(LS_REVISIT, JSON.stringify([]));
            localStorage.setItem(LS_ACTIVATED_AT, serverActivatedAt.toString());
          }
          setTimerReady(true);
        } else {
          toast.error("This assessment session is no longer active.");
          clearSession();
          navigate("/candidate-dashboard");
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error("Load Error:", err);
        toast.error("Assessment session has expired or is unavailable.");
        navigate("/candidate-dashboard");
        setLoading(false);
      }
    };

    fetchData();

    // ── 1.5 Sync with admin (polling every 10s) ─────────────────────────────
    const syncInterval = setInterval(async () => {
      try {
        const userData = JSON.parse(localStorage.getItem("candidateUser"));
        const aRes = await axios.get(`${API_URL}/active-assessment/${userData.batch}`);

        if (!aRes.data || !aRes.data._id || aRes.data._id !== moduleId) {
          toast.error("This assessment session has been terminated by the instructor.");
          clearSession();
          navigate("/candidate-dashboard");
          return;
        }

        // Sync total duration if instructor changes it, OR force reset if assessment is restarted
        if (aRes.data.timer) {
          const serverActivatedAt = aRes.data.activatedAt ? new Date(aRes.data.activatedAt).getTime() : 0;
          const currentTotalSeconds = aRes.data.timer * 60;
          const savedActivatedAt = localStorage.getItem(LS_ACTIVATED_AT);

          // 1. Force Reset if instructor stopped and restarted the session
          if (savedActivatedAt && parseInt(savedActivatedAt, 10) !== serverActivatedAt) {
            setTimer(currentTotalSeconds);
            localStorage.setItem(LS_TIMER, currentTotalSeconds);
            localStorage.setItem(LS_ACTIVATED_AT, serverActivatedAt.toString());
            toast("⚠️ Instructor has restarted the assessment. Progress reset.", { icon: "🔄" });
            return;
          }

          // 2. Adjust if instructor changed the total duration mid-test
          // (We use a very loose check here since each student has their own relative clock)
          // Only sync if the student's current timer is somehow higher than the new total
          const currentLocalTimer = parseInt(localStorage.getItem(LS_TIMER), 10);
          if (currentLocalTimer > currentTotalSeconds) {
            setTimer(currentTotalSeconds);
            localStorage.setItem(LS_TIMER, currentTotalSeconds);
            toast("🕒 Instructor has reduced the session timer.", { icon: "ℹ️" });
          }
        }
      } catch (err) {
        // Silently fail polling
      }
    }, 10000);

    return () => {
      clearInterval(syncInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 2. Timer Logic — tick every second & persist remaining time ────────────
  // Only starts once `timerReady` is true (after server fetch confirms the real value)
  useEffect(() => {
    if (!timerReady || submissionResult) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        const next = (prev ?? 0) - 1;

        // Persist remaining time every second
        localStorage.setItem(LS_TIMER, next);

        if (next <= 0) {
          clearInterval(interval);
          handleSubmit(true); // auto submit
          return 0;
        }

        if (next === 120) {
          toast("⚠️ 2 minutes remaining! Finalize your selections.", {
            icon: "⏳",
            duration: 10000,
            style: {
              borderRadius: "10px",
              background: "#1e293b",
              color: "#fff",
              border: "1px solid var(--warning-color)",
            },
          });
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerReady, submissionResult]);

  // ── 3. Tab Switch Detection ────────────────────────────────────────────────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !submissionResult) {
        toast.error("Proctoring Alert: Unauthorized tab switch detected!");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [submissionResult]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSelect = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const toggleRevisit = (questionId) => {
    setRevisitWork((prev) => {
      const next = new Set(prev);
      next.has(questionId) ? next.delete(questionId) : next.add(questionId);
      return next;
    });
  };

  const handleClear = (questionId) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const scrollToQuestion = (index) => {
    const el = document.getElementById(`q-${index}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ── Submit (with offline queuing & retry) ──────────────────────────────────
  const handleSubmit = useCallback(async (auto = false, isRetry = false) => {
    const currentUser = userRef.current;
    const currentAnswers = answersRef.current;
    const currentModule = moduleIdRef.current;
    const currentFeedback = feedbackRef.current;

    if (!currentUser?.name && !auto) {
      return toast.error("Candidate identity required for submission.");
    }

    // If offline, queue and inform user
    if (!navigator.onLine) {
      setRetryPending(true);
      if (!isRetry) {
        toast.error(
          "⚠️ No internet connection! Your answers are saved locally and will be submitted automatically when you reconnect.",
          { duration: 8000, style: { background: "#1e293b", color: "#fff" } }
        );
      }
      return;
    }

    const payload = {
      userName: currentUser?.name || "Anonymous_System_Auto",
      batch: currentUser?.batch,
      moduleId: currentModule,
      answers: Object.entries(currentAnswers).map(([qid, opt]) => ({
        questionId: qid,
        selectedOption: opt,
      })),
      feedback: currentFeedback,
    };

    try {
      const token = localStorage.getItem("candidateToken");
      const res = await axios.post(`${API_URL}/submit`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // ✅ Success — clear persisted session
      clearSession();

      setSubmissionResult(res.data.result);
      setSubmissionId(res.data.submissionId);

      if (auto) toast("Assessment auto-submitted: Time Expired.");
      else toast.success("Data transmitted successfully!");

    } catch (err) {
      // Network failure during submit → queue for retry
      setRetryPending(true);
      toast.error(
        "Submission failed — your answers are saved. Will retry when connection is restored.",
        { duration: 8000, style: { background: "#1e293b", color: "#fff" } }
      );
    }
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen />;

  if (submissionResult) {
    return (
      <AssessmentCompletion
        submissionResult={submissionResult}
        user={user}
        feedback={feedback}
        setFeedback={setFeedback}
        onReturnHome={() => navigate("/candidate-dashboard")}
      />
    );
  }

  return (
    <div className="assessment-container">

      {/* ── Offline / Retry Banner ── */}
      {(!isOnline || retryPending) && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            padding: "10px 20px",
            background: !isOnline
              ? "linear-gradient(90deg,#7f1d1d,#991b1b)"
              : "linear-gradient(90deg,#78350f,#92400e)",
            color: "#fff",
            fontSize: "0.875rem",
            fontWeight: 600,
            boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
          }}
        >
          {!isOnline ? (
            <>
              <WifiOff size={16} />
              No Internet Connection — Your answers are saved locally and will
              be submitted automatically when you reconnect.
            </>
          ) : (
            <>
              <Wifi size={16} />
              Connection restored — submitting your saved answers…
            </>
          )}
        </div>
      )}

      <div
        className="q-list-container fade-in"
        style={{ paddingTop: !isOnline || retryPending ? "48px" : undefined }}
      >
        <AssessmentHeader user={user} timer={timer} />

        <div className="flex flex-col gap-10 pb-20 max-w-4xl mx-auto w-full">
          {questions.map((q, index) => (
            <QuestionCard
              key={q._id}
              question={q}
              index={index}
              selectedOption={answers[q._id]}
              isMarkedForReview={revisitWork.has(q._id)}
              onSelect={handleSelect}
              onClear={handleClear}
              onToggleReview={toggleRevisit}
            />
          ))}
        </div>
      </div>

      <AssessmentSidebar
        user={user}
        questions={questions}
        answers={answers}
        revisitWork={revisitWork}
        onQuestionClick={scrollToQuestion}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default AssessmentPage;
