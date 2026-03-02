import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { User, Mail, ShieldCheck, Terminal } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Login = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Requirement 1: Redirect if already logged in
  React.useEffect(() => {
    const storedUser = localStorage.getItem("candidateUser");
    const token = localStorage.getItem("candidateToken");
    if (storedUser && token) {
      navigate("/candidate-dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/login`, formData);
      toast.success("Login Successful!");
      localStorage.setItem("candidateUser", JSON.stringify(res.data.user));
      localStorage.setItem("candidateToken", res.data.token);
      navigate("/candidate-dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-height-screen fade-in">
      <div className="card" style={{ maxWidth: "450px", width: "100%" }}>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div
              style={{
                background: "rgba(0, 245, 255, 0.1)",
                padding: "1rem",
                borderRadius: "12px",
              }}
            >
              <Terminal size={32} className="text-primary" />
            </div>
          </div>
          <h2 className="justify-center">Login your account</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <User size={16} /> Candidate Name
            </label>
            <input
              type="text"
              placeholder="Enter registered name"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-2">
              <Mail size={16} /> Registered Email
            </label>
            <input
              type="email"
              placeholder="candidate@email.com"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-secondary">
          New candidate?{" "}
          <Link
            to="/register"
            className="text-primary"
            style={{ textDecoration: "none" }}
          >
            Register Now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
