const cron = require('node-cron');
const twilio = require('twilio');
const moment = require('moment');
const Booking = require('./models/Booking');
const Slot = require('./models/Slot');

// Initialize Twilio Client (requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN in env)
const twilioClient = process.env.TWILIO_ACCOUNT_SID ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;

// The 5 time blocks per day (10 AM - 4 PM, skipping 12:30-1:30 lunch)
const TIME_INTERVALS = [
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '01:30 PM - 02:30 PM',
    '02:30 PM - 03:30 PM',
    '03:30 PM - 04:30 PM'
];

// Auto-generate slots for the next 7 days if they don't already exist
const generateUpcomingSlots = async () => {
    console.log('[SLOTS] Checking and generating slots for the next 7 days...');
    try {
        let created = 0;
        for (let i = 0; i < 7; i++) {
            const date = moment().add(i, 'days').format('DD MMM YYYY');
            for (const time of TIME_INTERVALS) {
                const exists = await Slot.findOne({ date, time });
                if (!exists) {
                    await Slot.create({ date, time, capacity: 10 });
                    created++;
                }
            }
        }
        console.log(`[SLOTS] Done. ${created} new slot(s) created.`);
    } catch (err) {
        console.error('[SLOTS] Error generating slots:', err.message);
    }
};

const startCronJobs = () => {
    // Generate upcoming slots immediately on startup
    generateUpcomingSlots();

    // Then re-generate every day at midnight to add the next day's slots
    cron.schedule('0 0 * * *', () => {
        console.log('[CRON] Midnight: generating new day slots...');
        generateUpcomingSlots();
    });

    // Run every 5 minutes to check for upcoming appointments and send SMS
    cron.schedule('*/5 * * * *', async () => {
        try {
            const upcomingBookings = await Booking.find({ status: { $in: ['Pending', 'Verified'] }, reminderSent: false }).populate('slotId');
            const now = moment();

            for (const booking of upcomingBookings) {
                if (!booking.slotId) continue;
                const startTimeString = booking.slotId.time.split(' - ')[0];
                const slotDateTime = moment(`${booking.slotId.date} ${startTimeString}`, 'DD MMM YYYY hh:mm A');
                const diffMinutes = slotDateTime.diff(now, 'minutes');

                if (diffMinutes > 0 && diffMinutes <= 60) {
                    const reminderText = `Reminder: Your MIT Scholarship Verification is scheduled for ${booking.slotId.date} at ${startTimeString}. Ticket #: ${booking.ticketId}. Please bring all required documents.`;

                    try {
                        if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
                            await twilioClient.messages.create({
                                body: reminderText,
                                from: process.env.TWILIO_PHONE_NUMBER,
                                to: '+91' + booking.contactNumber
                            });
                            console.log(`[CRON] SMS sent to ${booking.studentName} (${booking.contactNumber})`);
                        }
                    } catch (smsErr) {
                        console.error(`[CRON] Failed to send SMS to ${booking.contactNumber}:`, smsErr.message);
                    }

                    booking.reminderSent = true;
                    await booking.save();
                }
            }
        } catch (error) {
            console.error('[CRON] Error running reminder cron job:', error);
        }
    });

    console.log('[CRON] Reminder background worker scheduled. (Runs every 5 mins)');
};

module.exports = { startCronJobs };

