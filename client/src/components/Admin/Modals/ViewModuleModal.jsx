import React from "react";
import { X, Edit3, Trash2, Save, FileUp, PlusCircle } from "lucide-react";
import CodeHighlighter from "../../Assessment/CodeHighlighter";

const ViewModuleModal = ({
    viewModule,
    setViewModule,
    getModuleQuestions,
    editingQuestion,
    setEditingQuestion,
    addingQuestion,
    setAddingQuestion,
    editForm,
    setEditForm,
    saveEditQuestion,
    startEditQuestion,
    deleteQuestion,
    handleBatchUpload,
    addQuestionToModule,
    newQForm,
    setNewQForm,
    API_URL
}) => {
    if (!viewModule) return null;

    return (
        <div className="modal-overlay no-scrollbar">
            <div className="modal-content fade-in no-scrollbar" style={{ maxWidth: "800px" }}>
                <div className="flex justify-between items-top p-3 modal-header">
                    <div>
                        <h2>{viewModule.topicName}</h2>
                        <div className="flex gap-2 mt-2">
                            <span className="badge badge-primary">{viewModule.courseType}</span>
                            <span className="badge">{viewModule.difficultyLevel}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => { setViewModule(null); setEditingQuestion(null); setAddingQuestion(false); }}
                        className="text-secondary close-modal-btn"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-form-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                    {getModuleQuestions(viewModule).map((q, index) => (
                        <div
                            key={q._id}
                            className="p-4 mb-4 rounded-xl border border-white/10"
                            style={{ background: "rgba(0,0,0,0.2)" }}
                        >
                            {editingQuestion === q._id ? (
                                // EDIT MODE
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs text-warning font-bold">Editing Q{index + 1}</span>
                                    </div>
                                    <input
                                        value={editForm.qn}
                                        onChange={(e) => setEditForm({ ...editForm, qn: e.target.value })}
                                        placeholder="Question"
                                        style={{ marginBottom: "0.75rem" }}
                                    />
                                    <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                                        {['optionA', 'optionB', 'optionC', 'optionD'].map(opt => (
                                            <input
                                                key={opt}
                                                placeholder={opt.replace('option', 'Option ')}
                                                value={editForm[opt]}
                                                onChange={(e) => setEditForm({ ...editForm, [opt]: e.target.value })}
                                                style={{ marginBottom: "0.5rem" }}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex gap-3">
                                        <div style={{ width: "140px" }}>
                                            <label className="text-xs">Correct Answer</label>
                                            <select
                                                value={editForm.correctAnswer}
                                                onChange={(e) => setEditForm({ ...editForm, correctAnswer: e.target.value })}
                                            >
                                                <option value="A">A</option>
                                                <option value="B">B</option>
                                                <option value="C">C</option>
                                                <option value="D">D</option>
                                            </select>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label className="text-xs">Explanation</label>
                                            <input
                                                value={editForm.explanation}
                                                onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            className="btn btn-primary text-xs"
                                            style={{ padding: "0.4rem 0.8rem" }}
                                            onClick={() => saveEditQuestion(viewModule._id, q._id)}
                                        >
                                            <Save size={14} /> Save
                                        </button>
                                        <button
                                            className="btn btn-secondary text-xs"
                                            style={{ padding: "0.4rem 0.8rem" }}
                                            onClick={() => setEditingQuestion(null)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // VIEW MODE
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs text-primary font-bold">Q{index + 1}</span>
                                        <div className="flex gap-2">
                                            <button
                                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary-color)" }}
                                                onClick={() => startEditQuestion(q)}
                                                title="Edit question"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger-color)" }}
                                                onClick={() => deleteQuestion(viewModule._id, q._id)}
                                                title="Delete question"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <p style={{ fontWeight: 600, marginBottom: q.questionType === "code" && q.codeSnippet ? "0.4rem" : "0.75rem" }}>
                                        {q.qn}
                                    </p>
                                    {/* Image preview */}
                                    {q.questionImage && (
                                        <div className="mb-3" style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                                            <img
                                                src={q.questionImage.startsWith('http') ? q.questionImage : `${API_URL.replace('/api', '')}/uploads/${q.questionImage}`}
                                                alt="Question"
                                                style={{ maxWidth: "100%", maxHeight: "250px", display: "block" }}
                                            />
                                        </div>
                                    )}
                                    {/* Code block — syntax-highlighted */}
                                    {q.questionType === "code" && q.codeSnippet && (
                                        <CodeHighlighter code={q.codeSnippet} />
                                    )}
                                    <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                                        {['A', 'B', 'C', 'D'].map((letter, i) => (
                                            <div
                                                key={letter}
                                                className="p-2 rounded-lg text-sm"
                                                style={{
                                                    background: q.correctAnswer === letter
                                                        ? "rgba(16, 185, 129, 0.15)"
                                                        : "rgba(255,255,255,0.03)",
                                                    border: q.correctAnswer === letter
                                                        ? "1px solid rgba(16, 185, 129, 0.3)"
                                                        : "1px solid rgba(255,255,255,0.05)",
                                                    color: q.correctAnswer === letter
                                                        ? "#10b981"
                                                        : "var(--text-secondary)",
                                                }}
                                            >
                                                <span style={{ fontWeight: 700, marginRight: "0.5rem" }}>{letter}.</span>
                                                {q.options[i]}
                                            </div>
                                        ))}
                                    </div>
                                    {q.explanation && (
                                        <p className="text-xs text-secondary mt-2" style={{ fontStyle: "italic" }}>
                                            💡 {q.explanation}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    {getModuleQuestions(viewModule).length === 0 && (
                        <p className="text-center text-secondary py-8">No questions in this module.</p>
                    )}

                    {/* ── Add Question Panel ── */}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1rem", marginTop: "0.5rem" }}>
                        {!addingQuestion ? (
                            <div className="flex gap-2">
                                <input
                                    type="file"
                                    id="batch-upload-existing"
                                    accept=".txt"
                                    onChange={handleBatchUpload}
                                    style={{ display: "none" }}
                                />
                                <button
                                    className="btn btn-secondary"
                                    style={{ flex: 1, padding: "0.55rem", border: "1px dashed var(--primary-color)", color: "var(--primary-color)" }}
                                    onClick={() => document.getElementById('batch-upload-existing').click()}
                                >
                                    <FileUp size={16} /> Batch Upload (.txt)
                                </button>
                                <button
                                    className="btn btn-primary"
                                    style={{ flex: 1, padding: "0.55rem" }}
                                    onClick={() => setAddingQuestion(true)}
                                >
                                    <PlusCircle size={16} /> Add Question
                                </button>
                            </div>
                        ) : (
                            <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: "12px", padding: "1rem" }}>
                                <p style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.75rem" }}>New Question</p>

                                {/* Type selectors */}
                                <div className="flex gap-3" style={{ marginBottom: "0.75rem" }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: "0.75rem" }}>Question Type</label>
                                        <select
                                            value={newQForm.questionType}
                                            onChange={(e) => setNewQForm({ ...newQForm, questionType: e.target.value })}
                                        >
                                            <option value="plain">📝 Plain Text</option>
                                            <option value="code">💻 Code Snippet</option>
                                        </select>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: "0.75rem" }}>Option Methodology</label>
                                        <select
                                            value={newQForm.optionType}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const patch = { optionType: val };
                                                if (val === "truefalse") {
                                                    patch.optionA = "True"; patch.optionB = "False";
                                                    patch.optionC = ""; patch.optionD = "";
                                                    patch.correctAnswer = "A";
                                                }
                                                setNewQForm({ ...newQForm, ...patch });
                                            }}
                                        >
                                            <option value="multiple">Multiple Choice (A/B/C/D)</option>
                                            <option value="single">Single Choice (A/B/C/D)</option>
                                            <option value="truefalse">True / False</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Question text */}
                                {newQForm.questionType === "code" ? (
                                    <textarea
                                        placeholder="Paste code snippet here..."
                                        value={newQForm.qn}
                                        onChange={(e) => setNewQForm({ ...newQForm, qn: e.target.value })}
                                        rows={5}
                                        style={{
                                            width: "100%", marginBottom: "0.75rem",
                                            fontFamily: "'Courier New', monospace", fontSize: "0.82rem",
                                            background: "rgba(0,0,0,0.35)", border: "1px solid var(--border-color)",
                                            borderRadius: "8px", padding: "0.6rem 0.8rem", color: "var(--text-primary)",
                                            resize: "vertical", boxSizing: "border-box",
                                        }}
                                    />
                                ) : (
                                    <input
                                        placeholder="Enter question text"
                                        value={newQForm.qn}
                                        onChange={(e) => setNewQForm({ ...newQForm, qn: e.target.value })}
                                        style={{ marginBottom: "0.75rem" }}
                                    />
                                )}

                                {/* Options */}
                                {newQForm.optionType === "truefalse" ? (
                                    <div className="flex gap-3" style={{ marginBottom: "0.75rem" }}>
                                        {["A", "B"].map(opt => (
                                            <div key={opt} style={{
                                                display: "flex", alignItems: "center", gap: "0.5rem", flex: 1,
                                                padding: "0.4rem 0.6rem", borderRadius: "8px",
                                                border: `1px solid ${newQForm.correctAnswer === opt ? "rgba(56,189,248,0.5)" : "rgba(255,255,255,0.08)"}`,
                                                background: newQForm.correctAnswer === opt ? "rgba(56,189,248,0.08)" : "transparent",
                                                cursor: "pointer",
                                            }} onClick={() => setNewQForm({ ...newQForm, correctAnswer: opt })}>
                                                <input type="radio" readOnly checked={newQForm.correctAnswer === opt}
                                                    style={{ accentColor: "var(--primary-color)", pointerEvents: "none" }} />
                                                <span style={{ fontWeight: 600 }}>{opt === "A" ? "True" : "False"}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
                                        {["A", "B", "C", "D"].map(opt => (
                                            <input key={opt} placeholder={`Option ${opt}`}
                                                value={newQForm[`option${opt}`]}
                                                onChange={(e) => setNewQForm({ ...newQForm, [`option${opt}`]: e.target.value })}
                                                style={{ margin: 0 }}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Correct answer + explanation row */}
                                <div className="flex gap-3" style={{ marginBottom: "0.75rem" }}>
                                    {newQForm.optionType !== "truefalse" && (
                                        <div style={{ width: "140px" }}>
                                            <label style={{ fontSize: "0.75rem" }}>Correct Answer</label>
                                            <select value={newQForm.correctAnswer}
                                                onChange={(e) => setNewQForm({ ...newQForm, correctAnswer: e.target.value })}>
                                                <option value="A">A</option>
                                                <option value="B">B</option>
                                                <option value="C">C</option>
                                                <option value="D">D</option>
                                            </select>
                                        </div>
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: "0.75rem" }}>Explanation (optional)</label>
                                        <input value={newQForm.explanation}
                                            onChange={(e) => setNewQForm({ ...newQForm, explanation: e.target.value })}
                                            placeholder="Why is this correct?" />
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button className="btn btn-primary text-xs" style={{ padding: "0.45rem 0.9rem" }}
                                        onClick={addQuestionToModule}>
                                        <Save size={14} /> Save Question
                                    </button>
                                    <button className="btn btn-secondary text-xs" style={{ padding: "0.45rem 0.9rem" }}
                                        onClick={() => { setAddingQuestion(false); setNewQForm({ qn: "", questionType: "plain", optionType: "multiple", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A", explanation: "" }); }}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewModuleModal;
