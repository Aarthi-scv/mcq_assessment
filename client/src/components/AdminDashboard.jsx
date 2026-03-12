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
import MultiSelect from "./Admin/MultiSelect";
import AssessmentsTab from "./Admin/Tabs/AssessmentsTab";
import AnalyticsTab from "./Admin/Tabs/AnalyticsTab";
import BatchesTab from "./Admin/Tabs/BatchesTab";
import ViewModuleModal from "./Admin/Modals/ViewModuleModal";
import ViewCodeModal from "./Admin/Modals/ViewCodeModal";
import DeleteConfirmModal from "./Admin/Modals/DeleteConfirmModal";
import { getAdminHeaders, getModuleQuestions, parseUploadedFile } from "../utils/adminUtils";
import "./AdminDashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
// BATCH_OPTIONS removed - now dynamic


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
  const [activeTab, setActiveTab] = useState("assessments"); // "assessments", "analytics", or "batches"
  const [batches, setBatches] = useState([]);
  const [newBatchName, setNewBatchName] = useState("");

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
    const token = localStorage.getItem("adminToken");

    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchModules(),
          fetchSubmissions(),
          fetchCodingModules(),
          fetchCodingAnalytics(),
          fetchBatches()
        ]);
      } catch (err) {
        toast.error("Systems Synchronization Failed");
      } finally {
        setLoading(false);
      }
    };

    if (isDev) {
      loadData();
      return;
    }

    if (!token) {
      navigate("/control-center");
      return;
    }

    // Verify token
    axios.get(`${API_URL}/admin/verify`, getAdminHeaders())
      .then(() => {
        loadData();
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
    setDeleteConfirm({ show: true, id, title: userName, type: "reset-mcq" });
  };

  const confirmResetSubmission = async () => {
    const { id, title: userName } = deleteConfirm;
    try {
      await axios.delete(`${API_URL}/submissions/${id}`, getAdminHeaders());
      toast.success(`Assessment reset for ${userName}`);
      setDeleteConfirm({ show: false, id: null, title: "", type: "mcq" });
      fetchSubmissions();
    } catch (err) {
      toast.error("Failed to reset assessment.");
    }
  };

  const deleteCodingSubmission = async (id, userName) => {
    setDeleteConfirm({ show: true, id, title: userName, type: "reset-coding" });
  };

  const confirmResetCodingSubmission = async () => {
    const { id, title: userName } = deleteConfirm;
    try {
      await axios.delete(`${API_URL}/coding-submissions/${id}`, getAdminHeaders());
      toast.success(`Coding assessment reset for ${userName}`);
      setDeleteConfirm({ show: false, id: null, title: "", type: "mcq" });
      fetchCodingAnalytics();
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

  const fetchBatches = async () => {
    try {
      const res = await axios.get(`${API_URL}/batches`, getAdminHeaders());
      setBatches(res.data || []);
    } catch (err) {
      console.error("Failed to fetch batches", err);
    }
  };

  const createBatch = async () => {
    if (!newBatchName.trim()) return toast.error("Batch name is required");
    try {
      const res = await axios.post(`${API_URL}/batches`, { name: newBatchName }, getAdminHeaders());
      setBatches([...batches, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewBatchName("");
      toast.success("Batch created successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create batch");
    }
  };

  const deleteBatch = async (id, name) => {
    setDeleteConfirm({ show: true, id, title: name, type: "batch" });
  };

  const confirmDeleteBatch = async () => {
    const { id } = deleteConfirm;
    try {
      await axios.delete(`${API_URL}/batches/${id}`, getAdminHeaders());
      setBatches(batches.filter(b => b._id !== id));
      toast.success("Batch deleted");
      setDeleteConfirm({ show: false, id: null, title: "", type: "mcq" });
    } catch (err) {
      toast.error("Failed to delete batch");
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
    setDeleteConfirm({ show: true, id: { moduleId, questionId }, title: "this question", type: "question" });
  };

  const confirmDeleteQuestion = async () => {
    const { id: { moduleId, questionId } } = deleteConfirm;
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
      setDeleteConfirm({ show: false, id: null, title: "", type: "mcq" });
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
      <div className="container fade-in min-h-screen">
        <header className="flex justify-between items-center admin-header">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-1">
              Admin Control Center
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              className="btn btn-secondary logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          {["assessments", "analytics", "batches"].map((tab) => (
            <button
              key={tab}
              className={`btn btn-secondary logout-btn capitalize ${activeTab === tab
                ? "bg-primary text-black shadow-lg shadow-primary/20"
                : "text-secondary hover:text-white hover:bg-white/5"
                }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "assessments" ? (
          <AssessmentsTab
            navigate={navigate}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterCourse={filterCourse}
            setFilterCourse={setFilterCourse}
            filteredModules={filteredModules}
            getModuleQuestions={getModuleQuestions}
            setViewModule={setViewModule}
            deleteModule={deleteModule}
            codingModLoading={codingModLoading}
            codingModules={codingModules}
            updateCodingModule={updateCodingModule}
            deleteCodingModule={deleteCodingModule}
            batches={batches}
            updateModule={updateModule}
          />
        ) : activeTab === "analytics" ? (
          <AnalyticsTab
            fetchSubmissions={fetchSubmissions}
            mcqExportOpen={mcqExportOpen}
            setMcqExportOpen={setMcqExportOpen}
            exportPDF={exportPDF}
            exportExcel={exportExcel}
            exportDocs={exportDocs}
            analyticsFilterBatch={analyticsFilterBatch}
            setAnalyticsFilterBatch={setAnalyticsFilterBatch}
            batches={batches}
            analyticsFilterTopic={analyticsFilterTopic}
            setAnalyticsFilterTopic={setAnalyticsFilterTopic}
            topicOptions={topicOptions}
            filteredSubmissions={filteredSubmissions}
            modules={modules}
            deleteSubmission={deleteSubmission}
            codingExportOpen={codingExportOpen}
            setCodingExportOpen={setCodingExportOpen}
            exportCodingPDF={exportCodingPDF}
            exportCodingExcel={exportCodingExcel}
            exportCodingDocs={exportCodingDocs}
            codingAnalyticsBatch={codingAnalyticsBatch}
            setCodingAnalyticsBatch={setCodingAnalyticsBatch}
            codingModules={codingModules}
            filteredCodingAnalytics={filteredCodingAnalytics}
            setViewCodeModal={setViewCodeModal}
            deleteCodingSubmission={deleteCodingSubmission}
          />
        ) : (
          <BatchesTab
            newBatchName={newBatchName}
            setNewBatchName={setNewBatchName}
            createBatch={createBatch}
            batches={batches}
            deleteBatch={deleteBatch}
          />
        )}
      </div>

      {/* Modals outside container to avoid transform conflicts */}
      <ViewModuleModal
        viewModule={viewModule}
        setViewModule={setViewModule}
        getModuleQuestions={getModuleQuestions}
        editingQuestion={editingQuestion}
        setEditingQuestion={setEditingQuestion}
        addingQuestion={addingQuestion}
        setAddingQuestion={setAddingQuestion}
        editForm={editForm}
        setEditForm={setEditForm}
        saveEditQuestion={saveEditQuestion}
        startEditQuestion={startEditQuestion}
        deleteQuestion={deleteQuestion}
        handleBatchUpload={handleBatchUpload}
        addQuestionToModule={addQuestionToModule}
        newQForm={newQForm}
        setNewQForm={setNewQForm}
        API_URL={API_URL}
      />

      <ViewCodeModal
        viewCodeModal={viewCodeModal}
        setViewCodeModal={setViewCodeModal}
        codingModules={codingModules}
      />

      <DeleteConfirmModal
        deleteConfirm={deleteConfirm}
        setDeleteConfirm={setDeleteConfirm}
        confirmDeleteModule={confirmDeleteModule}
        confirmDeleteCodingModule={confirmDeleteCodingModule}
        confirmResetSubmission={confirmResetSubmission}
        confirmResetCodingSubmission={confirmResetCodingSubmission}
        confirmDeleteBatch={confirmDeleteBatch}
        confirmDeleteQuestion={confirmDeleteQuestion}
      />
    </>
  );
};

export default AdminDashboard;
