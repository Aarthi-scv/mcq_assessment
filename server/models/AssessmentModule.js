const mongoose = require('mongoose');

const assessmentModuleSchema = new mongoose.Schema({
  topicName: { type: String, required: true },
  courseType: { type: String, required: true },
  difficultyLevel: { type: String, required: true },
  timer: { type: Number, default: 10 }, // in minutes
  status: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
  assignedBatch: { type: [String], default: [] },

  module: {
    labs: { type: Array, default: [] },
    quiz: [{
      id: { type: String, required: true },
      qn: { type: String, required: true },
      questionType: { type: String, enum: ['plain', 'code'], default: 'plain' },
      optionType: { type: String, enum: ['multiple', 'single', 'truefalse'], default: 'multiple' },
      questionImage: { type: String, default: null },
      options: [{ type: String, required: true }],
      answer: { type: String, required: true },
      explanation: { type: String, default: '' }
    }]
  },

  questions: [{
    questionText: { type: String },
    questionType: { type: String, enum: ['plain', 'code'], default: 'plain' },
    optionType: { type: String, enum: ['multiple', 'single', 'truefalse'], default: 'multiple' },
    questionImage: { type: String },
    options: {
      A: { type: String },
      B: { type: String },
      C: { type: String },
      D: { type: String }
    },
    correctAnswer: { type: String },
    correctValue: { type: String },
    explanation: { type: String }
  }],

  activatedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AssessmentModule', assessmentModuleSchema);
