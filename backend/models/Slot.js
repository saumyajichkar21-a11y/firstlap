const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
    date: {
        type: String, // Stored as DD MMM YYYY, e.g., '25 Mar 2024'
        required: true
    },
    time: {
        type: String, // e.g., '09:00 AM'
        required: true
    },
    capacity: {
        type: Number,
        default: 10
    },
    bookedCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Virtual for checking if slot is full
slotSchema.virtual('isFull').get(function() {
    return this.bookedCount >= this.capacity;
});

// Ensure that we get virtuals when converting to JSON
slotSchema.set('toJSON', { virtuals: true });
slotSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Slot', slotSchema);
