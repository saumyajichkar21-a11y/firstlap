const cron = require('node-cron');
const twilio = require('twilio');
const moment = require('moment');
const Booking = require('./models/Booking');

// Initialize Twilio Client (requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN in env)
const twilioClient = process.env.TWILIO_ACCOUNT_SID ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;

const startCronJobs = () => {
    // Run every 5 minutes to check for upcoming appointments
    cron.schedule('*/5 * * * *', async () => {
        console.log('[CRON] Checking for upcoming bookings to send reminders...');
        try {
            // Find bookings that are Verified and reminder has not been sent yet
            const upcomingBookings = await Booking.find({ status: 'Verified', reminderSent: false }).populate('slotId');
            
            const now = moment();
            
            for (const booking of upcomingBookings) {
                if (!booking.slotId) continue;

                // Slot format: '10:00 AM - 11:00 AM', extract start time for notification calculation
                const startTimeString = booking.slotId.time.split(' - ')[0];
                const slotDateTime = moment(`${booking.slotId.date} ${startTimeString}`, 'DD MMM YYYY hh:mm A');
                
                // Calculate difference in minutes between now and the slot
                const diffMinutes = slotDateTime.diff(now, 'minutes');
                
                // If it's starting in fewer than 60 minutes, and hasn't completely passed
                if (diffMinutes > 0 && diffMinutes <= 60) {
                    let reminderText = `Reminder: Your MIT Scholarship Verification is scheduled for ${booking.slotId.date} at ${startTimeString}. Ticket #: ${booking.ticketId}. Please bring all required documents.`;
                    
                    // 1. Send SMS (if Twilio is configured)
                    try {
                        if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
                            await twilioClient.messages.create({
                                body: reminderText,
                                from: process.env.TWILIO_PHONE_NUMBER,
                                to: '+91' + booking.contactNumber // Assumes India country code
                            });
                            console.log(`[CRON] SMS sent to ${booking.studentName} (${booking.contactNumber})`);
                        }
                    } catch (smsErr) {
                        console.error(`[CRON] Failed to send SMS to ${booking.contactNumber}:`, smsErr.message);
                    }

                    // Mark as sent so we don't spam the student every 5 minutes
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
