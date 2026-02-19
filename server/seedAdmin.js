/**
 * Seed Admin Script
 * Usage: node seedAdmin.js <username> <password>
 * Example: node seedAdmin.js admin admin123
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

const MONGO_URI = process.env.MONGO_URI;

const args = process.argv.slice(2);
if (args.length < 2) {
    console.error('Usage: node seedAdmin.js <username> <password>');
    process.exit(1);
}

const [username, password] = args;

async function seedAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected');

        // Check if admin already exists
        const existing = await Admin.findOne({ username });
        if (existing) {
            console.log(`Admin "${username}" already exists. Updating password...`);
            existing.password = await bcrypt.hash(password, 10);
            await existing.save();
            console.log('Password updated successfully.');
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);
            const admin = new Admin({ username, password: hashedPassword });
            await admin.save();
            console.log(`Admin "${username}" created successfully.`);
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Error seeding admin:', err);
        process.exit(1);
    }
}

seedAdmin();
