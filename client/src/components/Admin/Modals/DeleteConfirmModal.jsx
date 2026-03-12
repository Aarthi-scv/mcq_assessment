import React from "react";
import { AlertCircle } from "lucide-react";

const DeleteConfirmModal = ({
    deleteConfirm,
    setDeleteConfirm,
    confirmDeleteModule,
    confirmDeleteCodingModule,
    confirmResetSubmission,
    confirmResetCodingSubmission,
    confirmDeleteBatch,
    confirmDeleteQuestion
}) => {
    if (!deleteConfirm.show) return null;

    const isReset = deleteConfirm.type?.startsWith("reset");
    const title = isReset ? "Confirm Reset" : "Confirm Delete";
    const iconColor = isReset ? "#00b4c8" : "#ef4444";
    const iconBg = isReset ? "rgba(0, 180, 200, 0.1)" : "rgba(239, 68, 68, 0.1)";
    const buttonBg = isReset ? "#00b4c8" : "#ef4444";
    const buttonText = isReset ? "Yes, Reset" : "Yes, Delete";

    const getMessage = () => {
        if (deleteConfirm.type === "reset-mcq") {
            return (
                <>
                    Are you sure you want to reset the assessment for <strong>"{deleteConfirm.title}"</strong>?
                    This will delete their current score and allow them to retake the exam.
                </>
            );
        }
        if (deleteConfirm.type === "reset-coding") {
            return (
                <>
                    Are you sure you want to reset the coding assessment for <strong>"{deleteConfirm.title}"</strong>?
                    This will delete their code and score.
                </>
            );
        }
        if (deleteConfirm.type === "batch") {
            return (
                <>
                    Are you sure you want to delete batch <strong>"{deleteConfirm.title}"</strong>?
                </>
            );
        }
        if (deleteConfirm.type === "question") {
            return (
                <>
                    Are you sure you want to delete this question?
                </>
            );
        }
        return (
            <>
                Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>?
                This will also permanently delete all associated participant submissions.
            </>
        );
    };

    const handleConfirm = () => {
        switch (deleteConfirm.type) {
            case "mcq": confirmDeleteModule(); break;
            case "coding": confirmDeleteCodingModule(); break;
            case "reset-mcq": confirmResetSubmission(); break;
            case "reset-coding": confirmResetCodingSubmission(); break;
            case "batch": confirmDeleteBatch(); break;
            case "question": confirmDeleteQuestion(); break;
            default: setDeleteConfirm({ show: false, id: null, title: "", type: "mcq" });
        }
    };


    return (
        <div className="modal-overlay">
            <div className="modal-content fade-in" style={{ maxWidth: "450px", textAlign: "center", padding: "2rem" }}>
                <div className="mb-4" style={{ color: iconColor, background: iconBg, width: "60px", height: "60px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                    <AlertCircle size={32} style={{ display: "block", margin: "auto" }} />
                </div>
                <h2 className="mb-2">{title}</h2>
                <p className="text-secondary mb-6" style={{ fontSize: "0.9rem", lineHeight: "1.5" }}>
                    {getMessage()}
                </p>
                <div className="flex gap-3">
                    <button
                        className="btn btn-secondary w-full"
                        onClick={() => setDeleteConfirm({ show: false, id: null, title: "", type: "mcq" })}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn w-full"
                        style={{ background: buttonBg, color: "white", border: "none" }}
                        onClick={handleConfirm}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;

