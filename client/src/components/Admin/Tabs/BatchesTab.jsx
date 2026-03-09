import React from "react";
import { PlusCircle, Plus, Users, Trash2 } from "lucide-react";

const BatchesTab = ({
    newBatchName,
    setNewBatchName,
    createBatch,
    batches,
    deleteBatch
}) => {
    return (
        <div className="animate-slide-up">
            {/* ===== BATCH MANAGEMENT ===== */}
            <div className="mb-12">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="flex items-center gap-2 text-xl font-bold">
                        <PlusCircle size={22} className="text-primary" /> Batch Management
                    </h2>
                </div>

                <div className="card mb-6 p-6">
                    <h3 className="mb-4 text-lg font-semibold text-white">Create New Batch</h3>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Enter batch name (e.g. DV-B13)"
                            value={newBatchName}
                            onChange={(e) => setNewBatchName(e.target.value)}
                            className="flex-1"
                            style={{
                                margin: 0,
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                color: "white",
                                padding: "0.75rem",
                                borderRadius: "10px"
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && createBatch()}
                        />
                        <button className="btn btn-primary" onClick={createBatch} style={{ padding: "0 1.5rem" }}>
                            <Plus size={18} /> Add Batch
                        </button>
                    </div>
                </div>

                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
                    {batches.length === 0 ? (
                        <div className="card text-center py-12 text-secondary" style={{ gridColumn: "1 / -1" }}>
                            <Users size={48} className="mx-auto mb-4 opacity-10" />
                            <p>No batches created yet. Use the form above to add your first batch.</p>
                        </div>
                    ) : (
                        batches.map((batch) => (
                            <div key={batch._id} className="card p-5 flex justify-between items-center group hover:border-primary/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <span className="font-bold text-lg text-white block">{batch.name}</span>
                                        <div className="text-xs text-secondary mt-1 flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${batch.active ? 'bg-success' : 'bg-secondary'}`} />
                                            Created {new Date(batch.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "0.5rem", borderRadius: "8px" }}
                                    onClick={() => deleteBatch(batch._id, batch.name)}
                                    title="Delete Batch"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default BatchesTab;
