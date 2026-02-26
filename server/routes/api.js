const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const AssessmentModule = require('../models/AssessmentModule');
const Submission = require('../models/Submission');
const User = require('../models/User');
const Admin = require('../models/Admin');
const { parseMCQ } = require('../utils/parser');
const { authenticateCandidate, authenticateAdmin, JWT_SECRET } = require('../middleware/authMiddleware');
const { setOtp, getOtp, deleteOtp } = require('../utils/otpStore');
const { sendOtpEmail } = require('../utils/mailer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// --- AUTH / USERS ---

// Step 1 – Send OTP to candidate email
router.post('/send-otp', async (req, res) => {
  try {
    const { name, email, batch } = req.body;

    if (!name || !email || !batch) {
      return res.status(400).json({ message: 'Name, email and batch are required' });
    }

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // Store OTP along with registration data
    setOtp(email, otp, { name, batch });

    // Send OTP via email
    await sendOtpEmail(email, name, otp);

    console.log(`OTP sent to ${email} for registration`);
    res.json({ message: 'OTP sent successfully. Please check your email.' });
  } catch (err) {
    console.error('Send OTP Error:', err);
    res.status(500).json({ message: 'Failed to send OTP. Please check your email address and try again.' });
  }
});

// Step 2 – Verify OTP and complete registration
router.post('/register', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Retrieve stored OTP record
    const record = getOtp(email);
    if (!record) {
      return res.status(400).json({ message: 'OTP expired or not found. Please request a new OTP.' });
    }

    if (record.otp !== String(otp).trim()) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // OTP is valid — create the user account
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      deleteOtp(email);
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    user = new User({ name: record.name, email: email.toLowerCase(), batch: record.batch });
    await user.save();

    // Clear the OTP record
    deleteOtp(email);

    console.log(`New user registered: ${record.name} (${email}) – Batch: ${record.batch}`);
    res.json({ message: 'Registration successful', user });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login Student (returns JWT)
router.post('/login', async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findOne({ name, email });

    if (!user) {
      return res.status(404).json({ message: 'Invalid credentials or user not found' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, name: user.name, email: user.email, batch: user.batch },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ message: 'Login successful', user, token });
  } catch (err) {
    res.status(500).json({ message: 'Login error' });
  }
});

// --- ADMIN AUTH ---

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      { adminId: admin._id, username: admin.username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ message: 'Admin login successful', token, username: admin.username });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Admin login error' });
  }
});

// Verify admin token (for frontend auth check)
router.get('/admin/verify', authenticateAdmin, (req, res) => {
  res.json({ valid: true, username: req.admin.username });
});

// --- MODULES ---

// Get all modules (admin only)
router.get('/modules', authenticateAdmin, async (req, res) => {
  try {
    const modules = await AssessmentModule.find().sort({ createdAt: -1 });
    console.log(`Fetched ${modules.length} modules`);
    res.json(modules);
  } catch (err) {
    console.error('Error fetching modules:', err);
    res.status(500).json({ message: 'Error fetching modules' });
  }
});

// Create Module with JSON questions (NEW - no file upload needed)
router.post('/modules/create', authenticateAdmin, async (req, res) => {
  try {
    const { topicName, courseType, difficultyLevel, assignedBatch, questions } = req.body;

    if (!topicName || !questions || questions.length === 0) {
      return res.status(400).json({ message: 'Topic name and at least one question are required' });
    }

    // Build quiz array from questions
    const quizQuestions = questions.map((q, index) => {
      const isTrueFalse = q.optionType === 'truefalse';
      const opts = isTrueFalse
        ? ['True', 'False']
        : [q.optionA, q.optionB, q.optionC, q.optionD];
      const answerValue = isTrueFalse
        ? (q.correctAnswer === 'A' ? 'True' : 'False')
        : (q[`option${q.correctAnswer}`] || q.optionA);
      return {
        id: `q${index + 1}`,
        qn: q.qn,
        questionType: q.questionType || 'plain',
        optionType: q.optionType || 'multiple',
        questionImage: null,
        options: opts,
        answer: answerValue,
        explanation: q.explanation || ''
      };
    });

    const newModule = new AssessmentModule({
      topicName,
      courseType,
      difficultyLevel,
      assignedBatch: assignedBatch || [],
      module: {
        labs: [],
        quiz: quizQuestions
      },
      questions: quizQuestions.map(q => ({
        questionText: q.qn,
        questionType: q.questionType,
        optionType: q.optionType,
        questionImage: null,
        options: {
          A: q.options[0] || '',
          B: q.options[1] || '',
          C: q.options[2] || '',
          D: q.options[3] || ''
        },
        correctAnswer: ['A', 'B', 'C', 'D'][q.options.indexOf(q.answer)] || 'A',
        correctValue: q.answer,
        explanation: q.explanation
      })),
      status: 'inactive'
    });

    await newModule.save();
    console.log('Module Created with', quizQuestions.length, 'questions:', newModule._id);

    res.json({
      message: 'Module created successfully',
      module: newModule,
      questionCount: quizQuestions.length
    });
  } catch (error) {
    console.error('Create Module Error:', error);
    res.status(500).json({ message: 'Error creating module', error: error.message });
  }
});

