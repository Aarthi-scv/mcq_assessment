import React, { useState, useRef, useCallback } from "react";
import axios from "axios";
import {
    Play, Plus, Trash2, Terminal, Code2, ChevronDown,
    ChevronUp, Clock, Cpu, CheckCircle2, XCircle,
    AlertTriangle, MemoryStick, FlaskConical, RotateCcw,
} from "lucide-react";
import "./CCompiler.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const DEFAULT_CODE = `#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    printf("Hello! You entered: %d\\n", n);
    return 0;
}`;

const STARTER_TEMPLATES = {
    hello: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n`,
    stdin: `#include <stdio.h>\n\nint main() {\n    char name[50];\n    printf("Enter your name: ");\n    scanf("%s", name);\n    printf("Hello, %s!\\n", name);\n    return 0;\n}\n`,
    loop: `#include <stdio.h>\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    for (int i = 1; i <= n; i++) {\n        printf("%d ", i);\n    }\n    printf("\\n");\n    return 0;\n}\n`,
    factorial: `#include <stdio.h>\n\nlong long factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\n\nint main() {\n    int n;\n    scanf("%d", &n);\n    printf("%lld\\n", factorial(n));\n    return 0;\n}\n`,
};

const statusMeta = (statusId) => {
    if (statusId === 3) return { label: "Accepted", color: "#10b981", icon: <CheckCircle2 size={14} /> };
    if (statusId === 6) return { label: "Compile Error", color: "#f59e0b", icon: <AlertTriangle size={14} /> };
    if (statusId >= 7 && statusId <= 12) return { label: "Runtime Error", color: "#ef4444", icon: <XCircle size={14} /> };
    if (statusId === 5) return { label: "Time Limit", color: "#f59e0b", icon: <Clock size={14} /> };
    return { label: "Error", color: "#ef4444", icon: <XCircle size={14} /> };
};

// ─── Line-number gutter helper ────────────────────────────────────────────────
const LineNumbers = ({ code }) => {
    const lines = (code || "").split("\n").length;
    return (
        <div className="cc-line-nums" aria-hidden="true">
            {Array.from({ length: Math.max(lines, 1) }, (_, i) => (
                <div key={i + 1} className="cc-line-num">{i + 1}</div>
            ))}
        </div>
    );
};

