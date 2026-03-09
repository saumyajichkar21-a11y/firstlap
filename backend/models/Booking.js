const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    studentName: {
        type: String,
        required: true,
        trim: true
    },
    rollNumber: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    department: {
        type: String,
        required: true,
        enum: ['Computer Science', 'Information Technology', 'Mechanical', 'Civil', 'Electrical', 'Artificial Intelligence', 'Other']
    },
    year: {
        type: String,
        required: true,
        enum: ['First Year', 'Second Year', 'Third Year', 'Fourth Year']
    },
    scholarshipType: {
        type: String,
        required: true,
        enum: ['EBC', 'OBC_SBC_VJNT', 'SC_ST', 'Minority', 'Other']
    },
    contactNumber: {
        type: String,
        required: true,
        trim: true
    },
    slotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Slot',
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Verified', 'Cancelled'],
        default: 'Pending'
    },
    ticketId: {
        type: String,
        unique: true
    }
}, { timestamps: true });

// Pre-save hook to generate ticket ID
bookingSchema.pre('save', function(next) {
    if (!this.ticketId) {
        // Generate a random ticket ID like MIT-1234
        this.ticketId = 'MIT-' + Math.floor(1000 + Math.random() * 9000);
    }
    
});

module.exports = mongoose.model('Booking', bookingSchema);
