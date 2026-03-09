const express = require('express');
const router = express.Router();
const Slot = require('../models/Slot');
const { protect } = require('../middleware/auth');

// @route   GET /api/slots
// @desc    Get all active slots
// @access  Public
router.get('/', async (req, res) => {
    try {
        const slots = await Slot.find({ isActive: true }).sort({ date: 1, time: 1 });
        
        // Return computed 'isFull' field for UI handling
        res.json(slots);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/slots
// @desc    Create new slots
// @access  Private (Admin)
router.post('/', protect, async (req, res) => {
    try {
        const { date, time, capacity } = req.body;
        
        const slotExists = await Slot.findOne({ date, time });
        if (slotExists) {
            return res.status(400).json({ message: 'Slot already exists for this date and time' });
        }

        const slot = await Slot.create({
            date,
            time,
            capacity: capacity || 10
        });

        res.status(201).json(slot);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
