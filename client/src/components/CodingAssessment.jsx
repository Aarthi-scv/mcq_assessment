import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
    Play, CheckCircle2, XCircle, AlertTriangle,
    Clock, Code2, Terminal, ChevronRight, Send,
    FlaskConical, Loader2, ShieldAlert, Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import "./CodingAssessment.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const LS_KEY = "codingAssessment_session";
const MAX_TAB_SWITCHES = 3;   // auto-submit after this many violations

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

// ── Submit Confirmation Modal ────────────────────────────────────────────────
const SubmitModal = ({ unansweredCount, onConfirm, onCancel, submitting }) => (
    <div className="ca-modal-overlay">
        <div className="ca-modal fade-in">
            <div className="ca-modal-icon">
                <Send size={28} style={{ color: "#10b981" }} />
            </div>
            <h3 className="ca-modal-title">Submit Assessment?</h3>
            {unansweredCount > 0 ? (
                <p className="ca-modal-body">
                    <span className="ca-modal-warn">
                        <AlertTriangle size={14} /> {unansweredCount} question{unansweredCount > 1 ? "s" : ""} not yet run.
                    </span>
                    <br />
                    Their scores will be recorded as <strong>0 pts</strong>. Are you sure you want to submit?
                </p>
            ) : (
                <p className="ca-modal-body">
                    All questions have been run. Submit your coding assessment now?
                </p>
            )}
            <div className="ca-modal-actions">
                <button className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
                    Go Back
                </button>
                <button className="btn ca-submit-btn" onClick={onConfirm} disabled={submitting} style={{ flex: 1 }}>
                    {submitting
                        ? <><Loader2 size={15} className="ca-spin" /> Submitting…</>
                        : <><Send size={15} /> Confirm Submit</>
                    }
                </button>
            </div>
        </div>
    </div>
);

// ── Tab-switch Warning Modal ─────────────────────────────────────────────────
const TabWarningModal = ({ count, max, onClose }) => (
    <div className="ca-modal-overlay">
        <div className="ca-modal fade-in ca-modal-warn-box">
            <div className="ca-modal-icon warn">
                <ShieldAlert size={28} style={{ color: "#f59e0b" }} />
            </div>
            <h3 className="ca-modal-title">Tab Switch Detected!</h3>
            <p className="ca-modal-body">
                Switching tabs or windows during the assessment is <strong>not allowed</strong>.
                <br /><br />
                <span className="ca-modal-warn">
                    Warning {count} of {max} — after {max} violations your assessment will be auto-submitted.
                </span>
            </p>
            <div className="ca-modal-actions" style={{ justifyContent: "center" }}>
                <button className="btn btn-primary" onClick={onClose}>
                    <Eye size={14} /> I Understand — Resume
                </button>
            </div>
        </div>
    </div>
);

