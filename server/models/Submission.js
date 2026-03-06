const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  userName: { type: String, default: 'Anonymous' },
  batch: { type: String },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'AssessmentModule' },
  score: { type: Number, required: true },
  correct: { type: Number, required: true },
  wrong: { type: Number, required: true },
  unattended: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId }, // Refers to subdocument _id in module.questions
    selectedOption: String,
    isCorrect: Boolean
  }],
  feedback: {
    rating: { type: Number, default: 0 },
    comment: String
  },
  submittedAt: { type: Date, default: Date.now },
  retakeRequested: { type: Boolean, default: false }
});

module.exports = mongoose.model('Submission', submissionSchema);
