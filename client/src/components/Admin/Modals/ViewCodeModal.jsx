import React from "react";
import { X } from "lucide-react";
import CodeHighlighter from "../../Assessment/CodeHighlighter";

const ViewCodeModal = ({
    viewCodeModal,
    setViewCodeModal,
    codingModules
}) => {
    if (!viewCodeModal.show || !viewCodeModal.submission) return null;

    const submission = viewCodeModal.submission;
    const module = codingModules.find(m => m._id === submission.moduleId?.toString() || m._id === submission.moduleId);

    return (
        <div className="modal-overlay no-scrollbar">
            <div className="modal-content fade-in no-scrollbar" style={{ maxWidth: "900px" }}>
                <div className="flex justify-between items-center p-3 modal-header">
                    <div>
                        <h2>Candidate Submission: {submission.userName}</h2>
                        <p className="text-secondary text-sm">
                            Module: {module?.title || "—"}
                        </p>
                    </div>
                    <button
                        onClick={() => setViewCodeModal({ show: false, submission: null })}
                        className="text-secondary close-modal-btn"
                    >
                        <X size={24} />
                    </button>
                </div>
                <div className="modal-form-body" style={{ maxHeight: "75vh", overflowY: "auto", padding: "1.5rem" }}>
                    {submission.questions.map((q, idx) => (
                        <div key={idx} style={{ marginBottom: "2rem" }}>
                            <div className="flex justify-between items-center mb-2">
                                <h3 style={{ fontSize: "1rem", color: "var(--primary-color)" }}>Question {idx + 1}</h3>
                                <span className="badge">{q.score} / {q.maxScore} pts</span>
                            </div>
                            <p style={{ marginBottom: "1rem", fontWeight: 500 }}>{q.questionText}</p>
                            <CodeHighlighter code={q.code || "// No code submitted"} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ViewCodeModal;
