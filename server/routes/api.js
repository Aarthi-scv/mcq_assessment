const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const AssessmentModule = require('../models/AssessmentModule');
const Submission = require('../models/Submission');
const User = require('../models/User');
const { parseMCQ } = require('../utils/parser');

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

// Register Student
router.post('/register', async (req, res) => {
  try {
    const { name, email, batch } = req.body;
    
    // Simple check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({ name, email, batch });
    await user.save();
    res.json({ message: 'Registration successful', user });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login Student
router.post('/login', async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findOne({ name, email });
    
    if (!user) {
      return res.status(404).json({ message: 'Invalid credentials or user not found' });
    }

    res.json({ message: 'Login successful', user });
  } catch (err) {
    res.status(500).json({ message: 'Login error' });
  }
});

// --- MODULES ---

// Get all modules
router.get('/modules', async (req, res) => {
  try {
    const modules = await AssessmentModule.find().sort({ createdAt: -1 });
    console.log(`Fetched ${modules.length} modules`);
    res.json(modules);
  } catch (err) {
    console.error('Error fetching modules:', err);
    res.status(500).json({ message: 'Error fetching modules' });
  }
});

// Create Module & Upload Questions (ZIP with JSON and Images)
router.post('/upload', upload.single('file'), async (req, res) => {
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
          // Look for image in images/ folder or anywhere in zip
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

        // Return the new structure
        return qn;
      });

      console.log('Actually parsed questions count:', parsedQuestions.length);

      // Cleanup ZIP file
      fs.unlinkSync(req.file.path);
    } else {
      console.log('WARNING: No file uploaded!');
    }

    // 2. Create Module with embedded questions
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
        labs: [], // User said "after labs key", implying it exists
        quiz: parsedQuestions
      },
      // For backward compatibility with existing frontend
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
router.patch('/modules/:id', async (req, res) => {
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


// --- CLIENT / ASSESSMENT ---

// Fetch Questions for ACTIVE module(s)
// Or user might select a module? 
// "Start Assessment" usually implies the active one.
// Let's fetch questions for the first 'active' module found.
router.get('/questions', async (req, res) => {
  try {
    // Find an active module
    const activeModule = await AssessmentModule.findOne({ status: 'active' });
    
    if (!activeModule) {
      return res.json([]); // No active assessment
    }

    let questionsToReturn = [];

    // Prioritize the new 'module.quiz' structure if available
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
      // Fallback to old structure
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
        // Find an active module that is assigned to this batch
        const activeModule = await AssessmentModule.findOne({ 
            status: 'active',
            assignedBatch: batch 
        });
        
        if(activeModule) {
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

    // Prioritize the new 'module.quiz' structure if available
    if (module.module && module.module.quiz && module.module.quiz.length > 0) {
      questionsToReturn = module.module.quiz.map(q => ({
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
    } else if (module.questions && module.questions.length > 0) {
      // Fallback to old structure
      questionsToReturn = module.questions;
    }

    res.json(questionsToReturn); 
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Error fetching questions' });
  }
});


// --- SUBMISSIONS ---
router.post('/submit', async (req, res) => {
    console.log('Submission Received:', req.body.userName);
    try {
      const { answers, userName, batch, feedback, moduleId } = req.body; 
      
      if (!moduleId) {
        return res.status(400).json({ message: 'Module ID is required' });
      }

      // Fetch the module with its embedded questions
      const module = await AssessmentModule.findById(moduleId);
      if (!module) {
        return res.status(404).json({ message: 'Module not found' });
      }

      const totalModuleQuestions = (module.module && module.module.quiz && module.module.quiz.length > 0) 
        ? module.module.quiz.length 
        : module.questions.length;
      
      // Create a map of questions by their _id for quick lookup
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
          // Map new structure to old comparison format
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

router.get('/submissions', async (req, res) => {
  try {
    const subs = await Submission.find().sort({ submittedAt: -1 });
    console.log(`Fetched ${subs.length} submissions`);
    res.json(subs);
  } catch (err) {
    console.error('Error fetching submissions:', err);
    res.status(500).json({ message: 'Error fetching submissions' });
  }
});

router.get('/candidate-submissions/:userName', async (req, res) => {
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
    
    // Get submission
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Get the module with its questions
    const module = await AssessmentModule.findById(submission.moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Build report with all questions from module
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
