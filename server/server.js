require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const practiceRoutes = require('./routes/practice');

const app = express();
const PORT = process.env.PORT || 5000;
const path = require('path');

// CORS configuration - restrict to your frontend domain in production
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',')
  : ['http://localhost:5173', 'http://localhost:3000','http://test.silicon-craft.com'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
const MONGO_URI = process.env.MONGO_URI
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    // Auto-seed admin if none exists
    const bcrypt = require('bcryptjs');
    const Admin = require('./models/Admin');
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const username = process.env.ADMIN_USER || 'admin';
      const password = process.env.ADMIN_PASS || 'admin123';
      const hashed = await bcrypt.hash(password, 10);
      await Admin.create({ username, password: hashed });
      console.log(`Default admin created: ${username}`);
    }
  })
  .catch(err => console.error('MongoDB Connection Error:', err));

app.use('/api', apiRoutes);
app.use('/api/practice', practiceRoutes);

app.get('/', (req, res) => {
  res.send('MCQ Assessment API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
