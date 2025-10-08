const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const admin = require('../middleware/adminMiddleware');
const User = require('../models/User');
const Student = require('../models/Student');
// const Payment = require('../models/Payment'); // Removed as payments are now part of student details

// Get all folios (admin only)
// These routes are no longer needed as folio information is integrated into student details.
// router.get('/folios', auth, admin, async (req, res) => {
//   try {
//     const folios = await Folio.find().populate('user', ['username', 'role']);
//     res.json(folios);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server error');
//   }
// });

// Get folios by user ID (admin only)
// router.get('/folios/user/:userId', auth, admin, async (req, res) => {
//   try {
//     const folios = await Folio.find({ user: req.params.userId }).populate('user', ['username', 'role']);
//     res.json(folios);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server error');
//   }
// });

// Get all users (admin only)
router.get('/users', auth, admin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router; // Moved to end of file

// @route   GET api/admin/search
// @desc    General search across all models
// @access  Private (Admin only)
router.get('/search', [auth, admin], async (req, res) => {
  const { query } = req.query;
  const searchRegex = new RegExp(query, 'i');
  const results = {};

  try {
    // Search Users (username)
    const users = await User.find({ username: searchRegex }).select('-password');
    results.users = users;

    // Search Students (name, lastName, matricula, major, group, grade, paymentDetails.folioType, paymentDetails.pdfFile)
    const students = await Student.find({
      $or: [
        { name: searchRegex },
        { lastName: searchRegex },
        { matricula: searchRegex },
        { major: searchRegex },
        { group: searchRegex },
        { grade: searchRegex },
        { 'paymentDetails.folioType': searchRegex }, // Search within paymentDetails
        { 'paymentDetails.pdfFile': searchRegex },   // Search within paymentDetails
      ],
    });
    results.students = students;

    // Search Folios (now integrated into students, so this section might become obsolete or simplified)
    // const folios = await Folio.find({
    //   $or: [
    //     { folioType: searchRegex },
    //     { fileName: searchRegex },
    //   ],
    // }).populate('user', ['username']);
    // results.folios = folios;

    // Search Payments (now integrated into students, so this section might become obsolete or simplified)
    // const payments = await Payment.find({
    //   $or: [
    //     { paymentFolio: searchRegex },
    //   ],
    // }).populate('student', ['name', 'lastName', 'matricula']);

    // Further filter payments if student data is populated and matches
    // const filteredPayments = payments.filter(payment => {
    //   if (payment.student) {
    //     return searchRegex.test(payment.student.name) || 
    //            searchRegex.test(payment.student.lastName) ||
    //            searchRegex.test(payment.student.matricula);
    //   } 
    //   return searchRegex.test(payment.paymentFolio);
    // });
    // results.payments = filteredPayments;

    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
