const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load env vars
dotenv.config();

const restoreAdmin = async () => {
    try {
        console.log('Connecting to MongoDB...');
        // Use the same URI logic as in the app or seed script
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/cybershield';
        await mongoose.connect(mongoUri);
        console.log(`MongoDB Connected to ${mongoUri}`);

        const adminEmail = 'admin@cybershield.io';
        let adminUser = await User.findOne({ email: adminEmail });

        if (adminUser) {
            console.log('Admin user found. Resetting role and password...');
            adminUser.username = 'Admin'; // Ensure username is correct too
            adminUser.role = 'admin';
            adminUser.password = process.env.DEFAULT_ADMIN_PASSWORD || 'adminpassword123';
            // The User model's pre-save hook checks isModified('password') and hashes it
            await adminUser.save();
            console.log('Admin user updated successfully.');
        } else {
            console.log('Admin user not found. Creating new admin user...');
            await User.create({
                username: 'Admin',
                email: adminEmail,
                password: process.env.DEFAULT_ADMIN_PASSWORD || 'adminpassword123',
                role: 'admin'
            });
            console.log('Admin user created successfully.');
        }

        console.log('-----------------------------------');
        console.log('Admin Email: admin@cybershield.io');
        console.log(`Admin Password: ${process.env.DEFAULT_ADMIN_PASSWORD || 'adminpassword123'}`);
        console.log('-----------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('Error creating/updating admin user:', error);
        process.exit(1);
    }
};

restoreAdmin();