export default function CodingAssessment() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const moduleId = params.get("moduleId");

    const [module, setModule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qIndex, setQIndex] = useState(0);
    const [codes, setCodes] = useState([]);
    const [results, setResults] = useState([]);
    const [running, setRunning] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [finalScore, setFinalScore] = useState(null);

    // Modal states
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showTabWarning, setShowTabWarning] = useState(false);
    const [tabSwitchCount, setTabSwitchCount] = useState(0);

    const textareaRef = useRef(null);
    const timerRef = useRef(null);
    const tabCountRef = useRef(0);   // keep in sync with state for visibility handler
    const moduleRef = useRef(null);
    const submittingRef = useRef(false);

    const user = JSON.parse(localStorage.getItem("candidateUser") || "{}");
    const token = localStorage.getItem("candidateToken");

    // ── Load module ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!moduleId) { navigate("/candidate-dashboard"); return; }
        if (!token) { navigate("/login"); return; }

        (async () => {
            try {
                const saved = localStorage.getItem(LS_KEY);
                if (saved) {
                    const s = JSON.parse(saved);
                    if (s.moduleId === moduleId) {
                        setModule(s.module);
                        moduleRef.current = s.module;
                        setCodes(s.codes);
                        setResults(s.results);
                        setQIndex(s.qIndex || 0);
                        setTimeLeft(s.timeLeft);
                        setLoading(false);
                        return;
                    }
                }
                const res = await axios.get(`${API_URL}/active-coding-assessment/${user.batch}`);
                const mod = res.data;
                moduleRef.current = mod;
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

    // ── Keep moduleRef in sync ───────────────────────────────────────────────
    useEffect(() => { moduleRef.current = module; }, [module]);
    useEffect(() => { submittingRef.current = submitting; }, [submitting]);

    // ── Timer ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (timeLeft === null || submitted) return;
        if (timeLeft <= 0) { handleSubmit(true); return; }
        timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        return () => clearTimeout(timerRef.current);
    }, [timeLeft, submitted]);

    // ── Persist session ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!module) return;
        localStorage.setItem(LS_KEY, JSON.stringify({ moduleId, module, codes, results, qIndex, timeLeft }));
    }, [codes, results, qIndex, timeLeft]);

    // ── Tab-switch detection ─────────────────────────────────────────────────
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === "hidden") return; // only react on coming back
            if (submitted || submittingRef.current) return;

            tabCountRef.current += 1;
            setTabSwitchCount(tabCountRef.current);

            if (tabCountRef.current >= MAX_TAB_SWITCHES) {
                // Auto-submit immediately
                toast.error("Maximum tab switches reached — submitting automatically.", { duration: 4000 });
                handleSubmit(true);
            } else {
                setShowTabWarning(true);
            }
        };

        // Detect ANY tab/window switch
        document.addEventListener("visibilitychange", handleVisibility);
        window.addEventListener("blur", handleVisibility);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibility);
            window.removeEventListener("blur", handleVisibility);
        };
    }, [submitted]);

    // ── Block copy/paste/cut in textarea ────────────────────────────────────
    const blockClipboard = (e) => {
        e.preventDefault();
        toast("🔒 Copy / Paste is disabled in the code editor.", {
            duration: 2000,
            style: { background: "#1e293b", color: "#fff", border: "1px solid rgba(239,68,68,0.3)" },
        });
    };

    // ── Handle Tab key in textarea ───────────────────────────────────────────
    const handleKeyDown = (e) => {
        // Block Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A
        if (e.ctrlKey && ["c", "v", "x", "a"].includes(e.key.toLowerCase())) {
            // Allow Ctrl+A (select all is harmless), block copy/paste/cut
            if (["c", "v", "x"].includes(e.key.toLowerCase())) {
                e.preventDefault();
                toast("🔒 Copy / Paste is disabled in the code editor.", {
                    duration: 2000,
                    style: { background: "#1e293b", color: "#fff", border: "1px solid rgba(239,68,68,0.3)" },
                });
                return;
            }
        }
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

    // ── Run & Check ──────────────────────────────────────────────────────────
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

    // ── Navigate questions ───────────────────────────────────────────────────
    const goNext = () => {
        if (qIndex < module.questions.length - 1) setQIndex(q => q + 1);
    };

    // ── Show submit modal (replaces window.confirm) ──────────────────────────
    const requestSubmit = () => setShowSubmitModal(true);

    // ── Final Submit ─────────────────────────────────────────────────────────
    const handleSubmit = async (forced = false) => {
        setShowSubmitModal(false);
        setSubmitting(true);
        try {
            const mod = moduleRef.current || module;
            if (!mod) return;
            const questionPayload = mod.questions.map((q, i) => ({
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
                { userName: user.name, batch: user.batch, moduleId, questions: questionPayload },
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

    // ── Helpers ──────────────────────────────────────────────────────────────
    const fmtTime = (s) => {
        if (s === null) return "--:--";
        const m = Math.floor(s / 60), sec = s % 60;
        return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    };

    const pct = module ? ((qIndex) / module.questions.length) * 100 : 0;

    // ── Compute unanswered for modal ─────────────────────────────────────────
    const unansweredCount = module
        ? module.questions.filter((_, i) => !results[i]?.results).length
        : 0;

    // ── Render: Loading ──────────────────────────────────────────────────────
    if (loading) return (
        <div className="ca-centered">
            <div className="admin-loader-ring" style={{ width: 48, height: 48 }} />
            <p style={{ marginTop: "1rem", color: "rgba(0,245,255,0.6)" }}>Loading assessment…</p>
        </div>
    );

    // ── Render: Submitted ────────────────────────────────────────────────────
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
                    {finalScore.max > 0 ? ((finalScore.total / finalScore.max) * 100).toFixed(0) : 0}% score
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

    // ── Main Render ──────────────────────────────────────────────────────────
    return (
        <div className="ca-root fade-in">
            {/* ── Submit Confirmation Modal ──────────────────────────────── */}
            {showSubmitModal && (
                <SubmitModal
                    unansweredCount={unansweredCount}
                    onConfirm={() => handleSubmit(false)}
                    onCancel={() => setShowSubmitModal(false)}
                    submitting={submitting}
                />
            )}

            {/* ── Tab-switch Warning Modal ───────────────────────────────── */}
            {showTabWarning && (
                <TabWarningModal
                    count={tabSwitchCount}
                    max={MAX_TAB_SWITCHES}
                    onClose={() => setShowTabWarning(false)}
                />
            )}

            {/* ── Top bar ─────────────────────────────────────────────────── */}
            <div className="ca-topbar">
                <div className="ca-topbar-left">
                    <Code2 size={18} className="text-primary" />
                    <span className="ca-module-title">{module.title}</span>
                </div>

                {/* Tab switch indicator */}
                {tabSwitchCount > 0 && (
                    <div className="ca-tab-warn-badge">
                        <ShieldAlert size={12} />
                        {tabSwitchCount}/{MAX_TAB_SWITCHES} warnings
                    </div>
                )}

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

            {/* ── Question stepper pills ───────────────────────────────────── */}
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
                            {hasResult ? <CheckCircle2 size={12} /> : i + 1}
                        </button>
                    );
                })}
            </div>

            {/* ── Main layout: Editor + Test Cases ────────────────────────── */}
            <div className="ca-layout">
                {/* LEFT — Question + Code Editor */}
                <div className="ca-editor-panel">
                    {/* Question text */}
                    <div className="ca-question-text">
                        <div className="ca-qn-badge">Q{qIndex + 1}</div>
                        <p>{q.questionText}</p>
                    </div>

                    {/* Editor header */}
                    <div className="ca-editor-header">
                        <Terminal size={13} className="text-primary" />
                        <span>main.c</span>
                        <span className="ca-editor-hint">
                            <ShieldAlert size={11} /> Copy &amp; Paste disabled
                        </span>
                    </div>

                    {/* Editor body */}
                    <div className="ca-editor-scroll">
                        <LineNums code={codes[qIndex]} />
                        <textarea
                            ref={textareaRef}
                            className="ca-textarea"
                            value={codes[qIndex]}
                            onChange={e => updateCode(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onCopy={blockClipboard}
                            onPaste={blockClipboard}
                            onCut={blockClipboard}
                            onContextMenu={e => e.preventDefault()}  /* disable right-click menu */
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
                                onClick={requestSubmit}        /* ← opens modal now */
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
