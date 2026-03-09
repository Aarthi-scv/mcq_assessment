import React from "react";
import {
    Layers, Plus, Search, Filter, Code2, Eye, Trash2, Square, Play, Clock
} from "lucide-react";
import MultiSelect from "../MultiSelect";
import toast from "react-hot-toast";

const AssessmentsTab = ({
    navigate,
    loading,
    searchQuery,
    setSearchQuery,
    filterCourse,
    setFilterCourse,
    filteredModules,
    getModuleQuestions,
    setViewModule,
    deleteModule,
    codingModLoading,
    codingModules,
    updateCodingModule,
    deleteCodingModule,
    batches
}) => {
    return (
        <div className="animate-slide-up">
            <div className="flex justify-between items-center mb-6">
                <h2 className="flex items-center gap-2 text-xl font-bold">
                    <Layers size={22} className="text-primary" /> System Modules
                </h2>
                <div className="flex gap-3">
                    <button
                        className="btn btn-secondary"
                        onClick={() => navigate("/admin/combine-assessment")}
                        style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}
                    >
                        <Layers size={18} /> Combine Assessment
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate("/admin/create-module")}
                        style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}
                    >
                        <Plus size={18} /> Add Module
                    </button>
                </div>
            </div>

            {/* Top Bar / Filters */}
            <div className="card flex gap-4 items-center mb-2 top-bar-filters">
                <div className="flex items-center flex-1 gap-3 px-1 py-1 bg-black/20 rounded-xl border border-white/5">
                    <Search size={18} className="text-secondary" />
                    <input
                        type="text"
                        id="module-search"
                        placeholder="Search electronics modules..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search modules"
                        className="search-input-wrapper"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-secondary" />
                    <select
                        value={filterCourse}
                        onChange={(e) => setFilterCourse(e.target.value)}
                        className="course-filter-select"
                    >
                        <option value="All">Course Type</option>
                        <option value="ASIC-DV">ASIC-DV</option>
                        <option value="Embedded">Embedded Systems</option>
                        <option value="VLSI">VLSI Design</option>
                    </select>
                </div>
            </div>

            {/* ===== TOPIC DESIGNATION CARDS ===== */}
            <div className="mb-12">
                <h2 className="mb-6">
                    <Layers size={24} className="text-primary" /> Assessment Modules
                </h2>
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
                    {loading ? (
                        <div className="card" style={{ gridColumn: "1 / -1" }}>
                            <div className="admin-loader-wrap">
                                <div className="admin-loader-ring" />
                                <div className="admin-loader-dots">
                                    <span /><span /><span />
                                </div>
                                <div className="admin-loader-label">Loading Modules</div>
                            </div>
                        </div>
                    ) : (
                        filteredModules.map((module) => {
                            const questions = getModuleQuestions(module);
                            return (
                                <div key={module._id} className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="module-title" style={{ marginBottom: "0.5rem" }}>{module.topicName}</h3>
                                            <div className="flex gap-2 items-center" style={{ flexWrap: "wrap" }}>
                                                <span className="badge badge-primary">{module.courseType}</span>
                                                <span className="badge">{module.difficultyLevel}</span>
                                                <span className="badge" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderColor: "rgba(16, 185, 129, 0.2)" }}>
                                                    {questions.length} Qs
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2" style={{ marginTop: "auto" }}>
                                        <button
                                            className="btn btn-secondary text-xs"
                                            style={{ flex: 1, padding: "0.5rem" }}
                                            onClick={() => setViewModule(module)}
                                        >
                                            <Eye size={14} /> View
                                        </button>
                                        <button
                                            className="btn text-xs"
                                            style={{ flex: 1, padding: "0.5rem", background: "rgba(255, 77, 77, 0.1)", color: "#ff4d4d", border: "1px solid rgba(255, 77, 77, 0.2)" }}
                                            onClick={() => deleteModule(module._id, module.topicName)}
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    {!loading && filteredModules.length === 0 && (
                        <div className="card text-center py-12 text-secondary" style={{ gridColumn: "1 / -1" }}>
                            <PlusCircle size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No modules found. Click + to create one.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ===== CODING ASSESSMENT MODULES ===== */}
            <div className="mb-12">
                <div className="flex justify-between items-center mb-6" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
                    <h2 style={{ margin: 0 }}>
                        <Code2 size={24} className="text-primary" /> Coding Assessment Modules
                    </h2>
                    <button
                        className="btn btn-primary"
                        style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}
                        onClick={() => navigate("/admin/create-coding-module")}
                    >
                        <Plus size={15} /> New Coding Module
                    </button>
                </div>
                <div className="flex flex-col gap-4">
                    {codingModLoading ? (
                        <div className="card">
                            <div className="admin-loader-wrap">
                                <div className="admin-loader-ring" />
                                <div className="admin-loader-dots"><span /><span /><span /></div>
                                <div className="admin-loader-label">Loading Coding Modules</div>
                            </div>
                        </div>
                    ) : codingModules.length === 0 ? (
                        <div className="card text-center py-12 text-secondary">
                            <Code2 size={48} className="mx-auto mb-4 opacity-20" style={{ display: "block", margin: "0 auto 1rem" }} />
                            <p>No coding modules yet. Click <strong>+ New Coding Module</strong> to create one.</p>
                        </div>
                    ) : (
                        codingModules.map((cm) => (
                            <div key={cm._id} className="card flex justify-between items-center gap-6" style={{ flexWrap: "wrap" }}>
                                <div style={{ flex: 1 }}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Code2 size={16} className="text-primary" />
                                        <h3 className="module-title">{cm.title}</h3>
                                    </div>
                                    <div className="flex gap-2 items-center" style={{ flexWrap: "wrap" }}>
                                        <span className="badge badge-primary">{cm.questions.length} Q{cm.questions.length !== 1 ? "s" : ""}</span>
                                        <span className="badge">{cm.timer} min</span>
                                        {cm.assignedBatch.map(b => (
                                            <span key={b} className="badge batch-badge">{b}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center" style={{ flexWrap: "wrap" }}>
                                    <input
                                        type="number" min={5} max={180}
                                        className="input timer-input"
                                        defaultValue={cm.timer}
                                        onBlur={e => {
                                            const v = parseInt(e.target.value);
                                            if (v && v !== cm.timer) updateCodingModule(cm._id, { timer: v });
                                        }}
                                    />
                                    <div className="batch-selector-wrapper">
                                        <MultiSelect
                                            options={batches.map(b => b.name)}
                                            selected={cm.assignedBatch}
                                            onChange={val => updateCodingModule(cm._id, { assignedBatch: val })}
                                            placeholder="Assign Batch"
                                        />
                                    </div>
                                    <div className="status-toggle-wrapper flex">
                                        <button
                                            className={`btn status-btn ${cm.status === "active" ? "btn-danger" : "btn-primary"}`}
                                            onClick={() => updateCodingModule(cm._id, { status: cm.status === "active" ? "inactive" : "active" })}
                                        >
                                            {cm.status === "active" ? <><Square size={14} /> Stop</> : <><Play size={14} /> Activate</>}
                                        </button>
                                    </div>
                                    <button
                                        className="btn"
                                        style={{ background: "rgba(255,77,77,0.1)", color: "#ff4d4d", border: "1px solid rgba(255,77,77,0.2)", padding: "0.3rem 0.5rem" }}
                                        onClick={() => deleteCodingModule(cm._id, cm.title)}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssessmentsTab;