// Create Module & Upload Questions (ZIP with JSON and Images) - LEGACY
router.post('/upload', authenticateAdmin, upload.single('file'), async (req, res) => {
  console.log('Upload Request Received:', req.body);
  try {
    const { topicName, courseType, difficultyLevel, assignedBatch } = req.body;
    let parsedQuestions = [];

    if (req.file) {
      console.log('Processing ZIP File:', req.file.path);
      const zip = new AdmZip(req.file.path);
      const zipEntries = zip.getEntries();

      console.log('ZIP Entries found:', zipEntries.map(e => e.entryName));

      // 1. Find and parse .txt file
      const txtEntry = zipEntries.find(entry => entry.entryName.toLowerCase().endsWith('.txt'));
      if (!txtEntry) {
        throw new Error('.txt file not found in ZIP. Please ensure the questions are in a text file.');
      }

      console.log('Found txt file at:', txtEntry.entryName);
      const txtData = txtEntry.getData().toString('utf8');

      // Use updated parseMCQ
      const parsedQuiz = parseMCQ(txtData);

      // 2. Extract images to uploads/ directory
      const imagesDir = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);

      // Process each question for images
      parsedQuestions = parsedQuiz.map((qn) => {
        if (qn.questionImage) {
          const imageEntry = zipEntries.find(entry =>
            entry.entryName.toLowerCase().endsWith(qn.questionImage.toLowerCase())
          );

          if (imageEntry) {
            const imgPath = path.join(imagesDir, qn.questionImage);
            fs.writeFileSync(imgPath, imageEntry.getData());
            console.log(`Extracted image: ${qn.questionImage} from ${imageEntry.entryName}`);
          } else {
            console.warn(`Warning: Image ${qn.questionImage} listed in txt but not found in ZIP`);
          }
        }

        return qn;
      });

      console.log('Actually parsed questions count:', parsedQuestions.length);

      // Cleanup ZIP file
      fs.unlinkSync(req.file.path);
    } else {
      console.log('WARNING: No file uploaded!');
    }

    let batches = [];
    if (assignedBatch) {
      try {
        batches = typeof assignedBatch === 'string' ? JSON.parse(assignedBatch) : assignedBatch;
      } catch (e) {
        batches = [];
      }
    }

    const newModule = new AssessmentModule({
      topicName,
      courseType,
      difficultyLevel,
      assignedBatch: batches,
      module: {
        labs: [],
        quiz: parsedQuestions
      },
      questions: parsedQuestions.map(q => ({
        questionText: q.qn,
        questionImage: q.questionImage,
        options: {
          A: q.options[0],
          B: q.options[1],
          C: q.options[2],
          D: q.options[3]
        },
        correctAnswer: ['A', 'B', 'C', 'D'][q.options.indexOf(q.answer)] || 'A',
        correctValue: q.answer,
        explanation: q.explanation
      })),
      status: 'inactive'
    });
    await newModule.save();
    console.log('Module Saved with', parsedQuestions.length, 'questions:', newModule._id);

    res.json({
      message: 'Module created successfully',
      module: newModule,
      questionCount: parsedQuestions.length
    });
  } catch (error) {
    console.error('Upload Error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Error creating module', error: error.message });
  }
});

