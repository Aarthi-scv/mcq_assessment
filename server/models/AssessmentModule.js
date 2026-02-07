const mongoose = require('mongoose');

const assessmentModuleSchema = new mongoose.Schema({
  topicName: { type: String, required: true },
  courseType: { type: String, required: true },
  difficultyLevel: { type: String, required: true },
  timer: { type: Number, default: 10 }, // in minutes
  status: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
  assignedBatch: { type: [String], default: [] },
  
  // New structure requested by user
  module: {
    labs: { type: Array, default: [] },
    quiz: [{
      id: { type: String, required: true },
      qn: { type: String, required: true },
      questionImage: { type: String, default: null },
      options: [{ type: String, required: true }],
      answer: { type: String, required: true },
      explanation: { type: String, default: '' }
    }]
  },
  
  // Keep the old questions array for backward compatibility if needed, 
  // or we can transition fully to the new structure.
  // The user said "store in db and also need to shown in assessment".
  // I will use 'module.quiz' as the source for the assessment now.
  questions: [{
    questionText: { type: String },
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
  
  activatedAt: { type: Date }, // Stores when the timer started
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AssessmentModule', assessmentModuleSchema);