export default function CCompiler() {
    const [code, setCode] = useState(DEFAULT_CODE);
    const [testCases, setTestCases] = useState([{ id: 1, stdin: "42", expected: "", result: null }]);
    const [activeTab, setActiveTab] = useState(0);         // active test-case tab index
    const [running, setRunning] = useState(false);
    const [runAll, setRunAll] = useState(false);
    const [output, setOutput] = useState(null);      // single run output
    const [allResults, setAllResults] = useState([]);
    const [showTemplate, setShowTemplate] = useState(false);
    const textareaRef = useRef(null);
    const tcIdRef = useRef(2);

    // ── Tab key support in textarea ───────────────────────────────────────────
    const handleKeyDown = (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const ta = textareaRef.current;
            const s = ta.selectionStart;
            const end = ta.selectionEnd;
            const next = code.slice(0, s) + "    " + code.slice(end);
            setCode(next);
            requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 4; });
        }
    };

    // ── Run a single test case ───────────────────────────────────────────────
    const runSingle = useCallback(async (tc) => {
        setRunning(true);
        setOutput(null);
        try {
            const { data } = await axios.post(`${API_URL}/compile`, {
                code,
                stdin: tc.stdin,
            });
            setOutput({ ...data, tcId: tc.id });
            return data;
        } catch (err) {
            const msg = err.response?.data?.error || err.message || "Request failed";
            setOutput({ error: msg });
            return { error: msg };
        } finally {
            setRunning(false);
        }
    }, [code]);

    // ── Run ALL test cases ───────────────────────────────────────────────────
    const runAll_ = useCallback(async () => {
        setRunAll(true);
        setAllResults([]);
        const results = [];
        for (const tc of testCases) {
            try {
                const { data } = await axios.post(`${API_URL}/compile`, { code, stdin: tc.stdin });
                const passed =
                    tc.expected.trim() !== "" &&
                    (data.stdout || "").trim() === tc.expected.trim();
                results.push({ ...data, tcId: tc.id, passed: tc.expected.trim() === "" ? null : passed });
            } catch (err) {
                results.push({ error: err.response?.data?.error || err.message, tcId: tc.id, passed: false });
            }
        }
        setAllResults(results);
        setRunAll(false);
    }, [code, testCases]);

    // ── Test-case helpers ────────────────────────────────────────────────────
    const addTestCase = () => {
        const id = tcIdRef.current++;
        setTestCases(prev => [...prev, { id, stdin: "", expected: "", result: null }]);
        setActiveTab(testCases.length);
    };

    const removeTestCase = (idx) => {
        if (testCases.length <= 1) return;
        setTestCases(prev => prev.filter((_, i) => i !== idx));
        setActiveTab(t => Math.min(t, testCases.length - 2));
    };

    const updateTc = (idx, field, val) => {
        setTestCases(prev => prev.map((tc, i) => i === idx ? { ...tc, [field]: val } : tc));
    };

    const resetAll = () => { setCode(DEFAULT_CODE); setOutput(null); setAllResults([]); };

    const activeTc = testCases[activeTab] || testCases[0];
    const activeResult = allResults.find(r => r.tcId === activeTc?.id);

    return (
        <div className="cc-root fade-in">
            {/* ── Top bar ──────────────────────────────────────────────────────── */}
            <div className="cc-topbar">
                <div className="cc-topbar-left">
                    <div className="cc-logo">
                        <Code2 size={22} className="text-primary" />
                        <span>C<span className="cc-logo-accent">Lab</span></span>
                    </div>
                    <span className="cc-badge">C · GCC (Wandbox)</span>
                </div>

                <div className="cc-topbar-right">
                    {/* Template picker */}
                    <div className="cc-template-wrapper">
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setShowTemplate(v => !v)}
                        >
                            <FlaskConical size={14} /> Templates
                            {showTemplate ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                        {showTemplate && (
                            <div className="cc-template-menu">
                                {Object.entries(STARTER_TEMPLATES).map(([key, tpl]) => (
                                    <button
                                        key={key}
                                        onClick={() => { setCode(tpl); setShowTemplate(false); }}
                                    >
                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button className="btn btn-secondary btn-sm" onClick={resetAll} title="Reset">
                        <RotateCcw size={14} />
                    </button>

                    {/* Run current test */}
                    <button
                        className="btn btn-primary cc-run-btn"
                        onClick={() => runSingle(activeTc)}
                        disabled={running || runAll}
                    >
                        {running
                            ? <><span className="cc-spinner" /> Running…</>
                            : <><Play size={15} fill="currentColor" /> Run</>
                        }
                    </button>

                    {/* Run all tests */}
                    <button
                        className="btn cc-runall-btn"
                        onClick={runAll_}
                        disabled={running || runAll}
                    >
                        {runAll
                            ? <><span className="cc-spinner" /> Running All…</>
                            : <><Cpu size={15} /> Run All Tests</>
                        }
                    </button>
                </div>
            </div>

            {/* ── Main split layout ────────────────────────────────────────────── */}
            <div className="cc-layout">

                {/* LEFT — Code Editor */}
                <div className="cc-editor-panel">
                    <div className="cc-panel-header">
                        <Terminal size={14} className="text-primary" />
                        <span>main.c</span>
                    </div>
                    <div className="cc-editor-scroll">
                        <LineNumbers code={code} />
                        <textarea
                            ref={textareaRef}
                            className="cc-textarea"
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            onKeyDown={handleKeyDown}
                            spellCheck={false}
                            autoCapitalize="off"
                            autoCorrect="off"
                            autoComplete="off"
                        />
                    </div>
                </div>

                {/* RIGHT — Test Cases + Output */}
                <div className="cc-right-panel">

                    {/* Test Case Tabs */}
                    <div className="cc-panel-header" style={{ justifyContent: "space-between" }}>
                        <div className="cc-tc-tabs">
                            {testCases.map((tc, idx) => {
                                const r = allResults.find(r => r.tcId === tc.id);
                                const dot = r
                                    ? r.passed === true ? "🟢" : r.passed === false ? "🔴" : "🟡"
                                    : "";
                                return (
                                    <button
                                        key={tc.id}
                                        className={`cc-tab ${activeTab === idx ? "active" : ""}`}
                                        onClick={() => setActiveTab(idx)}
                                    >
                                        {dot && <span style={{ fontSize: "0.5rem" }}>{dot}</span>}
                                        Case {idx + 1}
                                        {testCases.length > 1 && (
                                            <span
                                                className="cc-tab-remove"
                                                onClick={e => { e.stopPropagation(); removeTestCase(idx); }}
                                                title="Remove"
                                            >×</span>
                                        )}
                                    </button>
                                );
                            })}
                            <button className="cc-tab cc-tab-add" onClick={addTestCase} title="Add test case">
                                <Plus size={12} />
                            </button>
                        </div>
                    </div>

                    {/* Active Test Case inputs */}
                    <div className="cc-tc-body">
                        <div className="cc-io-row">
                            <label className="cc-io-label">
                                <Terminal size={12} /> Stdin (Input)
                            </label>
                            <textarea
                                className="cc-io-area"
                                rows={4}
                                placeholder="Enter program input here…"
                                value={activeTc?.stdin ?? ""}
                                onChange={e => updateTc(activeTab, "stdin", e.target.value)}
                            />
                        </div>
                        <div className="cc-io-row">
                            <label className="cc-io-label">
                                <CheckCircle2 size={12} /> Expected Output
                                <span className="cc-io-hint">(optional — for pass/fail check)</span>
                            </label>
                            <textarea
                                className="cc-io-area"
                                rows={3}
                                placeholder="Expected output for auto-check…"
                                value={activeTc?.expected ?? ""}
                                onChange={e => updateTc(activeTab, "expected", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Output panel */}
                    <div className="cc-output-panel">
                        <div className="cc-panel-header">
                            <Terminal size={14} className="text-primary" />
                            <span>Output</span>
                            {(output || activeResult) && (() => {
                                const r = activeResult || output;
                                if (r?.error) return <span className="cc-status-badge err">Error</span>;
                                const m = statusMeta(r?.statusId);
                                return (
                                    <>
                                        <span className="cc-status-badge" style={{ background: `${m.color}22`, color: m.color, border: `1px solid ${m.color}44` }}>
                                            {m.icon} {m.label}
                                        </span>
                                        {r?.engine && (
                                            <span style={{ marginLeft: "auto", fontSize: "0.65rem", opacity: 0.4, fontFamily: "monospace" }}>
                                                via {r.engine}
                                            </span>
                                        )}
                                    </>
                                );
                            })()}
                        </div>

                        <div className="cc-output-body">
                            {/* Idle state */}
                            {!output && !activeResult && !running && !runAll && (
                                <div className="cc-output-idle">
                                    <Play size={32} className="opacity-20" />
                                    <p>Click <strong>Run</strong> to execute your code</p>
                                </div>
                            )}

                            {/* Loading */}
                            {(running || runAll) && (
                                <div className="cc-output-idle">
                                    <div className="admin-loader-ring" style={{ width: 36, height: 36 }} />
                                    <p style={{ marginTop: "0.75rem", color: "rgba(0,245,255,0.6)", fontSize: "0.8rem" }}>
                                        {runAll ? "Running all test cases…" : "Compiling & executing…"}
                                    </p>
                                </div>
                            )}

                            {/* Result */}
                            {!running && !runAll && (output || activeResult) && (() => {
                                const r = activeResult || output;

                                if (r?.error) return (
                                    <pre className="cc-output-pre cc-err">{r.error}</pre>
                                );

                                return (
                                    <>
                                        {r?.compile_output && (
                                            <div className="cc-output-section">
                                                <div className="cc-output-section-title warn">
                                                    <AlertTriangle size={12} /> Compile Output
                                                </div>
                                                <pre className="cc-output-pre cc-warn">{r.compile_output}</pre>
                                            </div>
                                        )}
                                        {r?.stderr && (
                                            <div className="cc-output-section">
                                                <div className="cc-output-section-title err">
                                                    <XCircle size={12} /> Standard Error
                                                </div>
                                                <pre className="cc-output-pre cc-err">{r.stderr}</pre>
                                            </div>
                                        )}
                                        {(r?.stdout !== undefined) && (
                                            <div className="cc-output-section">
                                                <div className="cc-output-section-title ok">
                                                    <CheckCircle2 size={12} /> Standard Output
                                                </div>
                                                <pre className="cc-output-pre cc-ok">
                                                    {r.stdout || <span className="opacity-40">(empty output)</span>}
                                                </pre>
                                            </div>
                                        )}

                                        {/* Pass / Fail check */}
                                        {activeTc?.expected?.trim() && r?.stdout !== undefined && (
                                            <div className={`cc-verdict ${r.stdout?.trim() === activeTc.expected.trim() ? "pass" : "fail"}`}>
                                                {r.stdout?.trim() === activeTc.expected.trim()
                                                    ? <><CheckCircle2 size={16} /> Test Passed — Output matches expected!</>
                                                    : <><XCircle size={16} /> Test Failed — Output does not match expected</>
                                                }
                                            </div>
                                        )}

                                        {/* Metadata */}
                                        {(r?.time || r?.memory) && (
                                            <div className="cc-meta-row">
                                                {r.time && <span><Clock size={12} /> {r.time}s</span>}
                                                {r.memory && <span><MemoryStick size={12} /> {r.memory} KB</span>}
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* All Results summary (after Run All) */}
                    {allResults.length > 0 && (
                        <div className="cc-all-summary">
                            {allResults.map((r, i) => {
                                const tc = testCases.find(t => t.id === r.tcId);
                                const pass = r.passed;
                                return (
                                    <div
                                        key={r.tcId}
                                        className={`cc-all-row ${pass === true ? "pass" : pass === false ? "fail" : "neutral"}`}
                                        onClick={() => setActiveTab(i)}
                                    >
                                        {pass === true
                                            ? <CheckCircle2 size={14} />
                                            : pass === false
                                                ? <XCircle size={14} />
                                                : <Terminal size={14} />
                                        }
                                        Case {i + 1}
                                        {tc?.expected?.trim()
                                            ? (pass === true ? " — Passed" : " — Failed")
                                            : " — No expected set"
                                        }
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
