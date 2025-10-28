/**
 * Seed Database with Admin User
 * Run this once to create an admin user for manual client onboarding
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('./logger');

const ADMIN_EMAIL = 'admin@richytech.inc';
const ADMIN_PASSWORD = 'Admin@123456'; // Change this after first login!

async function seedAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      console.log('\n⚠️  Admin user already exists!');
      console.log(`Email: ${ADMIN_EMAIL}`);
      console.log('If you forgot the password, delete this user from MongoDB and run this script again.\n');
      await mongoose.connection.close();
      return;
    }

    // Create admin user
    const admin = await User.create({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      fullName: 'Richytech Administrator',
      company: 'Richytech.inc',
      role: 'admin',
      subscriptionTier: 'enterprise',
      webhookQuota: Infinity,
      emailVerified: true,
      isActive: true,
    });

    console.log('\n✅ Admin user created successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('  ADMIN CREDENTIALS');
    console.log('═══════════════════════════════════════');
    console.log(`Email:    ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log('═══════════════════════════════════════');
    console.log('\n⚠️  IMPORTANT: Change this password after first login!\n');
    console.log('You can now login at: http://localhost:5000/api/auth/login\n');

    await mongoose.connection.close();
    logger.info('Database connection closed');
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the seed function
seedAdmin();
