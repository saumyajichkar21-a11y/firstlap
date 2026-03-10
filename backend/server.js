require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/slots', require('./routes/slots'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/admin', require('./routes/admin'));

// Add a basic route for testing
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'MIT Scholarship API is running' });
});

// Start Server & Connect to DB
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mit-scholarship';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        
        // Start Background Cron Jobs
        require('./cron').startCronJobs();

        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });

