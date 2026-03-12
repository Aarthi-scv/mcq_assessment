import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Terminal, Lock, User } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AdminLogin = () => {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Redirect if already logged in
    React.useEffect(() => {
        const token = localStorage.getItem("adminToken");
        if (token) {
            navigate("/admin");
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/admin/login`, formData);
            toast.success("Admin Access Granted");
            localStorage.setItem("adminToken", res.data.token);
            localStorage.setItem("adminUser", res.data.username);
            navigate("/admin");
        } catch (err) {
            toast.error(err.response?.data?.message || "Access Denied");
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
                                background: "rgba(255, 77, 77, 0.1)",
                                padding: "1rem",
                                borderRadius: "12px",
                                border: "1px solid rgba(255, 77, 77, 0.2)",
                            }}
                        >
                            <Terminal size={32} style={{ color: "#ff4d4d" }} />
                        </div>
                    </div>
                    <h2 className="justify-center">Control Center</h2>
                    <p className="text-secondary text-sm">
                        Restricted Access — Admin Authorization Required
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="flex items-center gap-2">
                            <User size={16} /> Admin Username
                        </label>
                        <input
                            type="text"
                            placeholder="Enter admin username"
                            required
                            value={formData.username}
                            onChange={(e) =>
                                setFormData({ ...formData, username: e.target.value })
                            }
                        />
                    </div>

                    <div className="mb-6">
                        <label className="flex items-center gap-2">
                            <Lock size={16} /> Access Key
                        </label>
                        <input
                            type="password"
                            placeholder="Enter admin password"
                            required
                            value={formData.password}
                            onChange={(e) =>
                                setFormData({ ...formData, password: e.target.value })
                            }
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={loading}
                        style={{
                            background: loading
                                ? undefined
                                : "linear-gradient(135deg, #ff4d4d, #991b1b)",
                        }}
                    >
                        {loading ? "Authenticating..." : "Authorize Access"}
                    </button>
                </form>

                <p className="text-center mt-6 text-xs text-secondary" style={{ opacity: 0.5 }}>
                    Admin credentials are system-managed. Contact your administrator for access.
                </p>
            </div>
        </div>
    );
};

export default AdminLogin;
