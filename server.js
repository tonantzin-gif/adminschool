require('dotenv').config();
console.log('dotenv config loaded', process.env.JWT_SECRET);
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const path = require('path');



// Middleware
app.use(express.json());

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static('uploads'));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
// app.use('/api/folios', require('./routes/folios')); // Removed as folio functionality is integrated into students
app.use('/api/admin', require('./routes/admin'));
app.use('/api/students', require('./routes/students'));
// app.use('/api/payments', require('./routes/payments')); // Removed as payments are now part of student details

const PORT = process.env.PORT || 3000;

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/schooladmin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected...'))
.catch(err => console.error(err));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET}`);
});
