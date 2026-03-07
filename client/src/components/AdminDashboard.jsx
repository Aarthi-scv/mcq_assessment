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
  Code2,
  X,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit3,
  Eye,
  Save,
  LogOut,
  FileSpreadsheet,
  FileDown,
  RefreshCw,
  FileUp,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import CodeHighlighter from "./Assessment/CodeHighlighter";
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
  const [codingModules, setCodingModules] = useState([]);
  const [codingModLoading, setCodingModLoading] = useState(false);

  // Analytics Filters
  const [analyticsFilterBatch, setAnalyticsFilterBatch] = useState("");   // "" = not selected
  const [analyticsFilterTopic, setAnalyticsFilterTopic] = useState("");   // "" = not selected

  // Coding Analytics
  const [codingAnalytics, setCodingAnalytics] = useState([]);
  const [codingAnalyticsBatch, setCodingAnalyticsBatch] = useState("");

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

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, title: "", type: "mcq" });

  // View Candidate Code Modal
  const [viewCodeModal, setViewCodeModal] = useState({ show: false, submission: null });

  // Export Menu State
  const [mcqExportOpen, setMcqExportOpen] = useState(false);
  const [codingExportOpen, setCodingExportOpen] = useState(false);

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
        fetchCodingModules();
        fetchCodingAnalytics();
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

  // --- Analytics Filter Logic ---
  const filteredSubmissions = React.useMemo(() => {
    // If neither filter is selected, return empty (don't show all)
    if (!analyticsFilterBatch && !analyticsFilterTopic) return [];
    return submissions.filter((sub) => {
      const batchMatch = !analyticsFilterBatch || sub.batch === analyticsFilterBatch;
      // Match topic by moduleId mapped to module topicName
      const topicMatch = !analyticsFilterTopic ||
        modules.find((m) => m._id === sub.moduleId)?.topicName === analyticsFilterTopic;
      return batchMatch && topicMatch;
    });
  }, [submissions, analyticsFilterBatch, analyticsFilterTopic, modules]);

  const filteredCodingAnalytics = React.useMemo(() => {
    return codingAnalytics.filter(s => !codingAnalyticsBatch || s.batch === codingAnalyticsBatch);
  }, [codingAnalytics, codingAnalyticsBatch]);

  // Unique topic names derived from loaded modules (for the filter dropdown)
  const topicOptions = React.useMemo(
    () => [...new Set(modules.map((m) => m.topicName))].sort(),
    [modules]
  );

  // --- Export Helpers ---
  const exportLabel = () => {
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const parts = ["MCQ_Analytics"];
    if (analyticsFilterBatch) parts.push(analyticsFilterBatch);
    if (analyticsFilterTopic) parts.push(analyticsFilterTopic.replace(/\s+/g, "_"));
    parts.push(date);
    return parts.join("_");
  };

  const filterSubtitle = () => {
    const parts = [];
    if (analyticsFilterBatch) parts.push(`Batch: ${analyticsFilterBatch}`);
    if (analyticsFilterTopic) parts.push(`Topic: ${analyticsFilterTopic}`);
    return parts.length ? parts.join("  |  ") : "All Submissions";
  };

  const HEADERS = ["#", "Candidate Name", "Batch", "Topic", "Answered", "Unanswered", "Correct", "Negative", "Total Marks", "Date"];

  const getTableRows = () =>
    filteredSubmissions.map((sub, i) => [
      `#${i + 1}`,
      sub.userName,
      sub.batch,
      modules.find((m) => m._id === sub.moduleId)?.topicName || sub.moduleId || "—",
      (sub.correct || 0) + (sub.wrong || 0),
      sub.unattended || 0,
      sub.correct || 0,
      sub.wrong || 0,
      `${sub.score} / ${sub.totalQuestions}`,
      new Date(sub.submittedAt).toLocaleDateString(),
    ]);

  const exportPDF = () => {
    if (!filteredSubmissions.length) return toast.error("No filtered data to export. Apply a filter first.");
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Performance Analytics Report", 14, 15);
    doc.setFontSize(9);
    doc.text(`Filter: ${filterSubtitle()}`, 14, 22);
    doc.text(`Exported on ${new Date().toLocaleString()}`, 14, 27);
    autoTable(doc, {
      head: [HEADERS],
      body: getTableRows(),
      startY: 33,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [0, 180, 200], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 250, 255] },
    });
    doc.save(`${exportLabel()}.pdf`);
    toast.success("PDF exported!");
  };

  const exportExcel = () => {
    if (!filteredSubmissions.length) return toast.error("No filtered data to export. Apply a filter first.");
    const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...getTableRows()]);
    ws["!cols"] = HEADERS.map((_, i) => ({ wch: [4, 22, 10, 18, 10, 12, 10, 10, 14, 12][i] }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Analytics");
    XLSX.writeFile(wb, `${exportLabel()}.xlsx`);
    toast.success("Excel sheet exported!");
  };

  const exportDocs = () => {
    if (!filteredSubmissions.length) return toast.error("No filtered data to export. Apply a filter first.");
    const rows = getTableRows();
    const thStyle = `style="background:#00b4c8;color:#fff;padding:6px 10px;border:1px solid #ccc;text-align:left;"`;
    const tdStyle = `style="padding:5px 10px;border:1px solid #ddd;"`;
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>Performance Analytics</title></head>
      <body>
        <h2 style="font-family:Arial">Performance Analytics Report</h2>
        <p style="font-family:Arial;font-size:11px;color:#555">Filter: ${filterSubtitle()}</p>
        <p style="font-family:Arial;font-size:11px">Exported: ${new Date().toLocaleString()}</p>
        <table style="border-collapse:collapse;font-family:Arial;font-size:11px;width:100%">
          <thead><tr>${HEADERS.map(h => `<th ${thStyle}>${h}</th>`).join("")}</tr></thead>
          <tbody>${rows.map((row, ri) =>
      `<tr style="background:${ri % 2 === 0 ? "#f9f9f9" : "#fff"}"><${row.map(cell => `<td ${tdStyle}>${cell}</td>`).join("")}</tr>`
    ).join("")}</tbody>
        </table>
      </body></html>`;
    const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${exportLabel()}.doc`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Word document exported!");
  };

  // --- Coding Export Helpers ---
  const CODING_HEADERS = ["#", "Candidate Name", "Batch", "Module", "Total Score", "Max Score", "Date"];

  const getCodingTableRows = () =>
    filteredCodingAnalytics.map((s, i) => {
      const mod = codingModules.find(m => m._id === s.moduleId?.toString() || m._id === s.moduleId);
      return [
        `#${i + 1}`,
        s.userName,
        s.batch,
        mod?.title || s.moduleId || "—",
        s.totalScore ?? s.score ?? 0,
        s.maxScore ?? (s.questions?.length * 3) ?? 0,
        new Date(s.submittedAt).toLocaleDateString(),
      ];
    });

  const exportCodingPDF = () => {
    if (!filteredCodingAnalytics.length) return toast.error("No data to export.");
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Coding Assessment Analytics Report", 14, 15);
    doc.setFontSize(9);
    doc.text(`Batch: ${codingAnalyticsBatch || "All Batches"}`, 14, 22);
    doc.text(`Exported on ${new Date().toLocaleString()}`, 14, 27);
    autoTable(doc, {
      head: [CODING_HEADERS],
      body: getCodingTableRows(),
      startY: 33,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [0, 180, 200], textColor: 255, fontStyle: "bold" },
    });
    doc.save(`Coding_Analytics_${codingAnalyticsBatch || "All"}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success("Coding PDF exported!");
  };

  const exportCodingExcel = () => {
    if (!filteredCodingAnalytics.length) return toast.error("No data to export.");
    const ws = XLSX.utils.aoa_to_sheet([CODING_HEADERS, ...getCodingTableRows()]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Coding Analytics");
    XLSX.writeFile(wb, `Coding_Analytics_${codingAnalyticsBatch || "All"}_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Coding Excel sheet exported!");
  };

  const exportCodingDocs = () => {
    if (!filteredCodingAnalytics.length) return toast.error("No data to export.");
    const rows = getCodingTableRows();
    const thStyle = `style="background:#00b4c8;color:#fff;padding:6px 10px;border:1px solid #ccc;text-align:left;"`;
    const tdStyle = `style="padding:5px 10px;border:1px solid #ddd;"`;
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>Coding Analytics</title></head>
      <body>
        <h2 style="font-family:Arial">Coding Assessment Analytics Report</h2>
        <p style="font-family:Arial;font-size:11px;color:#555">Batch: ${codingAnalyticsBatch || "All Batches"}</p>
        <p style="font-family:Arial;font-size:11px">Exported: ${new Date().toLocaleString()}</p>
        <table style="border-collapse:collapse;font-family:Arial;font-size:11px;width:100%">
          <thead><tr>${CODING_HEADERS.map(h => `<th ${thStyle}>${h}</th>`).join("")}</tr></thead>
          <tbody>${rows.map((row, ri) =>
      `<tr style="background:${ri % 2 === 0 ? "#f9f9f9" : "#fff"}"><${row.map(cell => `<td ${tdStyle}>${cell}</td>`).join("")}</tr>`
    ).join("")}</tbody>
        </table>
      </body></html>`;
    const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Coding_Analytics_${codingAnalyticsBatch || "All"}_${new Date().toISOString().split('T')[0]}.doc`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Coding Word document exported!");
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

  const deleteSubmission = async (id, userName) => {
    if (!window.confirm(`Are you sure you want to reset the assessment for ${userName}? This will delete their current score and allow them to retake the exam.`)) return;
    try {
      await axios.delete(`${API_URL}/submissions/${id}`, getAdminHeaders());
      toast.success(`Assessment reset for ${userName}`);
      fetchSubmissions();
    } catch (err) {
      toast.error("Failed to reset assessment.");
    }
  };

  const deleteCodingSubmission = async (id, userName) => {
    if (!window.confirm(`Are you sure you want to reset the coding assessment for ${userName}? This will delete their code and score.`)) return;
    try {
      await axios.delete(`${API_URL}/coding-submissions/${id}`, getAdminHeaders());
      toast.success(`Coding assessment reset for ${userName}`);
      fetchCodingSubmissions();
    } catch (err) {
      toast.error("Failed to reset coding assessment.");
    }
  };

  const fetchCodingModules = async () => {
    setCodingModLoading(true);
    try {
      const res = await axios.get(`${API_URL}/coding-modules`, getAdminHeaders());
      setCodingModules(res.data);
    } catch (err) {
      console.error("Failed to fetch coding modules", err);
    } finally {
      setCodingModLoading(false);
    }
  };

  const updateCodingModule = async (id, patch) => {
    try {
      const res = await axios.patch(`${API_URL}/coding-modules/${id}`, patch, getAdminHeaders());
      setCodingModules(prev => prev.map(m => m._id === id ? res.data : m));
    } catch { toast.error("Failed to update coding module"); }
  };

  const deleteCodingModule = (id, title) => {
    setDeleteConfirm({ show: true, id, title, type: "coding" });
  };

  const confirmDeleteCodingModule = async () => {
    const { id } = deleteConfirm;
    try {
      await axios.delete(`${API_URL}/coding-modules/${id}`, getAdminHeaders());
      setCodingModules(prev => prev.filter(m => m._id !== id));
      toast.success("Coding module deleted");
      setDeleteConfirm({ show: false, id: null, title: "", type: "mcq" });
    } catch { toast.error("Failed to delete coding module"); }
  };

  const fetchCodingAnalytics = async () => {
    try {
      const res = await axios.get(`${API_URL}/coding-submissions`, getAdminHeaders());
      setCodingAnalytics(res.data || []);
    } catch (err) {
      console.error("Failed to fetch coding analytics", err);
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
  const deleteModule = (id, topicName) => {
    setDeleteConfirm({ show: true, id, title: topicName, type: "mcq" });
  };

  const confirmDeleteModule = async () => {
    const { id } = deleteConfirm;
    try {
      await axios.delete(`${API_URL}/modules/${id}`, getAdminHeaders());
      toast.success("Module deleted successfully");
      fetchModules();
      if (viewModule && viewModule._id === id) {
        setViewModule(null);
      }
      setDeleteConfirm({ show: false, id: null, title: "", type: "mcq" });
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

  const handleBatchUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const parsedQuestions = parseUploadedFile(text);
      if (parsedQuestions.length > 0) {
        try {
          await axios.post(
            `${API_URL}/modules/${viewModule._id}/questions/batch`,
            { questions: parsedQuestions },
            getAdminHeaders()
          );
          toast.success(`${parsedQuestions.length} questions added successfully!`);
          fetchModules();
          const moduleRes = await axios.get(`${API_URL}/modules`, getAdminHeaders());
          const updated = moduleRes.data.find(m => m._id === viewModule._id);
          if (updated) setViewModule(updated);
        } catch (err) {
          toast.error("Failed to upload batch questions");
        }
      } else {
        toast.error("No valid questions found in the file.");
      }
      e.target.value = ""; // Reset file input
    };
    reader.readAsText(file);
  };

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
        // Match A. or A) with optional space
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

  // Get questions from module (handles both structures)
  const getModuleQuestions = (module) => {
    if (module.module?.quiz?.length > 0) {
      return module.module.quiz.map(q => ({
        _id: q._id,
        qn: q.qn,
        codeSnippet: q.codeSnippet || '',
        questionType: q.questionType || 'plain',
        options: q.options,
        answer: q.answer,
        correctAnswer: ['A', 'B', 'C', 'D'][q.options.indexOf(q.answer)] || 'A',
        explanation: q.explanation,
        questionImage: q.questionImage || null,
      }));
    }
    if (module.questions?.length > 0) {
      return module.questions.map(q => ({
        _id: q._id,
        qn: q.questionText,
        codeSnippet: q.codeSnippet || '',
        questionType: q.questionType || 'plain',
        options: [q.options?.A, q.options?.B, q.options?.C, q.options?.D],
        answer: q.correctValue,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        questionImage: q.questionImage || null,
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
                <AlertCircle size={48} className="mx-auto mb-4 opacity-20 alert-circle-icon" />
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
                    {/* Timer input */}
                    <input
                      type="number" min={5} max={180}
                      className="input timer-input"
                      defaultValue={cm.timer}
                      onBlur={e => {
                        const v = parseInt(e.target.value);
                        if (v && v !== cm.timer) updateCodingModule(cm._id, { timer: v });
                      }}
                    />
                    {/* Batch multi-select */}
                    <div className="batch-selector-wrapper">
                      <MultiSelect
                        options={BATCH_OPTIONS}
                        selected={cm.assignedBatch}
                        onChange={val => updateCodingModule(cm._id, { assignedBatch: val })}
                        placeholder="Assign Batch"
                      />
                    </div>
                    {/* Activate/Deactivate */}
                    <div className="status-toggle-wrapper flex">
                      <button
                        className={`btn status-btn ${cm.status === "active" ? "btn-danger" : "btn-primary"}`}
                        onClick={() => updateCodingModule(cm._id, { status: cm.status === "active" ? "inactive" : "active" })}
                      >
                        {cm.status === "active" ? <><Square size={14} /> Stop</> : <><Play size={14} /> Activate</>}
                      </button>
                    </div>
                    {/* Delete */}
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

        {/* ===== ACTIVE TRAINING MODULES ===== */}
        <div className="mb-12">
          <h2 className="mb-6">
            <Cpu size={24} className="text-primary" /> Active Training Modules
          </h2>
          <div className="flex flex-col gap-4">
            {loading ? (
              <div className="card">
                <div className="admin-loader-wrap">
                  <div className="admin-loader-ring" />
                  <div className="admin-loader-dots">
                    <span /><span /><span />
                  </div>
                  <div className="admin-loader-label">Initializing Core Systems</div>
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

                    {/* Requirement: Delete Button in Active Training Modules */}
                    <button
                      className="btn"
                      style={{
                        background: "rgba(239, 68, 68, 0.12)",
                        color: "#f87171",
                        border: "1px solid rgba(239, 68, 68, 0.25)",
                        padding: "0.6rem",
                        borderRadius: "10px"
                      }}
                      onClick={() => deleteModule(module._id, module.topicName)}
                      title="Delete Module"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

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
                {BATCH_OPTIONS.map((b) => (
                  <option key={b} value={b}>{b}</option>
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
      </div>

      {/* ===== CODING SUBMISSIONS ANALYTICS ===== */}
      <div className="container">
        <div className="section-header mb-6">
          <div className="flex justify-between items-center" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <h2><Code2 size={24} className="text-primary" /> Coding Assessment Analytics</h2>
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
                {/* Derive batch list from coding modules' assignedBatch arrays */}
                {[...new Set(
                  codingModules.flatMap(m => m.assignedBatch || [])
                )].sort().map(b => <option key={b} value={b}>{b}</option>)}
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
                filteredCodingAnalytics
                  .map((s, i) => {
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
      {/* ===== VIEW CANDIDATE CODE MODAL ===== */}
      {viewCodeModal.show && viewCodeModal.submission && (
        <div className="modal-overlay no-scrollbar" style={{ zIndex: 9999 }}>
          <div className="modal-content fade-in no-scrollbar" style={{ maxWidth: "900px" }}>
            <div className="flex justify-between items-center p-3 modal-header">
              <div>
                <h2>Candidate Submission: {viewCodeModal.submission.userName}</h2>
                <p className="text-secondary text-sm">
                  Module: {codingModules.find(m => m._id === viewCodeModal.submission.moduleId?.toString() || m._id === viewCodeModal.submission.moduleId)?.title || "—"}
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
              {viewCodeModal.submission.questions.map((q, idx) => (
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
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {deleteConfirm.show && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content fade-in" style={{ maxWidth: "400px", textAlign: "center", padding: "2rem" }}>
            <div className="mb-4" style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", width: "60px", height: "60px", borderRadius: "50%", display: "flex", alignItems: "center", justifyCenter: "center", margin: "0 auto" }}>
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
      )}
    </>
  );
};

export default AdminDashboard;
