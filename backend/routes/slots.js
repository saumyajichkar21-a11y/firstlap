const express = require('express');
const router = express.Router();
const Slot = require('../models/Slot');
const { protect } = require('../middleware/auth');
const moment = require('moment');

// @route   GET /api/slots
// @desc    Get all active upcoming slots
// @access  Public
router.get('/', async (req, res) => {
    try {
        const slots = await Slot.find({ isActive: true }).sort({ date: 1, time: 1 });
        
        // Filter out past slots
        const now = moment();
        const upcomingSlots = slots.filter(slot => {
            // time format is "10:00 AM - 11:00 AM". Extract the start time.
            const startTimeString = slot.time.split(' - ')[0] || slot.time;
            const slotDateTime = moment(`${slot.date} ${startTimeString}`, 'DD MMM YYYY hh:mm A');
            return slotDateTime.isAfter(now);
        });

        // Return computed 'isFull' field for UI handling (virtuals are handled automatically by Mongoose via toJSON config)
        res.json(upcomingSlots);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/slots
// @desc    Create new blocks of 1-hour slots for a specific date
// @access  Private (Admin)
router.post('/', protect, async (req, res) => {
    try {
        const { date, capacity } = req.body;
        
        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }

        const timeIntervals = [
            '10:00 AM - 11:00 AM',
            '11:00 AM - 12:00 PM',
            '01:30 PM - 02:30 PM',
            '02:30 PM - 03:30 PM',
            '03:30 PM - 04:30 PM'
        ];

        let createdCount = 0;
        let skippedCount = 0;

        for (const time of timeIntervals) {
            const slotExists = await Slot.findOne({ date, time });
            if (!slotExists) {
                await Slot.create({
                    date,
                    time,
                    capacity: capacity || 10
                });
                createdCount++;
            } else {
                skippedCount++;
            }
        }

        res.status(201).json({ message: `Successfully created ${createdCount} slots. Skipped ${skippedCount} existing slots.`, createdCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
