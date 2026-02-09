const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const users = [
    {
        username: 'Admin User',
        email: 'admin@cybershield.io',
        password: process.env.DEFAULT_ADMIN_PASSWORD || 'adminpassword123',
        role: 'admin'
    },
    {
        username: 'SOC Analyst',
        email: 'analyst@cybershield.io',
        password: process.env.DEFAULT_ANALYST_PASSWORD || 'analystpassword123',
        role: 'user'
    }
];

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/cybershield');

        console.log('MongoDB Connected');

        await User.deleteMany({}); // Clear existing users
        console.log('Existing users cleared');

        for (const user of users) {
            // The User model pre-save hook will hash the password
            await User.create(user);
        }

        console.log('Users seeded successfully');
        console.log('-----------------------------------');
        console.log('Admin Email: admin@cybershield.io');
        console.log(`Admin Password: ${process.env.DEFAULT_ADMIN_PASSWORD || 'adminpassword123'}`);
        console.log('-----------------------------------');
        console.log('Analyst Email: analyst@cybershield.io');
        console.log(`Analyst Password: ${process.env.DEFAULT_ANALYST_PASSWORD || 'analystpassword123'}`);
        console.log('-----------------------------------');

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedUsers();
