import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    Code2, Plus, Trash2, ChevronLeft, Save,
    Terminal, FlaskConical, Clock, Users,
} from "lucide-react";
import toast from "react-hot-toast";
import "./CreateCodingModule.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const BATCHES = ["ES-B2", "ES-B3", "DV-B8", "DV-B9", "DV-B10", "DV-B11", "DV-B12"];

const emptyTestCase = () => ({ input: "", expectedOutput: "" });
const emptyQuestion = () => ({ questionText: "", testCases: [emptyTestCase(), emptyTestCase(), emptyTestCase()] });

export default function CreateCodingModule() {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState("");
    const [timer, setTimer] = useState(60);
    const [batches, setBatches] = useState([]);
    const [questions, setQuestions] = useState([emptyQuestion()]);

    // ── Batch toggle ────────────────────────────────────────────────────────────
    const toggleBatch = (b) =>
        setBatches(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);

    // ── Question helpers ────────────────────────────────────────────────────────
    const addQuestion = () => setQuestions(prev => [...prev, emptyQuestion()]);

    const removeQuestion = (qi) =>
        setQuestions(prev => prev.filter((_, i) => i !== qi));

    const updateQuestion = (qi, val) =>
        setQuestions(prev => prev.map((q, i) => i === qi ? { ...q, questionText: val } : q));

    // ── Test-case helpers ───────────────────────────────────────────────────────
    const addTestCase = (qi) =>
        setQuestions(prev => prev.map((q, i) =>
            i === qi ? { ...q, testCases: [...q.testCases, emptyTestCase()] } : q));

    const removeTestCase = (qi, ti) =>
        setQuestions(prev => prev.map((q, i) =>
            i === qi ? { ...q, testCases: q.testCases.filter((_, j) => j !== ti) } : q));

    const updateTestCase = (qi, ti, field, val) =>
        setQuestions(prev => prev.map((q, i) =>
            i === qi
                ? { ...q, testCases: q.testCases.map((tc, j) => j === ti ? { ...tc, [field]: val } : tc) }
                : q));

    // ── Submit ──────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!title.trim()) return toast.error("Module title is required");
        if (batches.length === 0) return toast.error("Select at least one batch");
        if (questions.some(q => !q.questionText.trim()))
            return toast.error("All questions must have text");
        if (questions.some(q => q.testCases.some(tc => !tc.expectedOutput.trim())))
            return toast.error("All test cases must have an Expected Output");

        const token = localStorage.getItem("adminToken");
        setSaving(true);
        try {
            await axios.post(
                `${API_URL}/coding-modules/create`,
                { title: title.trim(), assignedBatch: batches, timer: Number(timer), questions },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Coding module created!");
            navigate("/admin");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create module");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="ccm-root fade-in">
            {/* ── Header ────────────────────────────────────────────────────────── */}
            <div className="ccm-header">
                <button className="btn btn-secondary btn-sm" onClick={() => navigate("/admin")}>
                    <ChevronLeft size={16} /> Back
                </button>
                <div className="ccm-header-title">
                    <Code2 size={22} className="text-primary" />
                    <h1>Create Coding Assessment Module</h1>
                </div>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? <><span className="cc-spinner" /> Saving…</> : <><Save size={15} /> Save Module</>}
                </button>
            </div>

            <div className="ccm-body">
                {/* ── Meta card ───────────────────────────────────────────────────── */}
                <div className="card ccm-meta-card">
                    <div className="ccm-meta-row">
                        <div className="ccm-meta-field ccm-title-field">
                            <label><Code2 size={13} /> Module Title</label>
                            <input
                                className="input"
                                placeholder="e.g. C Programming – Arrays & Pointers"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="ccm-meta-field">
                            <label><Clock size={13} /> Duration (min)</label>
                            <input
                                type="number" min={5} max={180} className="input ccm-timer-input"
                                value={timer} onChange={e => setTimer(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Batch selector */}
                    <div className="ccm-batch-section">
                        <label><Users size={13} /> Assign to Batches</label>
                        <div className="ccm-batch-grid">
                            {BATCHES.map(b => (
                                <button
                                    key={b}
                                    className={`ccm-batch-chip ${batches.includes(b) ? "active" : ""}`}
                                    onClick={() => toggleBatch(b)}
                                >
                                    {b}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Questions ───────────────────────────────────────────────────── */}
                <div className="ccm-questions">
                    {questions.map((q, qi) => (
                        <div key={qi} className="card ccm-question-card">
                            {/* Question header */}
                            <div className="ccm-qn-header">
                                <div className="ccm-qn-number">Q{qi + 1}</div>
                                <div className="ccm-qn-title-input">
                                    <textarea
                                        className="ccm-qn-textarea"
                                        rows={3}
                                        placeholder={`Describe question ${qi + 1} — e.g. "Write a C program that prints the reverse of an array of N integers."`}
                                        value={q.questionText}
                                        onChange={e => updateQuestion(qi, e.target.value)}
                                    />
                                </div>
                                {questions.length > 1 && (
                                    <button className="ccm-remove-btn" onClick={() => removeQuestion(qi)} title="Remove question">
                                        <Trash2 size={15} />
                                    </button>
                                )}
                            </div>

                            {/* Test cases */}
                            <div className="ccm-tc-section">
                                <div className="ccm-tc-section-title">
                                    <FlaskConical size={13} /> Test Cases
                                    <span className="ccm-tc-hint">Each carries 1 pt — max {q.testCases.length} pts</span>
                                </div>

                                <div className="ccm-tc-list">
                                    {q.testCases.map((tc, ti) => (
                                        <div key={ti} className="ccm-tc-row">
                                            <span className="ccm-tc-label">Case {ti + 1}</span>
                                            <div className="ccm-tc-fields">
                                                <div className="ccm-tc-field">
                                                    <label><Terminal size={11} /> Input (stdin)</label>
                                                    <textarea
                                                        className="ccm-tc-area"
                                                        rows={3}
                                                        placeholder="e.g. 5&#10;1 2 3 4 5"
                                                        value={tc.input}
                                                        onChange={e => updateTestCase(qi, ti, "input", e.target.value)}
                                                    />
                                                </div>
                                                <div className="ccm-tc-field">
                                                    <label><FlaskConical size={11} /> Expected Output</label>
                                                    <textarea
                                                        className="ccm-tc-area"
                                                        rows={3}
                                                        placeholder="e.g. 5 4 3 2 1"
                                                        value={tc.expectedOutput}
                                                        onChange={e => updateTestCase(qi, ti, "expectedOutput", e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            {q.testCases.length > 1 && (
                                                <button className="ccm-tc-remove" onClick={() => removeTestCase(qi, ti)} title="Remove case">
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <button className="ccm-add-tc-btn" onClick={() => addTestCase(qi)}>
                                    <Plus size={13} /> Add Test Case
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Add Question button ─────────────────────────────────────────── */}
                <button className="ccm-add-qn-btn" onClick={addQuestion}>
                    <Plus size={16} /> Add Question
                </button>
            </div>
        </div>
    );
}