// Update Module (Timer, Status, Batch)
router.patch('/modules/:id', authenticateAdmin, async (req, res) => {
  try {
    const { status, timer, assignedBatch } = req.body;
    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status === 'active') {
        updateData.activatedAt = new Date();
      }
    }
    if (timer) updateData.timer = Number(timer);
    if (assignedBatch) updateData.assignedBatch = assignedBatch;

    const updatedModule = await AssessmentModule.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    res.json(updatedModule);
  } catch (err) {
    res.status(500).json({ message: 'Error updating module' });
  }
});

// Delete Module
router.delete('/modules/:id', authenticateAdmin, async (req, res) => {
  try {
    const deletedModule = await AssessmentModule.findByIdAndDelete(req.params.id);
    if (!deletedModule) {
      return res.status(404).json({ message: 'Module not found' });
    }
    // Also delete associated submissions
    await Submission.deleteMany({ moduleId: req.params.id });
    res.json({ message: 'Module deleted successfully' });
  } catch (err) {
    console.error('Delete module error:', err);
    res.status(500).json({ message: 'Error deleting module' });
  }
});

// Append a new question to an existing module
router.post('/modules/:moduleId/questions', authenticateAdmin, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { qn, optionA, optionB, optionC, optionD, correctAnswer, explanation, questionType, optionType } = req.body;

    const module = await AssessmentModule.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const isTrueFalse = optionType === 'truefalse';
    const opts = isTrueFalse ? ['True', 'False'] : [optionA, optionB, optionC, optionD];
    const answerValue = isTrueFalse
      ? (correctAnswer === 'A' ? 'True' : 'False')
      : ({ A: optionA, B: optionB, C: optionC, D: optionD }[correctAnswer] || optionA);
    const qIndex = (module.module?.quiz?.length || 0) + 1;

    const newQuizQ = {
      id: `q${qIndex}`,
      qn,
      questionType: questionType || 'plain',
      optionType: optionType || 'multiple',
      questionImage: null,
      options: opts,
      answer: answerValue,
      explanation: explanation || ''
    };

    module.module.quiz.push(newQuizQ);
    module.questions.push({
      questionText: qn,
      questionType: questionType || 'plain',
      optionType: optionType || 'multiple',
      questionImage: null,
      options: {
        A: opts[0] || '',
        B: opts[1] || '',
        C: opts[2] || '',
        D: opts[3] || ''
      },
      correctAnswer: ['A', 'B', 'C', 'D'][opts.indexOf(answerValue)] || correctAnswer,
      correctValue: answerValue,
      explanation: explanation || ''
    });

    await module.save();
    res.json({ message: 'Question added successfully', module });
  } catch (err) {
    console.error('Add question error:', err);
    res.status(500).json({ message: 'Error adding question' });
  }
});

// Update a single question in a module
router.put('/modules/:moduleId/questions/:questionId', authenticateAdmin, async (req, res) => {
  try {
    const { moduleId, questionId } = req.params;
    const { qn, optionA, optionB, optionC, optionD, correctAnswer, explanation, questionType, optionType } = req.body;

    const module = await AssessmentModule.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const isTrueFalse = optionType === 'truefalse';
    const opts = isTrueFalse ? ['True', 'False'] : [optionA, optionB, optionC, optionD];
    const answerValue = isTrueFalse
      ? (correctAnswer === 'A' ? 'True' : 'False')
      : ({ A: optionA, B: optionB, C: optionC, D: optionD }[correctAnswer] || optionA);

    // Update in module.quiz
    const quizQuestion = module.module.quiz.id(questionId);
    if (quizQuestion) {
      quizQuestion.qn = qn;
      quizQuestion.questionType = questionType || quizQuestion.questionType;
      quizQuestion.optionType = optionType || quizQuestion.optionType;
      quizQuestion.options = opts;
      quizQuestion.answer = answerValue;
      quizQuestion.explanation = explanation || '';
    }

    // Update in questions array (backward compat)
    const oldQuestion = module.questions.id(questionId);
    if (oldQuestion) {
      oldQuestion.questionText = qn;
      oldQuestion.questionType = questionType || oldQuestion.questionType;
      oldQuestion.optionType = optionType || oldQuestion.optionType;
      oldQuestion.options = { A: opts[0] || '', B: opts[1] || '', C: opts[2] || '', D: opts[3] || '' };
      oldQuestion.correctAnswer = ['A', 'B', 'C', 'D'][opts.indexOf(answerValue)] || correctAnswer;
      oldQuestion.correctValue = answerValue;
      oldQuestion.explanation = explanation || '';
    }

    await module.save();
    res.json({ message: 'Question updated successfully', module });
  } catch (err) {
    console.error('Update question error:', err);
    res.status(500).json({ message: 'Error updating question' });
  }
});

