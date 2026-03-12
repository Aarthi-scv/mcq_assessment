const mongoose = require('mongoose');

const PracticeStudentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    age: { type: Number },
    course: { type: String },
    grade: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('PracticeStudent', PracticeStudentSchema);
