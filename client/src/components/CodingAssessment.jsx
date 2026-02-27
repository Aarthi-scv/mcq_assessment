import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
    Play, CheckCircle2, XCircle, AlertTriangle,
    Clock, Code2, Terminal, ChevronRight, Send,
    FlaskConical, Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import "./CodingAssessment.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const LS_KEY = "codingAssessment_session";

// ── line number gutter ──────────────────────────────────────────────────────
const LineNums = ({ code }) => {
    const n = (code || "").split("\n").length;
    return (
        <div className="ca-line-nums" aria-hidden="true">
            {Array.from({ length: Math.max(n, 1) }, (_, i) => (
                <div key={i} className="ca-line-num">{i + 1}</div>
            ))}
        </div>
    );
};

const DEFAULT_CODE = `#include <stdio.h>\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n`;

export default function CodingAssessment() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const moduleId = params.get("moduleId");

    const [module, setModule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qIndex, setQIndex] = useState(0);
    const [codes, setCodes] = useState([]);      // code per question
    const [results, setResults] = useState([]);      // testCaseResults[] per question
    const [running, setRunning] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [finalScore, setFinalScore] = useState(null);
    const textareaRef = useRef(null);
    const timerRef = useRef(null);

    const user = JSON.parse(localStorage.getItem("candidateUser") || "{}");
    const token = localStorage.getItem("candidateToken");

    // ── Load module ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!moduleId) { navigate("/candidate-dashboard"); return; }
        if (!token) { navigate("/login"); return; }

        (async () => {
            try {
                // Try restore session
                const saved = localStorage.getItem(LS_KEY);
                if (saved) {
                    const s = JSON.parse(saved);
                    if (s.moduleId === moduleId) {
                        setModule(s.module);
                        setCodes(s.codes);
                        setResults(s.results);
                        setQIndex(s.qIndex || 0);
                        setTimeLeft(s.timeLeft);
                        setLoading(false);
                        return;
                    }
                }
                // Fresh load
                const res = await axios.get(`${API_URL}/active-coding-assessment/${user.batch}`);
                const mod = res.data;
                const initCodes = mod.questions.map(() => DEFAULT_CODE);
                const initResults = mod.questions.map(q => ({ results: null, score: 0, maxScore: q.testCases.length }));
                setModule(mod);
                setCodes(initCodes);
                setResults(initResults);
                setTimeLeft((mod.timer || 60) * 60);
            } catch {
                toast.error("Could not load coding assessment. Check your batch assignment.");
                navigate("/candidate-dashboard");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // ── Timer ───────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (timeLeft === null || submitted) return;
        if (timeLeft <= 0) { handleSubmit(true); return; }
        timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        return () => clearTimeout(timerRef.current);
    }, [timeLeft, submitted]);

    // ── Persist session ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!module) return;
        localStorage.setItem(LS_KEY, JSON.stringify({ moduleId, module, codes, results, qIndex, timeLeft }));
    }, [codes, results, qIndex, timeLeft]);

    // ── Handle Tab in textarea ───────────────────────────────────────────────────
    const handleKeyDown = (e) => {
        if (e.key !== "Tab") return;
        e.preventDefault();
        const ta = textareaRef.current;
        const s = ta.selectionStart;
        const end = ta.selectionEnd;
        const next = codes[qIndex].slice(0, s) + "    " + codes[qIndex].slice(end);
        updateCode(next);
        requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 4; });
    };

    const updateCode = (val) =>
        setCodes(prev => prev.map((c, i) => i === qIndex ? val : c));

    // ── Run & Check ─────────────────────────────────────────────────────────────
    const runAndCheck = useCallback(async () => {
        if (!module) return;
        const q = module.questions[qIndex];
        if (!codes[qIndex]?.trim()) return toast.error("Write some code first");
        setRunning(true);
        try {
            const { data } = await axios.post(`${API_URL}/run-testcases`, {
                code: codes[qIndex],
                testCases: q.testCases,
            });
            setResults(prev => prev.map((r, i) =>
                i === qIndex ? { results: data.results, score: data.totalScore, maxScore: data.maxScore } : r
            ));
        } catch (err) {
            toast.error(err.response?.data?.error || "Run failed — compiler unavailable");
        } finally {
            setRunning(false);
        }
    }, [module, qIndex, codes]);

    // ── Navigate questions ───────────────────────────────────────────────────────
    const goNext = () => {
        if (qIndex < module.questions.length - 1) setQIndex(q => q + 1);
    };

    // ── Final Submit ─────────────────────────────────────────────────────────────
    const handleSubmit = async (forced = false) => {
        if (!forced) {
            const unanswered = module.questions.filter((_, i) => !results[i]?.results);
            if (unanswered.length > 0 && !window.confirm(
                `${unanswered.length} question(s) not yet run. Submit anyway?`
            )) return;
        }
        setSubmitting(true);
        try {
            const questionPayload = module.questions.map((q, i) => ({
                questionId: q._id,
                questionText: q.questionText,
                code: codes[i] || "",
                testCaseResults: results[i]?.results || q.testCases.map(tc => ({
                    input: tc.input, expectedOutput: tc.expectedOutput,
                    actualOutput: "", passed: false, score: 0,
                })),
                score: results[i]?.score || 0,
                maxScore: results[i]?.maxScore || q.testCases.length,
            }));

            const { data } = await axios.post(
                `${API_URL}/coding-submit`,
                {
                    userName: user.name,
                    batch: user.batch,
                    moduleId,
                    questions: questionPayload,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            localStorage.removeItem(LS_KEY);
            clearTimeout(timerRef.current);
            setFinalScore({ total: data.totalScore, max: data.maxScore });
            setSubmitted(true);
        } catch (err) {
            toast.error(err.response?.data?.message || "Submission failed");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Helpers ──────────────────────────────────────────────────────────────────
    const fmtTime = (s) => {
        if (s === null) return "--:--";
        const m = Math.floor(s / 60), sec = s % 60;
        return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    };

    const pct = module ? ((qIndex) / module.questions.length) * 100 : 0;

    // ── Render: Loading ──────────────────────────────────────────────────────────
    if (loading) return (
        <div className="ca-centered">
            <div className="admin-loader-ring" style={{ width: 48, height: 48 }} />
            <p style={{ marginTop: "1rem", color: "rgba(0,245,255,0.6)" }}>Loading assessment…</p>
        </div>
    );

    // ── Render: Submitted ────────────────────────────────────────────────────────
    if (submitted && finalScore) return (
        <div className="ca-centered">
            <div className="ca-result-card">
                <CheckCircle2 size={52} style={{ color: "#10b981", marginBottom: "1rem" }} />
                <h2>Assessment Submitted!</h2>
                <div className="ca-score-display">
                    <span className="ca-score-num">{finalScore.total}</span>
                    <span className="ca-score-sep">/</span>
                    <span className="ca-score-max">{finalScore.max}</span>
                    <span className="ca-score-label">pts</span>
                </div>
                <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                    {((finalScore.total / finalScore.max) * 100).toFixed(0)}% score
                </p>
                <button className="btn btn-primary" style={{ marginTop: "1.5rem" }} onClick={() => navigate("/candidate-dashboard")}>
                    Back to Dashboard
                </button>
            </div>
        </div>
    );

    if (!module) return null;

    const q = module.questions[qIndex];
    const qResult = results[qIndex];
    const isLast = qIndex === module.questions.length - 1;
    const timeWarn = timeLeft !== null && timeLeft <= 300;

    // ── Main Render ──────────────────────────────────────────────────────────────
    return (
        <div className="ca-root fade-in">
            {/* ── Top bar ─────────────────────────────────────────────────────── */}
            <div className="ca-topbar">
                <div className="ca-topbar-left">
                    <Code2 size={18} className="text-primary" />
                    <span className="ca-module-title">{module.title}</span>
                </div>

                {/* Progress */}
                <div className="ca-progress-wrap">
                    <div className="ca-progress-bar">
                        <div className="ca-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="ca-progress-label">Q{qIndex + 1} / {module.questions.length}</span>
                </div>

                {/* Timer */}
                <div className={`ca-timer ${timeWarn ? "warn" : ""}`}>
                    <Clock size={14} />
                    {fmtTime(timeLeft)}
                </div>
            </div>

            {/* ── Question stepper pills ─────────────────────────────────────── */}
            <div className="ca-stepper">
                {module.questions.map((_, i) => {
                    const r = results[i];
                    const hasResult = !!r?.results;
                    return (
                        <button
                            key={i}
                            className={`ca-step ${i === qIndex ? "active" : ""} ${hasResult ? "done" : ""}`}
                            onClick={() => setQIndex(i)}
                            title={`Question ${i + 1}`}
                        >
                            {hasResult
                                ? <CheckCircle2 size={12} />
                                : i + 1
                            }
                        </button>
                    );
                })}
            </div>

            {/* ── Main layout: Editor + Test Cases ─────────────────────────── */}
            <div className="ca-layout">
                {/* LEFT — Question + Code Editor */}
                <div className="ca-editor-panel">
                    {/* Question text */}
                    <div className="ca-question-text">
                        <div className="ca-qn-badge">Q{qIndex + 1}</div>
                        <p>{q.questionText}</p>
                    </div>

                    {/* Editor */}
                    <div className="ca-editor-header">
                        <Terminal size={13} className="text-primary" />
                        <span>main.c</span>
                    </div>
                    <div className="ca-editor-scroll">
                        <LineNums code={codes[qIndex]} />
                        <textarea
                            ref={textareaRef}
                            className="ca-textarea"
                            value={codes[qIndex]}
                            onChange={e => updateCode(e.target.value)}
                            onKeyDown={handleKeyDown}
                            spellCheck={false}
                            autoCapitalize="off"
                            autoCorrect="off"
                            autoComplete="off"
                        />
                    </div>

                    {/* Run button */}
                    <div className="ca-editor-footer">
                        <button
                            className="btn btn-primary ca-run-btn"
                            onClick={runAndCheck}
                            disabled={running || submitting}
                        >
                            {running
                                ? <><Loader2 size={15} className="ca-spin" /> Running All Cases…</>
                                : <><Play size={15} fill="currentColor" /> Run &amp; Check All Cases</>
                            }
                        </button>
                    </div>
                </div>

                {/* RIGHT — Test cases + Results */}
                <div className="ca-tc-panel">
                    <div className="ca-tc-panel-header">
                        <FlaskConical size={14} className="text-primary" />
                        <span>Test Cases</span>
                        {qResult?.results && (
                            <span className="ca-tc-score">
                                {qResult.score}/{qResult.maxScore} pts
                            </span>
                        )}
                    </div>

                    <div className="ca-tc-scroll">
                        {q.testCases.map((tc, ti) => {
                            const r = qResult?.results?.[ti];
                            const status = r ? (r.passed ? "pass" : "fail") : "pending";
                            return (
                                <div key={ti} className={`ca-tc-card ${status}`}>
                                    <div className="ca-tc-card-header">
                                        <span className="ca-tc-num">Case {ti + 1}</span>
                                        <span className={`ca-tc-badge ${status}`}>
                                            {status === "pass" && <><CheckCircle2 size={12} /> Passed (+1 pt)</>}
                                            {status === "fail" && <><XCircle size={12} /> Failed</>}
                                            {status === "pending" && <><Clock size={12} /> Not run</>}
                                        </span>
                                    </div>

                                    <div className="ca-tc-io">
                                        <div className="ca-tc-io-row">
                                            <span className="ca-tc-io-label">Input</span>
                                            <pre className="ca-tc-io-val">{tc.input || "(none)"}</pre>
                                        </div>
                                        <div className="ca-tc-io-row">
                                            <span className="ca-tc-io-label">Expected</span>
                                            <pre className="ca-tc-io-val">{tc.expectedOutput}</pre>
                                        </div>
                                        {r && (
                                            <div className="ca-tc-io-row">
                                                <span className="ca-tc-io-label">Your Output</span>
                                                <pre className={`ca-tc-io-val ${r.passed ? "ok" : "err"}`}>
                                                    {r.actualOutput || "(empty)"}
                                                </pre>
                                            </div>
                                        )}
                                        {r?.compileError && (
                                            <div className="ca-tc-error">
                                                <AlertTriangle size={11} /> Compile: {r.compileError.slice(0, 200)}
                                            </div>
                                        )}
                                        {r?.runtimeError && !r?.compileError && (
                                            <div className="ca-tc-error">
                                                <AlertTriangle size={11} /> Runtime: {r.runtimeError.slice(0, 200)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Navigation */}
                    <div className="ca-nav-footer">
                        {!isLast ? (
                            <button className="btn btn-primary ca-nav-btn" onClick={goNext}>
                                Next Question <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button
                                className="btn ca-submit-btn"
                                onClick={() => handleSubmit(false)}
                                disabled={submitting}
                            >
                                {submitting
                                    ? <><Loader2 size={15} className="ca-spin" /> Submitting…</>
                                    : <><Send size={15} /> Submit Assessment</>
                                }
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
