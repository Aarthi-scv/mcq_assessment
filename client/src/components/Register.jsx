import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { User, Mail, Layers, ShieldCheck } from "lucide-react";

const API_URL = "http://localhost:5000/api";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    batch: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/register`, formData);
      toast.success("Registration Successful! Please login.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
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
              <ShieldCheck size={32} className="text-primary" />
            </div>
          </div>
          <h2>Access Registration</h2>
          <p className="text-secondary text-sm">
            Initialize your candidate credentials
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <User size={16} /> Candidate Name
            </label>
            <input
              type="text"
              placeholder="Enter full name"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center gap-2">
              <Mail size={16} /> System Email
            </label>
            <input
              type="email"
              placeholder="candidate@nexgen.com"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className="mb-6">
            <label className="flex items-center gap-2">
              <Layers size={16} /> Assigned Batch
            </label>
            <select
              required
              value={formData.batch}
              onChange={(e) =>
                setFormData({ ...formData, batch: e.target.value })
              }
            >
              <option value="" disabled>
                Select Batch Designation
              </option>
              <option value="DV-B5">DV-B5</option>
              <option value="DV-B6">DV-B6</option>
              <option value="ES-B3">ES-B3</option>
              <option value="VL-B1">VL-B1</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? "Processing..." : "Register Credentials"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-secondary">
          Already have access?{" "}
          <Link
            to="/login"
            className="text-primary"
            style={{ textDecoration: "none" }}
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
