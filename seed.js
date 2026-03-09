require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Slot = require('./models/Slot');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mit-scholarship';

const seedData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await Slot.deleteMany();
        await Admin.deleteMany();

        // Seed Admin
        await Admin.create({
            username: 'mitadmin',
            password: 'mitpassword123'
        });
        console.log('Admin seeded: mitadmin / mitpassword123');

        // Seed Slots
        const dates = ['25 Mar 2024', '26 Mar 2024'];
        const times = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM'];
        
        for (const date of dates) {
            for (const time of times) {
                await Slot.create({
                    date,
                    time,
                    capacity: 10
                });
            }
        }
        console.log('Slots seeded successfully');
        
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedData();
