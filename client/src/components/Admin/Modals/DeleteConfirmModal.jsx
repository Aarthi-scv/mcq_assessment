import React from "react";
import { AlertCircle } from "lucide-react";

const DeleteConfirmModal = ({
    deleteConfirm,
    setDeleteConfirm,
    confirmDeleteModule,
    confirmDeleteCodingModule
}) => {
    if (!deleteConfirm.show) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content fade-in" style={{ maxWidth: "400px", textAlign: "center", padding: "2rem" }}>
                <div className="mb-4" style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", width: "60px", height: "60px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                    <AlertCircle size={32} style={{ display: "block", margin: "auto" }} />
                </div>
                <h2 className="mb-2">Confirm Delete</h2>
                <p className="text-secondary mb-6" style={{ fontSize: "0.9rem" }}>
                    Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>?
                    This will also permanently delete all associated participant submissions.
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
                        style={{ background: "#ef4444", color: "white" }}
                        onClick={() => deleteConfirm.type === "mcq" ? confirmDeleteModule() : confirmDeleteCodingModule()}
                    >
                        Yes, Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;
