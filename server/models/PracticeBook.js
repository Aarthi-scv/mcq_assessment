const mongoose = require('mongoose');

const PracticeBookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    category: { type: String },
    publishedYear: { type: Number },
    inStock: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('PracticeBook', PracticeBookSchema);
