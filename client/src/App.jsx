import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Terminal, ShieldCheck, Zap } from "lucide-react";
import AdminDashboard from "./components/AdminDashboard";
import InstructionPage from "./components/InstructionPage";
import AssessmentPage from "./components/AssessmentPage";
import AssessmentReport from "./components/AssessmentReport";
import Register from "./components/Register";
import Login from "./components/Login";
import CandidateDashboard from "./components/CandidateDashboard";
import "./App.css";

// Landing component
const Home = () => (
  <div className="container flex flex-col items-center justify-center fade-in home-container">
    <div className="mb-8 p-4 zap-banner">
      <Zap size={64} className="text-primary" />
    </div>
    <h1 className="landing-title">NexGen Electronics</h1>
    <p className="text-secondary mb-8 landing-subtitle">
      Advanced Assessment & Training Platform for ASIC, VLSI, and Embedded
      Systems Engineering.
    </p>
    <div className="flex gap-6">
      <Link to="/login" className="btn btn-primary landing-btn">
        <ShieldCheck size={20} /> Start Candidate Assessment
      </Link>
      <Link to="/admin" className="btn btn-secondary landing-btn">
        <Terminal size={20} /> Control Center
      </Link>
    </div>

    <div className="grid gap-8 mt-20 features-grid">
      <div className="card feature-card">
        <h3 className="flex items-center gap-2 mb-2 feature-title">
          <Zap size={16} /> RT Synthesis
        </h3>
        <p className="text-sm text-secondary">
          Optimized test flows for hardware description languages.
        </p>
      </div>
      <div className="card feature-card">
        <h3 className="flex items-center gap-2 mb-2 feature-title">
          <ShieldCheck size={16} /> Validation
        </h3>
        <p className="text-sm text-secondary">
          Rigorous assessment of digital and mixed-signal logic.
        </p>
      </div>
      <div className="card feature-card">
        <h3 className="flex items-center gap-2 mb-2 feature-title">
          <Terminal size={16} /> Analytics
        </h3>
        <p className="text-sm text-secondary">
          Real-time performance tracking and system logging.
        </p>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#0f172a",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)",
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/candidate-dashboard" element={<CandidateDashboard />} />
        <Route path="/instructions" element={<InstructionPage />} />
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route
          path="/assessment-report/:submissionId"
          element={<AssessmentReport />}
        />
      </Routes>
    </Router>
  );
}

export default App;
