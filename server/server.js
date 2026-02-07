require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;
const path = require('path');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
const MONGO_URI = 'mongodb+srv://aarthi7813_db_user:aBzs6dwZYrbW1W5y@onedrop.01vzwgx.mongodb.net/?appName=onedrop';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.send('MCQ Assessment API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
