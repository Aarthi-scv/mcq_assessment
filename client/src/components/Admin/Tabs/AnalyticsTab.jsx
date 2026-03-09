import React from "react";
import {
    Users, RefreshCw, FileDown, ChevronUp, ChevronDown,
    FileSpreadsheet, FileText, Filter, X, AlertCircle, Code2
} from "lucide-react";

const AnalyticsTab = ({
    fetchSubmissions,
    mcqExportOpen,
    setMcqExportOpen,
    exportPDF,
    exportExcel,
    exportDocs,
    analyticsFilterBatch,
    setAnalyticsFilterBatch,
    batches,
    analyticsFilterTopic,
    setAnalyticsFilterTopic,
    topicOptions,
    filteredSubmissions,
    modules,
    deleteSubmission,
    codingExportOpen,
    setCodingExportOpen,
    exportCodingPDF,
    exportCodingExcel,
    exportCodingDocs,
    codingAnalyticsBatch,
    setCodingAnalyticsBatch,
    codingModules,
    filteredCodingAnalytics,
    setViewCodeModal,
    deleteCodingSubmission
}) => {
    return (
        <div className="animate-slide-up">
            {/* ===== PERFORMANCE ANALYTICS ===== */}
            <div className="mb-12">
                {/* Header Row */}
                <div className="flex justify-between items-center mb-4" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
                    <h2 className="analytics-header-title">
                        <Users size={24} className="text-primary" /> Performance Analytics
                    </h2>
                    <div className="flex gap-2 relative" style={{ flexWrap: "wrap" }}>
                        <button
                            className="btn btn-secondary btn-sm refresh-data-btn"
                            onClick={fetchSubmissions}
                            title="Refresh data"
                        >
                            <RefreshCw size={14} /> Refresh
                        </button>
                        <div className="relative">
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setMcqExportOpen(!mcqExportOpen)}
                                style={{ display: "flex", alignItems: "center", gap: "6px" }}
                            >
                                <FileDown size={14} /> Export Report {mcqExportOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            {mcqExportOpen && (
                                <>
                                    <div className="fixed inset-0" onClick={() => setMcqExportOpen(false)} style={{ zIndex: 10 }} />
                                    <div className="absolute right-0 mt-2 w-40 rounded-xl border border-white/10 bg-black shadow-xl" style={{ zIndex: 11, background: "#111" }}>
                                        <div className="p-1">
                                            <button onClick={() => { exportPDF(); setMcqExportOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-secondary hover:bg-white/5 hover:text-white">
                                                <FileDown size={14} className="text-danger" /> PDF Document
                                            </button>
                                            <button onClick={() => { exportExcel(); setMcqExportOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-secondary hover:bg-white/5 hover:text-white">
                                                <FileSpreadsheet size={14} className="text-success" /> Excel Sheet
                                            </button>
                                            <button onClick={() => { exportDocs(); setMcqExportOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-secondary hover:bg-white/5 hover:text-white">
                                                <FileText size={14} className="text-primary" /> Word Document
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Filter Bar ── */}
                <div
                    className="card flex gap-4 items-center mb-4"
                    style={{ padding: "0.85rem 1.25rem", flexWrap: "wrap", gap: "1rem" }}
                >
                    <Filter size={16} className="text-secondary" style={{ flexShrink: 0 }} />

                    {/* Batch Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-secondary" style={{ whiteSpace: "nowrap" }}>
                            Batch
                        </label>
                        <select
                            value={analyticsFilterBatch}
                            onChange={(e) => setAnalyticsFilterBatch(e.target.value)}
                            className="course-filter-select"
                        >
                            <option value="">— Select Batch —</option>
                            {batches.map((b) => (
                                <option key={b._id} value={b.name}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Topic / Designation Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-secondary" style={{ whiteSpace: "nowrap" }}>
                            Topic Designation
                        </label>
                        <select
                            value={analyticsFilterTopic}
                            onChange={(e) => setAnalyticsFilterTopic(e.target.value)}
                            className="course-filter-select"
                        >
                            <option value="">— Select Topic —</option>
                            {topicOptions.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    {/* Clear Filters */}
                    {(analyticsFilterBatch || analyticsFilterTopic) && (
                        <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem" }}
                            onClick={() => { setAnalyticsFilterBatch(""); setAnalyticsFilterTopic(""); }}
                        >
                            <X size={12} /> Clear
                        </button>
                    )}

                    {/* Live result count */}
                    {(analyticsFilterBatch || analyticsFilterTopic) && (
                        <span className="text-xs text-secondary" style={{ marginLeft: "auto" }}>
                            {filteredSubmissions.length} result{filteredSubmissions.length !== 1 ? "s" : ""} found
                        </span>
                    )}
                </div>

                {/* ── Table ── */}
                <div className="card table-container" style={{ padding: 0 }}>
                    <table>
                        <thead>
                            <tr>
                                <th scope="col">ID</th>
                                <th scope="col">Candidate Name</th>
                                <th scope="col">Batch</th>
                                <th scope="col">Topic</th>
                                <th scope="col" style={{ width: "220px" }}>Score Analytics</th>
                                <th scope="col">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Prompt to apply filter when nothing selected */}
                            {!analyticsFilterBatch && !analyticsFilterTopic && (
                                <tr>
                                    <td colSpan="6" className="text-center py-12 text-secondary">
                                        <Filter size={32} className="mx-auto mb-3 opacity-20" />
                                        <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                                            Select a Batch or Topic Designation to view results
                                        </p>
                                        <p className="text-xs" style={{ opacity: 0.6 }}>
                                            Use the filters above, then export using PDF, Sheets, or Docs.
                                        </p>
                                    </td>
                                </tr>
                            )}

                            {/* No results after filter */}
                            {(analyticsFilterBatch || analyticsFilterTopic) && filteredSubmissions.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center py-12 text-secondary">
                                        <AlertCircle size={32} className="mx-auto mb-3 opacity-20" />
                                        No submissions found for the selected filter.
                                    </td>
                                </tr>
                            )}

                            {/* Filtered results */}
                            {filteredSubmissions.map((sub, index) => (
                                <tr key={sub._id}>
                                    <td className="text-secondary">#{index + 1}</td>
                                    <td style={{ fontWeight: 600 }}>{sub.userName}</td>
                                    <td className="text-sm">{sub.batch}</td>
                                    <td className="text-sm">
                                        {modules.find((m) => m._id === sub.moduleId)?.topicName || "—"}
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1 score-analytics-wrapper">
                                            <div className="flex justify-between">
                                                <span className="text-secondary">Answered:</span>
                                                <span className="text-primary font-bold">
                                                    {(sub.correct || 0) + (sub.wrong || 0)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-secondary">Unanswered:</span>
                                                <span>{sub.unattended || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-secondary">Correct:</span>
                                                <span className="text-secondary font-bold">{sub.correct || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-secondary">Negative:</span>
                                                <span className="text-danger font-bold">{sub.wrong || 0}</span>
                                            </div>
                                            <div className="flex justify-between mt-1 pt-1 score-divider">
                                                <span className="text-primary font-bold uppercase">Total Marks:</span>
                                                <span className="text-primary font-bold">
                                                    {sub.score} / {sub.totalQuestions}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-secondary">
                                        <div className="flex flex-col gap-2 items-start">
                                            <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                                            {sub.retakeRequested && (
                                                <span className="badge" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)", fontSize: "10px" }}>
                                                    Retake Requested
                                                </span>
                                            )}
                                            <button
                                                className="btn btn-secondary text-xs"
                                                style={{ padding: "0.4rem", width: "100%" }}
                                                onClick={() => deleteSubmission(sub._id, sub.userName)}
                                            >
                                                {sub.retakeRequested ? "Approve Retake" : "Reset Attempt"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ===== CODING SUBMISSIONS ANALYTICS ===== */}
            <div className="container" style={{ padding: 0 }}>
                <div className="section-header mb-6">
                    <div className="flex justify-between items-center" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
                        <div>
                            <h2 style={{ fontSize: "1.5rem" }}><Code2 size={24} className="text-primary" /> Coding Assessment Analytics</h2>
                            <p className="text-secondary text-sm mt-1">C programming submission results per candidate</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setCodingExportOpen(!codingExportOpen)}
                                    style={{ display: "flex", alignItems: "center", gap: "6px" }}
                                >
                                    <FileDown size={14} /> Export Report {codingExportOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                                {codingExportOpen && (
                                    <>
                                        <div className="fixed inset-0" onClick={() => setCodingExportOpen(false)} style={{ zIndex: 10 }} />
                                        <div className="absolute right-0 mt-2 w-40 rounded-xl border border-white/10 bg-black shadow-xl" style={{ zIndex: 11, background: "#111" }}>
                                            <div className="p-1">
                                                <button onClick={() => { exportCodingPDF(); setCodingExportOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-secondary hover:bg-white/5 hover:text-white">
                                                    <FileDown size={14} className="text-danger" /> PDF Document
                                                </button>
                                                <button onClick={() => { exportCodingExcel(); setCodingExportOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-secondary hover:bg-white/5 hover:text-white">
                                                    <FileSpreadsheet size={14} className="text-success" /> Excel Sheet
                                                </button>
                                                <button onClick={() => { exportCodingDocs(); setCodingExportOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-secondary hover:bg-white/5 hover:text-white">
                                                    <FileText size={14} className="text-primary" /> Word Document
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <select
                                value={codingAnalyticsBatch}
                                onChange={e => setCodingAnalyticsBatch(e.target.value)}
                                className="course-filter-select"
                            >
                                <option value="">— All Batches —</option>
                                {[...new Set(codingModules.flatMap(m => m.assignedBatch || []))].sort().map(b => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                            {codingAnalyticsBatch && (
                                <button className="btn btn-secondary" style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem" }} onClick={() => setCodingAnalyticsBatch("")}>
                                    <X size={12} /> Clear
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="card table-container" style={{ padding: 0 }}>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Candidate</th>
                                <th>Batch</th>
                                <th>Module</th>
                                <th>Score</th>
                                <th>Questions</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCodingAnalytics.length === 0 ? (
                                <tr><td colSpan="7" className="text-center py-10 text-secondary">No coding submissions yet.</td></tr>
                            ) : (
                                filteredCodingAnalytics.map((s, i) => {
                                    const mod = codingModules.find(m => m._id === s.moduleId?.toString() || m._id === s.moduleId);
                                    return (
                                        <tr key={s._id}>
                                            <td className="text-secondary">#{i + 1}</td>
                                            <td style={{ fontWeight: 600 }}>{s.userName}</td>
                                            <td className="text-sm">{s.batch}</td>
                                            <td className="text-sm">{mod?.title || s.moduleId || "—"}</td>
                                            <td>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                                    <div className="flex justify-between gap-3">
                                                        <span className="text-secondary">Total:</span>
                                                        <span className="text-primary font-bold">{s.totalScore ?? s.score ?? 0} / {s.maxScore ?? (s.questions?.length * 3) ?? 0}</span>
                                                    </div>
                                                    {s.questions?.map((q, qi) => (
                                                        <div key={qi} className="flex justify-between gap-3 text-xs">
                                                            <span className="text-secondary">Q{qi + 1}:</span>
                                                            <span>{q.score ?? 0}/{q.maxScore ?? 3} pts</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="text-sm">
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: "4px" }}
                                                    onClick={() => setViewCodeModal({ show: true, submission: s })}
                                                >
                                                    <Code2 size={12} /> View Code
                                                </button>
                                            </td>
                                            <td className="text-secondary">
                                                <div className="flex flex-col gap-2 items-start">
                                                    <span>{new Date(s.submittedAt).toLocaleDateString()}</span>
                                                    {s.retakeRequested && (
                                                        <span className="badge" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)", fontSize: "10px" }}>
                                                            Retake Requested
                                                        </span>
                                                    )}
                                                    <button
                                                        className="btn btn-secondary text-xs"
                                                        style={{ padding: "0.4rem", width: "100%" }}
                                                        onClick={() => deleteCodingSubmission(s._id, s.userName)}
                                                    >
                                                        {s.retakeRequested ? "Approve Retake" : "Reset Attempt"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsTab;
