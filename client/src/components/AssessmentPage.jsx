import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";

// Sub-components
import LoadingScreen from "./Assessment/LoadingScreen";
import AssessmentCompletion from "./Assessment/AssessmentCompletion";
import AssessmentHeader from "./Assessment/AssessmentHeader";
import QuestionCard from "./Assessment/QuestionCard";
import AssessmentSidebar from "./Assessment/AssessmentSidebar";

const API_URL = "http://localhost:5000/api";

const AssessmentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const moduleId = location.state?.moduleId;

  // State
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { questionId: selectedOption }
  const [revisitWork, setRevisitWork] = useState(new Set());
  const [timer, setTimer] = useState(10 * 60); // 10 minutes default
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [feedback, setFeedback] = useState({ rating: 0, comment: "" });

  // 1. Fetch Questions & Assessment Details
  useEffect(() => {
    const storedUser = localStorage.getItem("candidateUser");
    if (!storedUser) {
      navigate("/login");
      return;
    }
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

        if (qRes.data.length === 0) {
          toast.error("No questions found for this module.");
        }
        setQuestions(qRes.data);

        // aRes.data contains the active module metadata
        if (aRes.data && aRes.data.timer) {
          // Use the FULL timer from the module so students get their full duration
          // regardless of when they started within the availability window.
          setTimer(aRes.data.timer * 60);
        } else {
          toast.error("This assessment session is no longer active.");
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
  }, [moduleId, navigate]);

  // 2. Timer Logic
  useEffect(() => {
    if (submissionResult) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit(true);
          return 0;
        }
        if (prev === 120) {
          toast("⚠️ 2 minutes remaining! Finalize your logic selections.", {
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
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [submissionResult, questions, answers]);

  // 3. Tab Switch Detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !submissionResult) {
        toast.error("Proctoring Alert: Unauthorized tab switch detected!");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [submissionResult]);

  // Handlers
  const handleSelect = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const toggleRevisit = (questionId) => {
    setRevisitWork((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
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
    const element = document.getElementById(`q-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSubmit = async (auto = false) => {
    if (!user?.name && !auto) {
      return toast.error("Candidate identity required for submission.");
    }

    const payload = {
      userName: user?.name || "Anonymous_System_Auto",
      batch: user?.batch,
      moduleId: moduleId,
      answers: Object.entries(answers).map(([qid, opt]) => ({
        questionId: qid,
        selectedOption: opt,
      })),
      feedback: feedback,
    };

    try {
      const res = await axios.post(`${API_URL}/submit`, payload);
      setSubmissionResult(res.data.result);
      setSubmissionId(res.data.submissionId);
      if (auto) toast("Assessment auto-submitted: Time Expired.");
      else toast.success("Data transmitted successfully!");
    } catch (err) {
      toast.error("Transmission failed. Retry connection.");
    }
  };

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
      <div className="q-list-container fade-in">
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
