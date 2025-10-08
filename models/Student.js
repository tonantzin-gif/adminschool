const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  major: {
    type: String,
    required: true,
  },
  matricula: {
    type: String,
    required: true,
    unique: true,
  },
  yearOfAdmission: {
    type: Number,
    required: true,
  },
  group: {
    type: String,
    required: true,
  },
  grade: {
    type: String,
    required: true,
  },
  paymentDetails: [
    {
      folioType: {
        type: String,
        enum: ['Inscripcion', 'Cuatrimestre', 'Seguro escolar', 'Seguro por estadia'],
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      date: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
      },
      pdfFile: {
        type: String, // Stores filename of the PDF
      },
    },
  ],
});

module.exports = mongoose.model('Student', StudentSchema);
