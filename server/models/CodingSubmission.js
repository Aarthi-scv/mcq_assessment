const mongoose = require('mongoose');

const testCaseResultSchema = new mongoose.Schema({
    input: { type: String, default: '' },
    expectedOutput: { type: String, default: '' },
    actualOutput: { type: String, default: '' },
    passed: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
    compileError: { type: String, default: '' },
    runtimeError: { type: String, default: '' },
}, { _id: false });

const questionResultSchema = new mongoose.Schema({
    questionId: { type: mongoose.Schema.Types.ObjectId },
    questionText: { type: String },
    code: { type: String, default: '' },
    testCaseResults: [testCaseResultSchema],
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 3 },
}, { _id: false });

const codingSubmissionSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    batch: { type: String, required: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingModule', required: true },
    totalScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    questions: [questionResultSchema],
    submittedAt: { type: Date, default: Date.now },
    retakeRequested: { type: Boolean, default: false }
});

module.exports = mongoose.model('CodingSubmission', codingSubmissionSchema);
