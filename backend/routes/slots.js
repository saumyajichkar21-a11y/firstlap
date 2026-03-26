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
        const slots = await Slot.find({ isActive: true });
        
        // Filter out past slots and sort chronologically
        const now = moment();
        const upcomingSlots = slots.filter(slot => {
            const startTimeString = slot.time.split(' - ')[0] || slot.time;
            const slotDateTime = moment(`${slot.date} ${startTimeString}`, 'DD MMM YYYY hh:mm A');
            return slotDateTime.isAfter(now);
        }).sort((a, b) => {
            const timeA = moment(`${a.date} ${a.time.split(' - ')[0]}`, 'DD MMM YYYY hh:mm A');
            const timeB = moment(`${b.date} ${b.time.split(' - ')[0]}`, 'DD MMM YYYY hh:mm A');
            return timeA - timeB;
        });

        res.json(upcomingSlots);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/slots/all
// @desc    Get upcoming 7 valid working days of slots for management
// @access  Private (Admin)
router.get('/all', protect, async (req, res) => {
    try {
        const slots = await Slot.find();
        
        const now = moment().startOf('day');
        // We'll calculate the 7th working day from today
        let workingDaysCount = 0;
        let dayOffset = 0;
        let lastWorkingDay = moment();

        while (workingDaysCount < 7) {
            let d = moment().add(dayOffset, 'days');
            if (d.day() !== 0 && d.day() !== 6) {
                workingDaysCount++;
                lastWorkingDay = d;
            }
            dayOffset++;
            if (dayOffset > 30) break; // Safety
        }

        const horizon = lastWorkingDay.endOf('day');

        // Filter for upcoming working days within horizon and sort chronologically
        const filteredSlots = slots.filter(slot => {
            const startTimeString = slot.time.split(' - ')[0] || slot.time;
            const slotDateTime = moment(`${slot.date} ${startTimeString}`, 'DD MMM YYYY hh:mm A');
            
            // Only show slots that are:
            // 1. Not in the past (using startOf('minute') for immediate future check)
            // 2. Before or on the 7th working day horizon
            return slotDateTime.isSameOrAfter(moment(), 'minute') && slotDateTime.isSameOrBefore(horizon);
        }).sort((a, b) => {
            const timeA = moment(`${a.date} ${a.time.split(' - ')[0]}`, 'DD MMM YYYY hh:mm A');
            const timeB = moment(`${b.date} ${b.time.split(' - ')[0]}`, 'DD MMM YYYY hh:mm A');
            return timeA - timeB;
        });

        res.json(filteredSlots);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PATCH /api/slots/:id/toggle
// @desc    Toggle slot active status
// @access  Private (Admin)
router.patch('/:id/toggle', protect, async (req, res) => {
    try {
        const slot = await Slot.findById(req.params.id);
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }
        
        slot.isActive = !slot.isActive;
        await slot.save();
        
        res.json({ message: `Slot ${slot.isActive ? 'activated' : 'deactivated'}`, slot });
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
