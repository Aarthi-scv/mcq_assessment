import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Plus,
  PlusCircle,
  Search,
  Filter,
  Clock,
  ChevronDown,
  ChevronUp,
  Play,
  Square,
  Users,
  FileText,
  Cpu,
  Layers,
  X,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit3,
  Eye,
  Save,
  LogOut,
} from "lucide-react";
import "./AdminDashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const BATCH_OPTIONS = ["DV-B8", "DV-B9", "DV-B10", "DV-B11", "DV-B12", "ES-B2", "ES-B3"];

// Helper to get admin auth header
const getAdminHeaders = () => {
  const token = localStorage.getItem("adminToken");
  return { headers: { Authorization: `Bearer ${token}` } };
};

const MultiSelect = ({
  options,
  selected = [],
  onChange,
  placeholder = "Select Batch",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (option) => {
    const newSelected = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];
    onChange(newSelected);
  };

  const handleKeyDown = (e, option) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (option === "all") selectAll();
      else toggleOption(option);
    }
  };

  const selectAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange([...options]);
    }
  };

  return (
    <div
      className="multi-select-container"
      style={{ zIndex: isOpen ? 2100 : 1 }}
    >
      <div
        className="multi-select-btn"
        onClick={() => setIsOpen(!isOpen)}
        tabIndex="0"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") && setIsOpen(!isOpen)
        }
      >
        <span>
          {selected.length > 0 ? `${selected.length} Selected` : placeholder}
        </span>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      {isOpen && (
        <>
          <div
            className="multi-select-overlay"
            onClick={() => setIsOpen(false)}
          />
          <div className="multi-select-dropdown no-scrollbar" role="listbox">
            <div
              className="multi-select-option"
              onClick={selectAll}
              tabIndex="0"
              onKeyDown={(e) => handleKeyDown(e, "all")}
              role="option"
              aria-selected={selected.length === options.length}
            >
              <div
                className={`custom-checkbox ${selected.length === options.length && options.length > 0 ? "checked" : ""}`}
              >
                {selected.length === options.length && options.length > 0 && (
                  <CheckCircle2 size={14} />
                )}
              </div>
              <label>Select All</label>
            </div>
            <div className="multi-select-divider"></div>
            {options.map((opt) => (
              <div
                key={opt}
                className="multi-select-option"
                onClick={() => toggleOption(opt)}
                tabIndex="0"
                onKeyDown={(e) => handleKeyDown(e, opt)}
                role="option"
                aria-selected={selected.includes(opt)}
              >
                <div
                  className={`custom-checkbox ${selected.includes(opt) ? "checked" : ""}`}
                >
                  {selected.includes(opt) && <CheckCircle2 size={14} />}
                </div>
                <label>{opt}</label>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();

  // State
  const [modules, setModules] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCourse, setFilterCourse] = useState("All");

  // View/Edit Questions Modal State
  const [viewModule, setViewModule] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Add Question to existing module
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [newQForm, setNewQForm] = useState({
    qn: "", questionType: "plain", optionType: "multiple",
    optionA: "", optionB: "", optionC: "", optionD: "",
    correctAnswer: "A", explanation: ""
  });

  // Auth check on mount
  useEffect(() => {
    const isDev = window.location.hostname === "localhost";
    if (isDev) {
      // Skip auth in local development
      fetchModules();
      fetchSubmissions();
      return;
    }
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/control-center");
      return;
    }
    // Verify token
    axios.get(`${API_URL}/admin/verify`, getAdminHeaders())
      .then(() => {
        fetchModules();
        fetchSubmissions();
      })
      .catch(() => {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        toast.error("Session expired. Please login again.");
        navigate("/control-center");
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    toast.success("Logged out successfully");
    navigate("/control-center");
  };

  // Fetch Modules & Submissions
  const fetchModules = async () => {
    try {
      const res = await axios.get(`${API_URL}/modules`, getAdminHeaders());
      setModules(res.data);
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/control-center");
        return;
      }
      toast.error("Failed to load modules");
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const res = await axios.get(`${API_URL}/submissions`, getAdminHeaders());
      setSubmissions(res.data);
    } catch (err) {
      console.error("Failed to fetch submissions", err);
    }
  };

  // --- Question Form Handlers ---
  const addQuestion = () => {
    setFormQuestions([...formQuestions, {
      qn: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A", explanation: ""
    }]);
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
    setFormQuestions(updated);
  };

  // Create Module Handler — NEW: JSON-based
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newModule.topicName) {
      return toast.error("Topic name is required");
    }

    // Validate all questions
    for (let i = 0; i < formQuestions.length; i++) {
      const q = formQuestions[i];
      if (!q.qn || !q.optionA || !q.optionB || !q.optionC || !q.optionD) {
        return toast.error(`Please fill all fields for Question ${i + 1}`);
      }
    }

    try {
      await axios.post(`${API_URL}/modules/create`, {
        topicName: newModule.topicName,
        courseType: newModule.courseType,
        difficultyLevel: newModule.difficultyLevel,
        assignedBatch: newModule.assignedBatch,
        questions: formQuestions,
      }, getAdminHeaders());
      toast.success("Module Created Successfully");
      setIsModalOpen(false);
      setNewModule({
        topicName: "",
        courseType: "ASIC-DV",
        difficultyLevel: "Medium",
        assignedBatch: [],
      });
      setFormQuestions([{ qn: "", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A", explanation: "" }]);
      fetchModules();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error creating module");
    }
  };

  // Update Module Handler (Timer, Status, Batch)
  const updateModule = async (id, data) => {
    try {
      await axios.patch(`${API_URL}/modules/${id}`, data, getAdminHeaders());
      toast.success("Updated successfully");
      fetchModules();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  // Delete Module
  const deleteModule = async (id, topicName) => {
    if (!window.confirm(`Are you sure you want to delete "${topicName}"? This will also delete all associated submissions.`)) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/modules/${id}`, getAdminHeaders());
      toast.success("Module deleted successfully");
      fetchModules();
      if (viewModule && viewModule._id === id) {
        setViewModule(null);
      }
    } catch (err) {
      toast.error("Failed to delete module");
    }
  };

  // --- Question CRUD ---
  const startEditQuestion = (question) => {
    setEditingQuestion(question._id);
    setEditForm({
      qn: question.qn || question.questionText,
      optionA: question.options?.[0] || question.options?.A || "",
      optionB: question.options?.[1] || question.options?.B || "",
      optionC: question.options?.[2] || question.options?.C || "",
      optionD: question.options?.[3] || question.options?.D || "",
      correctAnswer: question.correctAnswer || ['A', 'B', 'C', 'D'][question.options?.indexOf?.(question.answer)] || "A",
      explanation: question.explanation || "",
    });
  };

  const saveEditQuestion = async (moduleId, questionId) => {
    try {
      await axios.put(
        `${API_URL}/modules/${moduleId}/questions/${questionId}`,
        editForm,
        getAdminHeaders()
      );
      toast.success("Question updated");
      setEditingQuestion(null);
      fetchModules();
      // Refresh the viewModule data
      const res = await axios.get(`${API_URL}/modules`, getAdminHeaders());
      const updated = res.data.find(m => m._id === moduleId);
      if (updated) setViewModule(updated);
    } catch (err) {
      toast.error("Failed to update question");
    }
  };

  const deleteQuestion = async (moduleId, questionId) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await axios.delete(
        `${API_URL}/modules/${moduleId}/questions/${questionId}`,
        getAdminHeaders()
      );
      toast.success("Question deleted");
      fetchModules();
      const res = await axios.get(`${API_URL}/modules`, getAdminHeaders());
      const updated = res.data.find(m => m._id === moduleId);
      if (updated) setViewModule(updated);
    } catch (err) {
      toast.error("Failed to delete question");
    }
  };

  const addQuestionToModule = async () => {
    if (!newQForm.qn) return toast.error("Question text is required");
    if (newQForm.optionType !== "truefalse") {
      if (!newQForm.optionA || !newQForm.optionB || !newQForm.optionC || !newQForm.optionD) {
        return toast.error("Please fill all 4 options");
      }
    }
    try {
      await axios.post(
        `${API_URL}/modules/${viewModule._id}/questions`,
        newQForm,
        getAdminHeaders()
      );
      toast.success("Question added!");
      setAddingQuestion(false);
      setNewQForm({ qn: "", questionType: "plain", optionType: "multiple", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "A", explanation: "" });
      fetchModules();
      const res = await axios.get(`${API_URL}/modules`, getAdminHeaders());
      const updated = res.data.find(m => m._id === viewModule._id);
      if (updated) setViewModule(updated);
    } catch (err) {
      toast.error("Failed to add question");
    }
  };

  // Get questions from module (handles both structures)
  const getModuleQuestions = (module) => {
    if (module.module?.quiz?.length > 0) {
      return module.module.quiz.map(q => ({
        _id: q._id,
        qn: q.qn,
        options: q.options,
        answer: q.answer,
        correctAnswer: ['A', 'B', 'C', 'D'][q.options.indexOf(q.answer)] || 'A',
        explanation: q.explanation,
      }));
    }
    if (module.questions?.length > 0) {
      return module.questions.map(q => ({
        _id: q._id,
        qn: q.questionText,
        options: [q.options?.A, q.options?.B, q.options?.C, q.options?.D],
        answer: q.correctValue,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      }));
    }
    return [];
  };

  // Filter Logic
  const filteredModules = React.useMemo(() => {
    return modules.filter((m) => {
      const matchesSearch = m.topicName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesFilter =
        filterCourse === "All" || m.courseType === filterCourse;
      return matchesSearch && matchesFilter;
    });
  }, [modules, searchQuery, filterCourse]);

  return (
    <>
      <div className="container fade-in">
        <header className="flex justify-between items-end mb-4 admin-header items-center">
          <div>
            <h1 className="text-lg">Admin Control Center</h1>
            <p className="text-secodary">
              Manage electronics assessments and track student performance
            </p>
          </div>
          <div className="flex gap-3">
            <button
              className="btn btn-primary add-module-btn"
              onClick={() => navigate("/admin/create-module")}
              title="Add New Module"
              aria-label="Add New Assessment Module"
            >
              <Plus size={28} aria-hidden="true" />
              Add Module
            </button>
            <button
              className="btn btn-secondary logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

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
              <div className="card flex justify-center py-12">
                <div className="animate-pulse text-secondary">
                  Loading modules...
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
                <AlertCircle size={48} className="mx-auto mb-4 opacity-20 alert-circle-icon" />
                <p>No modules found. Click + to create one.</p>
              </div>
            )}
          </div>
        </div>

        {/* ===== ACTIVE TRAINING MODULES ===== */}
        <div className="mb-12">
          <h2 className="mb-6">
            <Cpu size={24} className="text-primary" /> Active Training Modules
          </h2>
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="card flex justify-center py-12">
                <div className="animate-pulse text-secondary">
                  Initializing Core Systems...
                </div>
              </div>
            ) : (
              filteredModules.map((module) => (
                <div
                  key={module._id}
                  className="card flex justify-between items-center gap-6"
                >
                  <div className="module-card-content">
                    <div className="flex items-center gap-3 mb-2">
                      <Layers size={18} className="text-primary" />
                      <h3 className="module-title">{module.topicName}</h3>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="badge badge-primary">
                        {module.courseType}
                      </span>
                      <span className="badge">{module.difficultyLevel}</span>
                      {module.assignedBatch?.map((batch) => (
                        <span key={batch} className="badge batch-badge">
                          {batch}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-6 items-center">
                    {/* Batch Selector */}
                    <div className="batch-selector-wrapper">
                      <MultiSelect
                        options={BATCH_OPTIONS}
                        selected={module.assignedBatch || []}
                        onChange={(values) =>
                          updateModule(module._id, { assignedBatch: values })
                        }
                        placeholder="Assign Batches"
                      />
                    </div>

                    {/* Timer Control */}
                    <div className="flex items-center gap-3 bg-black/30 p-2 rounded-lg border border-white/5">
                      <Clock size={16} className="text-secondary" />
                      <input
                        type="number"
                        min="1"
                        defaultValue={module.timer}
                        onKeyDown={(e) => {
                          if (e.key === "-" || e.key === "e" || e.key === "E") {
                            e.preventDefault();
                          }
                        }}
                        onBlur={(e) => {
                          const val = parseInt(e.target.value);
                          if (isNaN(val) || val <= 0) {
                            toast.error("Timer must be at least 1 minute");
                            e.target.value = 1;
                            updateModule(module._id, { timer: 1 });
                          } else {
                            updateModule(module._id, { timer: val });
                          }
                        }}
                        className="timer-input"
                      />
                      <span className="text-xs font-bold text-secondary">
                        MINS
                      </span>
                    </div>

                    {/* Status Toggle & Timer Display */}
                    <div className="flex items-center status-toggle-wrapper">
                      {module.status === "active" ? (
                        <button
                          className="btn btn-danger status-btn"
                          onClick={() =>
                            updateModule(module._id, { status: "inactive" })
                          }
                        >
                          <Square size={16} fill="currentColor" /> Stop Timer
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary status-btn text-sm"
                          onClick={() =>
                            updateModule(module._id, { status: "active" })
                          }
                        >
                          <Play size={16} fill="currentColor" /> Start Timer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ===== PERFORMANCE ANALYTICS ===== */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="analytics-header-title">
              <Users size={24} className="text-primary" /> Performance Analytics
            </h2>
            <button
              className="btn btn-secondary btn-sm refresh-data-btn"
              onClick={fetchSubmissions}
            >
              <Users size={16} /> Refresh Data
            </button>
          </div>
          <div className="card table-container" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Candidate Name</th>
                  <th scope="col">Batch</th>
                  <th scope="col" style={{ width: "220px" }}>
                    Score Analytics
                  </th>
                  <th scope="col">Completion Date</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, index) => (
                  <tr key={sub._id}>
                    <td className="text-secondary">#{index + 1}</td>
                    <td style={{ fontWeight: 600 }}>{sub.userName}</td>
                    <td className="text-sm">{sub.batch}</td>
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
                          <span className="text-secondary">
                            Correct Answer:
                          </span>
                          <span className="text-secondary font-bold">
                            {sub.correct || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-secondary">
                            Negative Answer:
                          </span>
                          <span className="text-danger font-bold">
                            {sub.wrong || 0}
                          </span>
                        </div>
                        <div className="flex justify-between mt-1 pt-1 score-divider">
                          <span className="text-primary font-bold uppercase">
                            Total Marks:
                          </span>
                          <span className="text-primary font-bold">
                            {sub.score} / {sub.totalQuestions}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="text-secondary">
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {submissions.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center py-12 text-secondary"
                    >
                      No submission data available in the current cycle.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===== VIEW/EDIT QUESTIONS MODAL ===== */}
      {viewModule && (
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
                        <input
                          placeholder="Option A"
                          value={editForm.optionA}
                          onChange={(e) => setEditForm({ ...editForm, optionA: e.target.value })}
                          style={{ marginBottom: "0.5rem" }}
                        />
                        <input
                          placeholder="Option B"
                          value={editForm.optionB}
                          onChange={(e) => setEditForm({ ...editForm, optionB: e.target.value })}
                          style={{ marginBottom: "0.5rem" }}
                        />
                        <input
                          placeholder="Option C"
                          value={editForm.optionC}
                          onChange={(e) => setEditForm({ ...editForm, optionC: e.target.value })}
                          style={{ marginBottom: "0.5rem" }}
                        />
                        <input
                          placeholder="Option D"
                          value={editForm.optionD}
                          onChange={(e) => setEditForm({ ...editForm, optionD: e.target.value })}
                          style={{ marginBottom: "0.5rem" }}
                        />
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
                      {q.questionType === "code" ? (
                        <pre style={{
                          fontFamily: "'Courier New', monospace", fontSize: "0.82rem",
                          background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)",
                          borderRadius: "8px", padding: "0.75rem", marginBottom: "0.75rem",
                          whiteSpace: "pre-wrap", wordBreak: "break-word", color: "var(--text-primary)",
                        }}>{q.qn}</pre>
                      ) : (
                        <p style={{ fontWeight: 600, marginBottom: "0.75rem" }}>{q.qn}</p>
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
                  <button
                    className="btn btn-primary"
                    style={{ width: "100%", padding: "0.55rem" }}
                    onClick={() => setAddingQuestion(true)}
                  >
                    <PlusCircle size={16} /> Add Question
                  </button>
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
                    {newQForm.optionType !== "truefalse" && (
                      <div className="flex gap-3" style={{ marginBottom: "0.75rem" }}>
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
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: "0.75rem" }}>Explanation (optional)</label>
                          <input value={newQForm.explanation}
                            onChange={(e) => setNewQForm({ ...newQForm, explanation: e.target.value })}
                            placeholder="Why is this correct?" />
                        </div>
                      </div>
                    )}
                    {newQForm.optionType === "truefalse" && (
                      <div style={{ marginBottom: "0.75rem" }}>
                        <label style={{ fontSize: "0.75rem" }}>Explanation (optional)</label>
                        <input value={newQForm.explanation}
                          onChange={(e) => setNewQForm({ ...newQForm, explanation: e.target.value })}
                          placeholder="Why is this correct?" />
                      </div>
                    )}

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
      )}
    </>
  );
};

export default AdminDashboard;
