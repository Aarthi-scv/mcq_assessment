import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Plus,
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
} from "lucide-react";
import "./AdminDashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const BATCH_OPTIONS = ["DV-B5", "DV-B6", "ES-B3", "VL-B1"];

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
  // State
  const [modules, setModules] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCourse, setFilterCourse] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [newModule, setNewModule] = useState({
    topicName: "",
    courseType: "ASIC-DV",
    difficultyLevel: "Medium",
    assignedBatch: [],
    file: null,
  });

  // Fetch Modules & Submissions
  const fetchModules = async () => {
    try {
      const res = await axios.get(`${API_URL}/modules`);
      setModules(res.data);
      setLoading(false);
    } catch (err) {
      toast.error("Failed to load modules");
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const res = await axios.get(`${API_URL}/submissions`);
      setSubmissions(res.data);
    } catch (err) {
      console.error("Failed to fetch submissions", err);
    }
  };

  useEffect(() => {
    fetchModules();
    fetchSubmissions();
  }, []);

  // Create Module Handler
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newModule.file || !newModule.topicName) {
      return toast.error("Please fill all required fields");
    }

    const formData = new FormData();
    formData.append("topicName", newModule.topicName);
    formData.append("courseType", newModule.courseType);
    formData.append("difficultyLevel", newModule.difficultyLevel);
    formData.append("assignedBatch", JSON.stringify(newModule.assignedBatch));
    formData.append("file", newModule.file);

    try {
      await axios.post(`${API_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Module Created Successfully");
      setIsModalOpen(false);
      setNewModule({
        topicName: "",
        courseType: "ASIC-DV",
        difficultyLevel: "Medium",
        assignedBatch: [],
        file: null,
      });
      fetchModules();
    } catch (err) {
      toast.error("Error creating module");
    }
  };

  // Update Module Handler (Timer, Status, Batch)
  const updateModule = async (id, data) => {
    try {
      await axios.patch(`${API_URL}/modules/${id}`, data);
      toast.success("Updated successfully");
      fetchModules(); // Refresh to reflect changes
    } catch (err) {
      toast.error("Update failed");
    }
  };

  // Filter Logic - Performance Optimized with useMemo
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
        <header className="flex justify-between items-end mb-8 admin-header">
          <div>
            <h1 className="text-3xl">Admin Control Center</h1>
            <p className="text-secodary">
              Manage electronics assessments and track student performance
            </p>
          </div>
          <button
            className="btn btn-primary add-module-btn"
            onClick={() => setIsModalOpen(true)}
            title="Add New Module"
            aria-label="Add New Assessment Module"
          >
            <Plus size={28} aria-hidden="true" />
          </button>
        </header>

        {/* Top Bar / Filters */}
        <div className="card flex gap-4 items-center mb-8 top-bar-filters">
          <div className="flex items-center flex-1 gap-3 px-4 py-2 bg-black/20 rounded-xl border border-white/5">
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

        {/* Modules Grid/List */}
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
            {!loading && filteredModules.length === 0 && (
              <div className="card text-center py-12 text-secondary">
                <AlertCircle
                  size={48}
                  className="mx-auto mb-4 opacity-20 alert-circle-icon"
                />
                <p>No modules found matching your search criteria.</p>
              </div>
            )}
          </div>
        </div>

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

      {/* Add Module Modal */}
      {isModalOpen && (
        <div className="modal-overlay no-scrollbar">
          <div className="modal-content fade-in no-scrollbar">
            <div className="flex justify-between items-top p-6 modal-header">
              <h2>Add Assessment Module</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-secondary hover:text-white transition-colors close-modal-btn"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="modal-form-body">
              <div className="grid gap-4">
                <div>
                  <label>Topic Designation</label>
                  <input
                    value={newModule.topicName}
                    onChange={(e) =>
                      setNewModule({ ...newModule, topicName: e.target.value })
                    }
                    placeholder="e.g., Verilog Logic Synthesis"
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label htmlFor="course-type">Course Type</label>
                    <select
                      id="course-type"
                      value={newModule.courseType}
                      onChange={(e) =>
                        setNewModule({
                          ...newModule,
                          courseType: e.target.value,
                        })
                      }
                    >
                      <option value="ASIC-DV">ASIC-DV</option>
                      <option value="Embedded">Embedded Systems</option>
                      <option value="VLSI">VLSI Design</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label htmlFor="complexity-level">Complexity Level</label>
                    <select
                      id="complexity-level"
                      value={newModule.difficultyLevel}
                      onChange={(e) =>
                        setNewModule({
                          ...newModule,
                          difficultyLevel: e.target.value,
                        })
                      }
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label>Target Batch</label>
                  <select
                    value={newModule.assignedBatch[0] || ""}
                    onChange={(e) =>
                      setNewModule({
                        ...newModule,
                        assignedBatch: [e.target.value],
                      })
                    }
                    required
                  >
                    <option value="" disabled>
                      Select Target Batch
                    </option>
                    {BATCH_OPTIONS.map((batch) => (
                      <option key={batch} value={batch}>
                        {batch}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="file-upload-container">
                  <label>Assessment Data (ZIP File)</label>
                  <div className="relative border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-primary/50 transition-colors bg-white/5">
                    <input
                      type="file"
                      accept=".zip"
                      onChange={(e) =>
                        setNewModule({ ...newModule, file: e.target.files[0] })
                      }
                      className="file-upload-input"
                      required
                    />
                    <Layers
                      size={32}
                      className="mx-auto mb-2 text-secondary file-upload-icon"
                    />
                    <p className="text-sm text-secondary">
                      {newModule.file
                        ? newModule.file.name
                        : "Click to upload .zip file (mcqs.json + images/)"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;