// Delete a single question from a module
router.delete('/modules/:moduleId/questions/:questionId', authenticateAdmin, async (req, res) => {
  try {
    const { moduleId, questionId } = req.params;

    const module = await AssessmentModule.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Remove from module.quiz
    if (module.module && module.module.quiz) {
      module.module.quiz = module.module.quiz.filter(q => q._id.toString() !== questionId);
    }

    // Remove from questions array
    if (module.questions) {
      module.questions = module.questions.filter(q => q._id.toString() !== questionId);
    }

    await module.save();
    res.json({ message: 'Question deleted successfully', module });
  } catch (err) {
    console.error('Delete question error:', err);
    res.status(500).json({ message: 'Error deleting question' });
  }
});


// --- CLIENT / ASSESSMENT ---

// Fetch Questions for ACTIVE module(s)
router.get('/questions', async (req, res) => {
  try {
    const activeModule = await AssessmentModule.findOne({ status: 'active' });

    if (!activeModule) {
      return res.json([]);
    }

    let questionsToReturn = [];

    if (activeModule.module && activeModule.module.quiz && activeModule.module.quiz.length > 0) {
      questionsToReturn = activeModule.module.quiz.map(q => ({
        _id: q._id,
        questionText: q.qn,
        questionImage: q.questionImage,
        options: {
          A: q.options[0],
          B: q.options[1],
          C: q.options[2],
          D: q.options[3]
        },
        correctAnswer: ['A', 'B', 'C', 'D'][q.options.indexOf(q.answer)] || 'A',
        correctValue: q.answer,
        explanation: q.explanation
      }));
    } else if (activeModule.questions && activeModule.questions.length > 0) {
      questionsToReturn = activeModule.questions;
    }

    res.json(questionsToReturn);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Error fetching questions' });
  }
});

