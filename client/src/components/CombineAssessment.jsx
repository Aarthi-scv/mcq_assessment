import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
    Card,
    CardContent,
} from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Select } from './ui/select';
import { Plus, X, AlertCircle, CheckCircle2, ArrowLeft, Layers, Calculator } from 'lucide-react';
import "./AdminDashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
// BATCH_OPTIONS removed

export default function CombineAssessment() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [availableModules, setAvailableModules] = useState([]);
    const [batches, setBatches] = useState([]);

    // Assessment Parameters
    const [assessmentName, setAssessmentName] = useState("");
    const [totalQuestions, setTotalQuestions] = useState(30);
    const [assignedBatch, setAssignedBatch] = useState([]);
    const [timer, setTimer] = useState(30);
    const [difficultyLevel, setDifficultyLevel] = useState("Mixed");
    const [courseType, setCourseType] = useState("Mixed");
    const [preventReuse, setPreventReuse] = useState(true);

    const [selections, setSelections] = useState([
        {
            id: '1',
            moduleId: '',
            name: '',
            availableQuestions: 0,
            percentage: 50
        },
        {
            id: '2',
            moduleId: '',
            name: '',
            availableQuestions: 0,
            percentage: 50
        }
    ]);

    useEffect(() => {
        fetchModules();
        fetchBatches();
    }, []);

    const fetchModules = async () => {
        try {
            const token = localStorage.getItem("adminToken");
            const res = await axios.get(`${API_URL}/modules`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAvailableModules(res.data);
        } catch (err) {
            toast.error("Failed to fetch available modules");
        } finally {
            setLoading(false);
        }
    };

    const fetchBatches = async () => {
        try {
            const res = await axios.get(`${API_URL}/batches`);
            setBatches(res.data || []);
        } catch (err) {
            console.error("Failed to fetch batches", err);
        }
    };

    const totalPercentage = selections.reduce((sum, s) => sum + s.percentage, 0);
    const isValidPercentage = totalPercentage === 100;

    const calculateQuestions = (percentage) => {
        return Math.round((percentage / 100) * totalQuestions);
    };

    const addModule = () => {
        const newSelection = {
            id: Date.now().toString(),
            moduleId: '',
            name: '',
            availableQuestions: 0,
            percentage: 0
        };
        setSelections([...selections, newSelection]);
    };

    const removeModule = (id) => {
        setSelections(selections.filter(s => s.id !== id));
    };

    const updateModuleSelection = (id, moduleId) => {
        const mod = availableModules.find(m => m._id === moduleId);
        if (!mod) return;

        setSelections(selections.map(s =>
            s.id === id ? {
                ...s,
                moduleId: mod._id,
                name: mod.topicName,
                availableQuestions: mod.module?.quiz?.length || mod.questions?.length || 0
            } : s
        ));
    };

    const updatePercentage = (id, percentage) => {
        setSelections(selections.map(s =>
            s.id === id ? { ...s, percentage } : s
        ));
    };

    const handleSave = async () => {
        if (!assessmentName) return toast.error("Deployment name required");
        if (assignedBatch.length === 0) return toast.error("Select target batch");
        if (!isValidPercentage) return toast.error("Total percentage must be 100%");

        const invalidSelection = selections.find(s => !s.moduleId || calculateQuestions(s.percentage) === 0);
        if (invalidSelection) return toast.error("Each module must have a selection and at least 1 question");

        const payload = {
            topicName: assessmentName,
            selections: selections.map(s => ({
                moduleId: s.moduleId,
                count: calculateQuestions(s.percentage)
            })),
            assignedBatch,
            timer,
            difficultyLevel,
            courseType,
            preventReuse
        };

        const loadingToast = toast.loading("Synthesizing combined assessment...");
        try {
            const token = localStorage.getItem("adminToken");
            await axios.post(`${API_URL}/modules/combine`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Assessment Deployed Successfully", { id: loadingToast });
            navigate("/admin");
        } catch (err) {
            toast.error("Synthesis Failed", { id: loadingToast });
        }
    };

    if (loading) return (
        <div className="admin-loader-wrap" style={{ minHeight: "100vh" }}>
            <div className="admin-loader-ring"></div>
            <div className="admin-loader-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
            <p className="admin-loader-label">Accessing Module Vault...</p>
        </div>
    );

    return (
        <div className="">
            {/* Header */}
            <div className="border-b border-white/5 fixed ">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} className="p-2">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-2xl font-semibold m-0" style={{ margin: 0 }}>
                            Create Combined Assessment
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <Button className="btn btn-secondary logout-btn" onClick={() => navigate("/admin")}>Cancel</Button>
                        <Button
                            onClick={handleSave} className='btn btn-primary'
                            disabled={!isValidPercentage || selections.filter(s => s.moduleId).length === 0 || !assessmentName || assignedBatch.length === 0}
                        >
                            Create Assessment
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Section - Assessment Configuration */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* General Settings */}
                        <div>
                            <Card className="card ">
                                <CardContent className="px-6 pb-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2" >
                                        {/* Left Column: Core Identity */}
                                        <div className="space-y-6">
                                            <div>
                                                <Label htmlFor="assessmentName">Topic name</Label>
                                                <Input
                                                    id="assessmentName"
                                                    value={assessmentName}
                                                    onChange={(e) => setAssessmentName(e.target.value)}
                                                    placeholder="e.g. ALPHA-SYNTHESIS-V1+ALPHA-SYNTHESIS-V2"
                                                    className="mt-1.5 py-2 text-base"
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="totalQuestions" className="font-semibold text-[var(--foreground)]">Total Number of Questions</Label>
                                                <Input
                                                    id="totalQuestions"
                                                    type="number"
                                                    value={totalQuestions}
                                                    onChange={(e) => setTotalQuestions(Number(e.target.value))}
                                                    className="mt-1.5 py-2 text-base"
                                                    min="1"
                                                />
                                            </div>
                                        </div>

                                        {/* Right Column: Deployment & Logic */}
                                        <div className="space-y-6">
                                            <div className="flex flex-col gap-2">
                                                <Label className="font-semibold text-[var(--foreground)]">Assign Batches</Label>
                                                <div className="grid grid-cols-2 gap-2" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
                                                    {batches.map(b => (
                                                        <button
                                                            key={b._id}
                                                            className={`batch-btn ${assignedBatch.includes(b.name)
                                                                ? 'batch-btn-selected shadow-sm'
                                                                : 'batch-btn-unselected'
                                                                }`}
                                                            onClick={() => {
                                                                setAssignedBatch(prev =>
                                                                    prev.includes(b.name)
                                                                        ? prev.filter(item => item !== b.name)
                                                                        : [...prev, b.name]
                                                                );
                                                            }}
                                                        >
                                                            {b.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <Label>Duration (Min)</Label>
                                                    <Input
                                                        type="number"
                                                        value={timer}
                                                        onChange={e => setTimer(parseInt(e.target.value) || 0)}
                                                        className="mt-1.5 py-2 text-base"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Difficulty</Label>
                                                    <div className="relative">
                                                        <Select
                                                            value={difficultyLevel}
                                                            onChange={e => setDifficultyLevel(e.target.value)}
                                                            className="mt-1.5 py-2 text-base appearance-none pr-10"
                                                        >
                                                            <option>Mixed</option>
                                                            <option>Basic</option>
                                                            <option>Intermediate</option>
                                                            <option>Advanced</option>
                                                        </Select>
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Module Selection Card */}
                        <Card className="card">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Layers className="w-6 h-6 text-[var(--primary-color)]" />
                                        <h2 className="text-xl font-bold">Assessment Modules</h2>
                                    </div>
                                    <Button onClick={addModule} size="sm" className="btn btn-primary">
                                        <Plus className="w-4 h-4" />
                                        Add Module
                                    </Button>
                                </div>

                                {/* Modules List */}
                                <div className="space-y-4">
                                    {selections.map((selection) => (
                                        <div key={selection.id} className="">
                                            <div className="">
                                                {/* Percentage */}
                                                <div className="flex justify-between items-center">
                                                    <div className="md:col-span-4">
                                                        <Label className="text-xs">Module Source</Label>
                                                        <Select
                                                            value={selection.moduleId}
                                                            onChange={(e) => updateModuleSelection(selection.id, e.target.value)}
                                                            className="mt-1"
                                                        >
                                                            <option value="">Select a module</option>
                                                            {availableModules.map(m => (
                                                                <option key={m._id} value={m._id}>{m.topicName}</option>
                                                            ))}
                                                        </Select>
                                                    </div>

                                                    {/* Available Questions (ReadOnly from Source) */}
                                                    <div className="md:col-span-3">
                                                        <Label className="text-xs">Source Pool</Label>
                                                        <div className="mt-1 px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-sm text-[var(--text-secondary)]">
                                                            {selection.availableQuestions} Qs available
                                                        </div>
                                                    </div>
                                                    <div className="relative mt-1">
                                                        <Label className="text-xs">Weightage</Label>
                                                        <Input
                                                            type="number"
                                                            style={{ padding: "5px" }}
                                                            value={selection.percentage}
                                                            onChange={(e) => updatePercentage(selection.id, Number(e.target.value))}
                                                            placeholder="0"
                                                            min="0"

                                                            max="100"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">%</span>
                                                    </div>
                                                    {/* Calculated Questions Count */}
                                                    <div className="">
                                                        <Label className="text-xs">Final Count</Label>
                                                        <div className="mt-1 px-4 py-3 bg-[var(--primary-color)]/10 border border-[var(--primary-color)]/20 rounded-xl text-center">
                                                            <span className="font-bold text-[var(--primary-color)]">
                                                                {calculateQuestions(selection.percentage)} Q
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Remove Button */}
                                                    <div className="">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeModule(selection.id)}
                                                            disabled={selections.length === 1}
                                                            className="text-[var(--danger-color)] hover:text-red-400 hover:bg-red-400/10 w-full"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </Button>
                                                    </div>

                                                </div>



                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Validation Indicator */}
                                <div className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${isValidPercentage
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    }`}>
                                    {isValidPercentage ? (
                                        <CheckCircle2 className="w-6 h-6 shrink-0" />
                                    ) : (
                                        <AlertCircle className="w-6 h-6 shrink-0" />
                                    )}
                                    <div className="flex-1">
                                        <span className="font-bold">
                                            Total Resource Allocation: {totalPercentage}%
                                        </span>
                                        {!isValidPercentage && (
                                            <p className="text-sm opacity-80 mt-1">
                                                {totalPercentage < 100
                                                    ? `Allocate ${100 - totalPercentage}% more for full coverage`
                                                    : `Exceeds capacity by ${totalPercentage - 100}%`}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
