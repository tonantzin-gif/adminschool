const express = require('express');
const router = express.Router();
const path = require('path'); // Import path module
const multer = require('multer'); // Import multer
const Student = require('../models/Student');
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/students_pdfs'); // Files will be stored in 'uploads/students_pdfs' folder
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// Filter to accept only PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// @route   POST api/students
// @desc    Add new student with optional PDF upload
// @access  Private (Admin only)
router.post('/', [auth, admin, upload.single('pdfFile')], async (req, res) => {
  const { name, lastName, major, matricula, yearOfAdmission, group, grade, folioType, amount, status } = req.body;
  const pdfFileName = req.file ? req.file.filename : null; // Get filename if uploaded

  try {
    const newStudent = new Student({
      name,
      lastName,
      major,
      matricula,
      yearOfAdmission,
      group,
      grade,
    });

    if (folioType && amount) {
      newStudent.paymentDetails.push({
        folioType,
        amount: parseFloat(amount), // Ensure amount is a number
        status: status || 'pending', // Default to pending if not provided
        pdfFile: pdfFileName,
      });
    }

    const student = await newStudent.save();
    res.json(student);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/students
// @desc    Get all students with optional search
// @access  Private (Admin only)
router.get('/', [auth, admin], async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i'); // Case-insensitive search
      query = {
        $or: [
          { name: searchRegex },
          { lastName: searchRegex },
          { major: searchRegex },
          { matricula: searchRegex },
          { group: searchRegex },
          { grade: searchRegex },
        ],
      };
    }

    const students = await Student.find(query);
    res.json(students);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/students/:id
// @desc    Get student by ID
// @access  Private (Admin only)
router.get('/:id', [auth, admin], async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }
    res.json(student);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Student not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/students/:id
// @desc    Update student
// @access  Private (Admin only)
router.put('/:id', [auth, admin, upload.single('pdfFile')], async (req, res) => {
  const { name, lastName, major, matricula, yearOfAdmission, group, grade, folioType, amount, status } = req.body;
  const pdfFileName = req.file ? req.file.filename : null; // Get filename if uploaded

  // Build student object
  const studentFields = {};
  if (name) studentFields.name = name;
  if (lastName) studentFields.lastName = lastName;
  if (major) studentFields.major = major;
  if (matricula) studentFields.matricula = matricula;
  if (yearOfAdmission) studentFields.yearOfAdmission = yearOfAdmission;
  if (group) studentFields.group = group;
  if (grade) studentFields.grade = grade;

  try {
    let student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    // Handle paymentDetails update/addition
    if (folioType && amount) {
      // For simplicity, we'll add a new payment detail. 
      // A more complex solution would allow updating existing ones based on a paymentDetailId.
      student.paymentDetails.push({
        folioType,
        amount: parseFloat(amount),
        status: status || 'pending',
        pdfFile: pdfFileName,
      });
    }

    student = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: studentFields, paymentDetails: student.paymentDetails }, // Update both simple fields and paymentDetails array
      { new: true }
    );
    res.json(student);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Student not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/students/:id
// @desc    Delete student
// @access  Private (Admin only)
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ msg: 'Student not found' });
    }

    await Student.findByIdAndDelete(req.params.id); // Changed from findByIdAndRemove
    res.json({ msg: 'Student removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Student not found' });
    }
    res.status(500).json({ msg: 'Server Error' }); // Changed to send JSON error
  }
});

module.exports = router;
