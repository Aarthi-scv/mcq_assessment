const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
    inputs: { type: [String], default: [] },
    input: { type: String, default: '' }, // Keep for backward compatibility
    expectedOutput: { type: String, default: '', trim: true },
}, { _id: true });

const codingQuestionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    starterCode: { type: String, default: '' },
    testCases: { type: [testCaseSchema], default: [] },
}, { _id: true });

const codingModuleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    assignedBatch: { type: [String], default: [] },
    timer: { type: Number, default: 60 },    // minutes
    status: { type: String, enum: ['inactive', 'active'], default: 'inactive' },
    activatedAt: { type: Date },
    questions: { type: [codingQuestionSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('CodingModule', codingModuleSchema);
