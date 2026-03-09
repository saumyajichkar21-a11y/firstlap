const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const { protect } = require('../middleware/auth');

// @route   POST /api/bookings
// @desc    Create a new slot booking
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { studentName, rollNumber, department, year, scholarshipType, contactNumber, slotId } = req.body;

        // Verify that slot exists
        const slot = await Slot.findById(slotId);
        if (!slot) {
            return res.status(404).json({ message: 'Slot not found' });
        }

        // Check availability
        if (slot.isFull) {
            return res.status(400).json({ message: 'Selected slot is already full' });
        }

        // Check if student already booked for this specific type (simplified check)
        const alreadyBooked = await Booking.findOne({ rollNumber, status: { $in: ['Pending', 'Verified'] } });
        if (alreadyBooked) {
             return res.status(400).json({ message: 'This Roll Number already has an active appointment' });
        }

        // Create booking
        const booking = await Booking.create({
            studentName,
            rollNumber,
            department,
            year,
            scholarshipType,
            contactNumber,
            slotId
        });

        // Increment slot booking count
        slot.bookedCount += 1;
        await slot.save();

        // Populate slot info for the confirmation return
        const populatedBooking = await Booking.findById(booking._id).populate('slotId', 'date time');

        res.status(201).json(populatedBooking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/bookings
// @desc    Get all bookings
// @access  Private (Admin)
router.get('/', protect, async (req, res) => {
    try {
        const bookings = await Booking.find().populate('slotId', 'date time').sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   PUT /api/bookings/:id
// @desc    Update booking status (Verify/Cancel)
// @access  Private (Admin)
router.put('/:id', protect, async (req, res) => {
    try {
        const { status } = req.body;
        
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // If cancelling a pending/verified booking, free up the slot
        if (status === 'Cancelled' && booking.status !== 'Cancelled') {
            await Slot.findByIdAndUpdate(booking.slotId, { $inc: { bookedCount: -1 } });
        } 
        // If reactivating a cancelled booking, consume the slot again
        else if (booking.status === 'Cancelled' && (status === 'Pending' || status === 'Verified')) {
            await Slot.findByIdAndUpdate(booking.slotId, { $inc: { bookedCount: 1 } });
        }

        booking.status = status;
        await booking.save();

        res.json(booking);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