// Helper to get active assessment metadata for a specific batch
router.get('/active-assessment/:batch', async (req, res) => {
  try {
    const { batch } = req.params;
    const activeModule = await AssessmentModule.findOne({
      status: 'active',
      assignedBatch: batch
    });

    if (activeModule) {
      res.json(activeModule);
    } else {
      res.status(404).json({ message: "No active assessment for your batch" });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error fetching active assessment' });
  }
});

// Fetch Questions for a specific module (used after login + dashboard)
router.get('/questions/:moduleId', async (req, res) => {
  try {
    const module = await AssessmentModule.findById(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    let questionsToReturn = [];

    if (module.module && module.module.quiz && module.module.quiz.length > 0) {
      questionsToReturn = module.module.quiz.map(q => ({
        _id: q._id,
        questionText: q.qn,
        questionType: q.questionType || 'plain',
        optionType: q.optionType || 'multiple',
        questionImage: q.questionImage,
        options: {
          A: q.options[0],
          B: q.options[1],
          C: q.options[2] || null,
          D: q.options[3] || null
        },
        correctAnswer: ['A', 'B', 'C', 'D'][q.options.indexOf(q.answer)] || 'A',
        correctValue: q.answer,
        explanation: q.explanation
      }));
    } else if (module.questions && module.questions.length > 0) {
      questionsToReturn = module.questions;
    }

    res.json(questionsToReturn);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Error fetching questions' });
  }
});


// --- SUBMISSIONS ---
router.post('/submit', authenticateCandidate, async (req, res) => {
  console.log('Submission Received:', req.body.userName);
  try {
    const { answers, userName, batch, feedback, moduleId } = req.body;

    if (!moduleId) {
      return res.status(400).json({ message: 'Module ID is required' });
    }

    const module = await AssessmentModule.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const totalModuleQuestions = (module.module && module.module.quiz && module.module.quiz.length > 0)
      ? module.module.quiz.length
      : module.questions.length;

    const questionMap = {};
    if (module.questions) {
      module.questions.forEach(q => {
        questionMap[q._id.toString()] = {
          correctAnswer: q.correctAnswer,
          ...q.toObject()
        };
      });
    }
    if (module.module && module.module.quiz) {
      module.module.quiz.forEach(q => {
        const mappedQ = {
          correctAnswer: ['A', 'B', 'C', 'D'][q.options.indexOf(q.answer)] || 'A',
          ...q.toObject()
        };
        questionMap[q._id.toString()] = mappedQ;
      });
    }

    let correct = 0, wrong = 0;
    const processedAnswers = [];

    answers.forEach(ans => {
      const q = questionMap[ans.questionId];
      if (q) {
        if (ans.selectedOption === q.correctAnswer) correct++;
        else if (ans.selectedOption) wrong++;

        processedAnswers.push({
          questionId: ans.questionId,
          selectedOption: ans.selectedOption,
          isCorrect: q ? ans.selectedOption === q.correctAnswer : false
        });
      }
    });

    const unattended = totalModuleQuestions - (correct + wrong);
    const score = (correct * 1) + (wrong * -1);

    const newSubmission = new Submission({
      userName, batch, moduleId, score, correct, wrong, unattended,
      totalQuestions: totalModuleQuestions, answers: processedAnswers, feedback
    });
    await newSubmission.save();
    console.log(`Submission Saved: ${userName} (${batch}) - Score: ${score}`);
    res.json({
      message: 'Success',
      result: { score, correct, wrong, unattended },
      submissionId: newSubmission._id
    });
  } catch (err) {
    console.error('Submission Error:', err);
    res.status(500).json({ message: 'Error' });
  }
});

router.get('/submissions', authenticateAdmin, async (req, res) => {
  try {
    const subs = await Submission.find().sort({ submittedAt: -1 });
    console.log(`Fetched ${subs.length} submissions`);
    res.json(subs);
  } catch (err) {
    console.error('Error fetching submissions:', err);
    res.status(500).json({ message: 'Error fetching submissions' });
  }
});

router.get('/candidate-submissions/:userName', authenticateCandidate, async (req, res) => {
  try {
    const { userName } = req.params;
    const subs = await Submission.find({ userName }).sort({ submittedAt: -1 });
    res.json(subs);
  } catch (err) {
    console.error('Error fetching candidate submissions:', err);
    res.status(500).json({ message: 'Error' });
  }
});

// Get assessment report by submission ID
router.get('/assessment-report/:submissionId', async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const module = await AssessmentModule.findById(submission.moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    let moduleQuestions = [];
    if (module.module && module.module.quiz && module.module.quiz.length > 0) {
      moduleQuestions = module.module.quiz.map(q => ({
        _id: q._id,
        questionText: q.qn,
        questionImage: q.questionImage,
        options: {
          A: q.options[0],
          B: q.options[1],
          C: q.options[2],
          D: q.options[3]
        },
        correctAnswer: ['A', 'B', 'C', 'D'][q.options.indexOf(q.answer)] || 'A',
        correctValue: q.answer,
        explanation: q.explanation
      }));
    } else {
      moduleQuestions = module.questions;
    }

    const report = moduleQuestions.map(q => {
      const ans = submission.answers.find(a => a.questionId.toString() === q._id.toString());

      return {
        questionText: q.questionText,
        questionImage: q.questionImage,
        options: q.options,
        userAnswer: ans ? ans.selectedOption : null,
        correctAnswer: q.correctAnswer,
        correctValue: q.correctValue,
        explanation: q.explanation,
        isCorrect: ans ? ans.isCorrect : false
      };
    });

    res.json({
      userName: submission.userName,
      batch: submission.batch,
      score: submission.score,
      totalQuestions: submission.totalQuestions,
      correct: submission.correct,
      wrong: submission.wrong,
      submittedAt: submission.submittedAt,
      report
    });
  } catch (err) {
    console.error('Error fetching assessment report:', err);
    res.status(500).json({ message: 'Error fetching report' });
  }
});

module.exports = router;
