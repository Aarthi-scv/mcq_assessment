const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  batch: { type: String, required: true, enum: ['DV-B8', 'DV-B9', 'DV-B10', 'DV-B11', 'DV-B12', 'ES-B2', 'ES-B3'] },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
