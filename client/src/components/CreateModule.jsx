import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { PlusCircle, Minus, ArrowLeft, Code2, Eye, FileUp } from "lucide-react";
import CodeHighlighter from "./Assessment/CodeHighlighter";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
// BATCH_OPTIONS removed

const getAdminHeaders = () => {
    const token = localStorage.getItem("adminToken");
    return { headers: { Authorization: `Bearer ${token}` } };
};

const emptyQuestion = () => ({
    qn: "",
    codeSnippet: "",
    questionType: "plain",   // "plain" | "code"
    optionType: "multiple",  // "multiple" | "single" | "truefalse"
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A",
    explanation: "",
});

const CreateModule = () => {
    const navigate = useNavigate();

    const [newModule, setNewModule] = useState({
        topicName: "",
        courseType: "ASIC-DV",
        difficultyLevel: "Medium",
        assignedBatch: "",
    });

    const [formQuestions, setFormQuestions] = useState([emptyQuestion()]);
    const [batches, setBatches] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    React.useEffect(() => {
        const fetchBatches = async () => {
            try {
                const res = await axios.get(`${API_URL}/batches`);
                setBatches(res.data || []);
            } catch (err) {
                console.error("Failed to fetch batches", err);
            }
        };
        fetchBatches();
    }, []);

    const parseUploadedFile = (text) => {
        console.log('[Frontend Parser] Starting extraction, text length:', text.length);
        const questions = [];
        const chunks = text.split(/===QUESTION START===/i);

        chunks.forEach((chunk, index) => {
            if (!chunk.trim()) return;

            try {
                const contentParts = chunk.split(/===QUESTION END===/i);
                let cleanBlock = contentParts[0].trim();
                if (!cleanBlock) return;

                // Normalize whitespace
                cleanBlock = cleanBlock.replace(/\u00A0/g, ' ');

                // 1. Identify where options start (A. or A) or a. or a))
                // Even more permissive: match A. or A) with optional space
                const optAStartMatch = cleanBlock.match(/(?:\s|^)[A][\.\)]/i);
                if (!optAStartMatch) {
                    console.warn(`[Frontend Parser] Skipping block ${index}: No Option A marker found. Prefix: "${cleanBlock.substring(0, 100)}..."`);
                    return;
                }

                const aIndex = optAStartMatch.index;
                const aCharIndex = cleanBlock.indexOf(optAStartMatch[0].trim(), aIndex);

                let rawQnText = cleanBlock.substring(0, aCharIndex).trim();

                // Separate CODE: if present
                let codeSnippet = "";
                let questionType = "plain";

                const codeLabelMatch = rawQnText.match(/CODE:\s*([\s\S]*)/i);
                if (codeLabelMatch) {
                    questionType = "code";
                    codeSnippet = codeLabelMatch[1].trim();
                    rawQnText = rawQnText.split(/CODE:/i)[0].trim();
                }

                // Final cleanup of question text
                let qnText = rawQnText.replace(/QUESTION:\s*/gi, '').trim();
                // Strip leading numbers
                qnText = qnText.replace(/^\d+[\.\)]?\s*/, '');

                // 2. Extract options A, B, C, D
                const getOpt = (letter, nextLetters) => {
                    const nextSelector = `(?:\\s+${nextLetters}[\\.\\)]|\\s+Answer:)`;
                    const regex = new RegExp(`${letter}[\\.\\)]\\s*([\\s\\S]*?)(?=${nextSelector})`, 'i');
                    const match = cleanBlock.match(regex);
                    return match ? match[1].trim() : "";
                };

                let valA = getOpt('A', '[B-D]');
                let valB = getOpt('B', '[C-D]');
                let valC = getOpt('C', 'D');
                const optDMatch = cleanBlock.match(/D[\.\)]\s*([\s\S]*?)(?=\s+Answer:)/i);
                let valD = optDMatch ? optDMatch[1].trim() : "";

                // Cleanup labels
                const stripLabels = (val) => val.replace(/^(?:OPTIONS|CODE|QUESTION):\s*/gi, '').trim();
                valA = stripLabels(valA); valB = stripLabels(valB); valC = stripLabels(valC); valD = stripLabels(valD);

                const options = [valA, valB, valC, valD];

                // 3. Extract Answer Letter
                const answerMatch = cleanBlock.match(/Answer:\s*([A-D])/i);
                const answerLetter = answerMatch ? answerMatch[1].toUpperCase() : "A";

                // 4. Extract Explanation
                const expMatch = cleanBlock.match(/Explanation:\s*([\s\S]*?)$/i);
                const explanation = expMatch ? expMatch[1].trim() : "";

                if (qnText && (valA || valB)) {
                    console.log(`[Frontend Parser] Successfully parsed Q${index}: "${qnText.substring(0, 30)}..."`);
                    questions.push({
                        qn: qnText,
                        codeSnippet: codeSnippet,
                        questionType: questionType,
                        optionType: "multiple",
                        optionA: valA,
                        optionB: valB,
                        optionC: valC,
                        optionD: valD,
                        correctAnswer: answerLetter,
                        explanation: explanation,
                    });
                } else {
                    console.warn(`[Frontend Parser] Block ${index} rejected. qnText: ${!!qnText}, valA: ${!!valA}`);
                }
            } catch (err) {
                console.error('[Frontend Parser] Error in chunk:', err);
            }
        });

        console.log('[Frontend Parser] Successfully extracted:', questions.length);
        return questions;
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const parsedQuestions = parseUploadedFile(text);
            if (parsedQuestions.length > 0) {
                if (formQuestions.length === 1 && !formQuestions[0].qn) {
                    setFormQuestions(parsedQuestions);
                } else {
                    setFormQuestions([...formQuestions, ...parsedQuestions]);
                }
                toast.success(`Successfully extracted ${parsedQuestions.length} questions!`);
            } else {
                toast.error("No valid questions found in the file. Check file structure.");
            }
            // Reset input so same file can be uploaded again if needed
            e.target.value = "";
        };
        reader.readAsText(file);
    };

    const handleDocxUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        const loadingToast = toast.loading("Uploading and parsing .docx file...");
        try {
            const res = await axios.post(
                `${API_URL}/modules/parse-docx`,
                formData,
                {
                    ...getAdminHeaders(),
                    headers: {
                        ...getAdminHeaders().headers,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            const parsedQuestions = res.data.questions.map(q => ({
                qn: q.qn,
                codeSnippet: "",
                questionType: "plain",
                optionType: "multiple",
                optionA: q.options[0],
                optionB: q.options[1],
                optionC: q.options[2],
                optionD: q.options[3],
                correctAnswer: ['A', 'B', 'C', 'D'][q.options.indexOf(q.answer)] || "A",
                explanation: q.explanation,
                questionImage: q.questionImage // Cloudinary URL
            }));

            if (parsedQuestions.length > 0) {
                if (formQuestions.length === 1 && !formQuestions[0].qn) {
                    setFormQuestions(parsedQuestions);
                } else {
                    setFormQuestions([...formQuestions, ...parsedQuestions]);
                }
                toast.success(`Successfully extracted ${parsedQuestions.length} questions!`, { id: loadingToast });
            } else {
                toast.error("No valid questions found in the file.", { id: loadingToast });
            }
        } catch (err) {
            console.error("Docx upload error:", err);
            toast.error(err.response?.data?.message || "Error processing .docx file", { id: loadingToast });
        } finally {
            e.target.value = "";
        }
    };

    const addQuestion = () => {
        setFormQuestions([...formQuestions, emptyQuestion()]);
    };

    const removeQuestion = (index) => {
        if (formQuestions.length <= 1) {
            return toast.error("At least one question is required");
        }
        setFormQuestions(formQuestions.filter((_, i) => i !== index));
    };

    const updateQuestion = (index, field, value) => {
        const updated = [...formQuestions];
        updated[index][field] = value;
        // When switching to truefalse, set options and reset correct answer
        if (field === "optionType" && value === "truefalse") {
            updated[index].optionA = "True";
            updated[index].optionB = "False";
            updated[index].optionC = "";
            updated[index].optionD = "";
            updated[index].correctAnswer = "A";
        }
        setFormQuestions(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newModule.topicName) return toast.error("Topic name is required");
        if (!newModule.assignedBatch) return toast.error("Please select a target batch");

        for (let i = 0; i < formQuestions.length; i++) {
            const q = formQuestions[i];
            if (!q.qn) return toast.error(`Question ${i + 1}: Question text is required`);
            if (q.questionType === "code" && !q.codeSnippet) {
                return toast.error(`Question ${i + 1}: Code snippet is required for code-type questions`);
            }
            if (q.optionType !== "truefalse") {
                if (!q.optionA || !q.optionB || !q.optionC || !q.optionD) {
                    return toast.error(`Question ${i + 1}: Please fill all 4 options`);
                }
            }
        }

        setSubmitting(true);
        try {
            await axios.post(
                `${API_URL}/modules/create`,
                {
                    topicName: newModule.topicName,
                    courseType: newModule.courseType,
                    difficultyLevel: newModule.difficultyLevel,
                    assignedBatch: [newModule.assignedBatch],
                    questions: formQuestions,
                },
                getAdminHeaders()
            );
            toast.success("Module created successfully!");
            navigate("/admin");
        } catch (err) {
            toast.error(err.response?.data?.message || "Error creating module");
        } finally {
            setSubmitting(false);
        }
    };

    // Determine which option letters to show based on optionType
    const getVisibleOptions = (optionType) => {
        if (optionType === "truefalse") return ["A", "B"];
        return ["A", "B", "C", "D"];
    };

    return (
        <div className="container fade-in">
            {/* Page Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate("/admin")}
                    className="btn btn-secondary"
                    style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                >
                    <ArrowLeft size={16} /> Back
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: "1.4rem" }}>Create Assessment Module</h1>
                    <p className="text-secondary" style={{ margin: 0, fontSize: "0.85rem" }}>
                        Fill in module details and add as many questions as needed
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Module Info Card */}
                <div className="card mb-4" style={{ padding: "1.25rem" }}>
                    <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem" }}>Module Details</h3>
                    <div className="grid gap-3">
                        <div>
                            <label>Topic Designation</label>
                            <input
                                value={newModule.topicName}
                                onChange={(e) => setNewModule({ ...newModule, topicName: e.target.value })}
                                placeholder="e.g., Verilog Logic Synthesis"
                                required
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label>Course Type</label>
                                <select
                                    value={newModule.courseType}
                                    onChange={(e) => setNewModule({ ...newModule, courseType: e.target.value })}
                                >
                                    <option value="ASIC-DV">ASIC-DV</option>
                                    <option value="Embedded">Embedded Systems</option>
                                    <option value="VLSI">VLSI Design</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label>Complexity Level</label>
                                <select
                                    value={newModule.difficultyLevel}
                                    onChange={(e) => setNewModule({ ...newModule, difficultyLevel: e.target.value })}
                                >
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label>Target Batch</label>
                                <select
                                    value={newModule.assignedBatch}
                                    onChange={(e) => setNewModule({ ...newModule, assignedBatch: e.target.value })}
                                    required
                                >
                                    <option value="" disabled>Select Batch</option>
                                    {batches.map((b) => (
                                        <option key={b._id} value={b.name}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Questions Section */}
                <div className="flex justify-between items-center mb-3">
                    <h3 style={{ margin: 0, fontSize: "1rem" }}>
                        Questions <span className="text-secondary" style={{ fontSize: "0.85rem" }}>({formQuestions.length})</span>
                    </h3>
                </div>

                <div className="flex flex-col gap-3 mb-6">
                    {formQuestions.map((q, index) => {
                        const visibleOpts = getVisibleOptions(q.optionType);
                        const isTrueFalse = q.optionType === "truefalse";
                        return (
                            <div
                                key={index}
                                className="card"
                                style={{ padding: "1rem", background: "rgba(0,0,0,0.25)" }}
                            >
                                {/* Q Header */}
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-primary" style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                                        Q{index + 1}
                                    </span>
                                    {formQuestions.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeQuestion(index)}
                                            className="text-danger"
                                            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem" }}
                                        >
                                            <Minus size={14} /> Remove
                                        </button>
                                    )}
                                </div>

                                {/* Row: Question Type + Option Type */}
                                <div className="flex gap-3 mb-3">
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: "0.78rem", marginBottom: "4px", display: "block" }}>
                                            Question Type
                                        </label>
                                        <select
                                            value={q.questionType}
                                            onChange={(e) => updateQuestion(index, "questionType", e.target.value)}
                                        >
                                            <option value="plain">📝 Plain Text</option>
                                            <option value="code">💻 Code Snippet</option>
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: "0.78rem", marginBottom: "4px", display: "block" }}>
                                            Option Methodology
                                        </label>
                                        <select
                                            value={q.optionType}
                                            onChange={(e) => updateQuestion(index, "optionType", e.target.value)}
                                        >
                                            <option value="multiple">Multiple Choice (A/B/C/D)</option>
                                            <option value="single">Single Choice (A/B/C/D)</option>
                                            <option value="truefalse">True / False</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Question Text — always shown */}
                                <input
                                    placeholder={q.questionType === "code"
                                        ? "Enter the question (e.g. What is the output of this code?)"
                                        : "Enter question text"}
                                    value={q.qn}
                                    onChange={(e) => updateQuestion(index, "qn", e.target.value)}
                                    required
                                    style={{ marginBottom: "0.75rem" }}
                                />

                                {q.questionImage && (
                                    <div style={{ marginBottom: "0.75rem", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
                                        <img
                                            src={q.questionImage}
                                            alt="Question"
                                            style={{ maxWidth: "100%", maxHeight: "300px", display: "block", margin: "0 auto" }}
                                        />
                                    </div>
                                )}

                                {/* Code Snippet — textarea + live syntax preview */}
                                {q.questionType === "code" && (
                                    <div style={{ marginBottom: "0.75rem" }}>

                                        {/* Textarea Label */}
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                                            <Code2 size={13} style={{ color: "var(--primary-color)" }} />
                                            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Code Snippet</span>
                                        </div>

                                        {/* Raw textarea — where admin types */}
                                        <textarea
                                            placeholder="Paste your code snippet here..."
                                            value={q.codeSnippet}
                                            onChange={(e) => updateQuestion(index, "codeSnippet", e.target.value)}
                                            required
                                            rows={6}
                                            style={{
                                                fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
                                                fontSize: "0.82rem",
                                                lineHeight: 1.6,
                                                resize: "vertical",
                                                width: "100%",
                                                background: "rgba(0,0,0,0.35)",
                                                border: "1px solid var(--border-color)",
                                                borderRadius: "8px",
                                                padding: "0.6rem 0.8rem",
                                                color: "#e4e4e7",
                                                boxSizing: "border-box",
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Options */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.75rem" }}>
                                    {visibleOpts.map((opt) => {
                                        const field = `option${opt}`;
                                        const isCorrect = q.correctAnswer === opt;
                                        const optLabel = isTrueFalse ? (opt === "A" ? "True" : "False") : opt;
                                        return (
                                            <div
                                                key={opt}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.6rem",
                                                    padding: "0.35rem 0.6rem",
                                                    borderRadius: "8px",
                                                    border: `1px solid ${isCorrect ? "rgba(56,189,248,0.5)" : "transparent"}`,
                                                    background: isCorrect ? "rgba(56,189,248,0.08)" : "transparent",
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`correct-${index}`}
                                                    checked={isCorrect}
                                                    onChange={() => updateQuestion(index, "correctAnswer", opt)}
                                                    style={{ accentColor: "var(--primary-color)", width: "16px", height: "16px", cursor: "pointer", flexShrink: 0, margin: 0 }}
                                                    title="Mark as correct answer"
                                                />
                                                <span style={{
                                                    fontWeight: 700,
                                                    fontSize: "0.8rem",
                                                    color: isCorrect ? "var(--primary-color)" : "var(--text-secondary)",
                                                    width: "40px",
                                                    flexShrink: 0,
                                                }}>
                                                    {optLabel}
                                                </span>
                                                {isTrueFalse ? (
                                                    /* True/False: display static label, no editable input */
                                                    <span style={{ fontSize: "0.85rem", color: "var(--text-primary)", flex: 1 }}>
                                                        {optLabel}
                                                    </span>
                                                ) : (
                                                    <input
                                                        placeholder={`Option ${opt}`}
                                                        value={q[field]}
                                                        onChange={(e) => updateQuestion(index, field, e.target.value)}
                                                        required
                                                        style={{ margin: 0, flex: 1, background: "transparent", border: "none", borderBottom: "1px solid var(--border-color)", borderRadius: 0, padding: "0.2rem 0.3rem" }}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Correct Answer Summary for true/false */}
                                {isTrueFalse && (
                                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                                        ☝ Click the radio button to mark the correct answer (True or False)
                                    </p>
                                )}

                                {/* Explanation */}
                                <div>
                                    <label style={{ fontSize: "0.8rem" }}>Explanation (optional)</label>
                                    <input
                                        placeholder="Why is this the correct answer?"
                                        value={q.explanation}
                                        onChange={(e) => updateQuestion(index, "explanation", e.target.value)}
                                        style={{ margin: 0 }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 mb-8">
                    <div className="flex gap-2">
                        <input
                            type="file"
                            id="question-upload"
                            accept=".txt"
                            onChange={handleFileUpload}
                            style={{ display: "none" }}
                        />
                        <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: "0.4rem 0.9rem", fontSize: "0.85rem", border: "1px dashed var(--primary-color)", color: "var(--primary-color)" }}
                            onClick={() => document.getElementById('question-upload').click()}
                        >
                            <FileUp size={15} /> Batch Upload (.txt)
                        </button>
                        <input
                            type="file"
                            id="docx-upload"
                            accept=".docx"
                            onChange={handleDocxUpload}
                            style={{ display: "none" }}
                        />
                        <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: "0.4rem 0.9rem", fontSize: "0.85rem", border: "1px dashed var(--primary-color)", color: "var(--primary-color)" }}
                            onClick={() => document.getElementById('docx-upload').click()}
                        >
                            <FileUp size={15} /> Batch Upload (.docx)
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: "0.4rem 0.9rem", fontSize: "0.85rem" }}
                            onClick={addQuestion}
                        >
                            <PlusCircle size={15} /> Add Question
                        </button>
                    </div>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate("/admin")}
                    >
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? "Creating..." : `Create Module (${formQuestions.length} Questions)`}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateModule;
