const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const PracticeBook = require('../models/PracticeBook');
const PracticeStudent = require('../models/PracticeStudent');
const { authenticateCandidate, JWT_SECRET } = require('../middleware/authMiddleware');

// 1. LOGIN API (To get Bearer Token for practicing)
// Standard credentials: username: user1, password: password123
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'student' && password === 'practice123') {
        const token = jwt.sign({ id: 'student_id', role: 'candidate' }, JWT_SECRET, { expiresIn: '1h' });
        return res.json({ success: true, token: `Bearer ${token}` });
    }
    res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// --- BOOK CRUD APIs ---

// 2. GET ALL BOOKS
router.get('/books', async (req, res) => {
    try {
        const books = await PracticeBook.find();
        res.json(books);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. GET SINGLE BOOK
router.get('/books/:id', async (req, res) => {
    try {
        const book = await PracticeBook.findById(req.params.id);
        if (!book) return res.status(404).json({ message: 'Book not found' });
        res.json(book);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 4. CREATE BOOK (Protected)
router.post('/books', authenticateCandidate, async (req, res) => {
    const book = new PracticeBook(req.body);
    try {
        const newBook = await book.save();
        res.status(201).json(newBook);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 5. UPDATE BOOK (Protected)
router.put('/books/:id', authenticateCandidate, async (req, res) => {
    try {
        const updatedBook = await PracticeBook.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedBook) return res.status(404).json({ message: 'Book not found' });
        res.json(updatedBook);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 6. DELETE BOOK (Protected)
router.delete('/books/:id', authenticateCandidate, async (req, res) => {
    try {
        const book = await PracticeBook.findByIdAndDelete(req.params.id);
        if (!book) return res.status(404).json({ message: 'Book not found' });
        res.json({ message: 'Book deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// --- STUDENT CRUD APIs ---

// 7. GET ALL STUDENTS
router.get('/students', async (req, res) => {
    try {
        const students = await PracticeStudent.find();
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 8. GET SINGLE STUDENT
router.get('/students/:id', async (req, res) => {
    try {
        const student = await PracticeStudent.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json(student);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 9. CREATE STUDENT (Protected)
router.post('/students', authenticateCandidate, async (req, res) => {
    const student = new PracticeStudent(req.body);
    try {
        const newStudent = await student.save();
        res.status(201).json(newStudent);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 10. UPDATE STUDENT (Protected)
router.put('/students/:id', authenticateCandidate, async (req, res) => {
    try {
        const updatedStudent = await PracticeStudent.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedStudent) return res.status(404).json({ message: 'Student not found' });
        res.json(updatedStudent);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 11. DELETE STUDENT (Protected)
router.delete('/students/:id', authenticateCandidate, async (req, res) => {
    try {
        const student = await PracticeStudent.findByIdAndDelete(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });
        res.json({ message: 'Student deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
