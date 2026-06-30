#!/usr/bin/env node

/**
 * Admin Setup Script for ICIUS 2026
 * 
 * This script creates the main admin user in MongoDB
 * Admin Email: icius2026@isius.org
 * Admin Password: Admin@12345 (CHANGE THIS AFTER FIRST LOGIN!)
 * 
 * USAGE:
 *   node scripts/setup-admin.js
 * 
 * REQUIREMENTS:
 *   - MongoDB must be running
 *   - .env file must exist with MONGODB_URI
 *   - npm dependencies installed (bcrypt, dotenv, mongoose)
 */

import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDatabase } from '../config/database.js';
import { User } from '../models/User.js';

// Load environment variables from current or parent directory
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });
if (!process.env.MONGODB_URI) {
  dotenv.config(); // fallback to current directory
}

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper functions
const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);
const success = (msg) => log('green', `✓ ${msg}`);
const error = (msg) => log('red', `✗ ${msg}`);
const info = (msg) => log('cyan', `ℹ ${msg}`);
const warn = (msg) => log('yellow', `⚠ ${msg}`);
const bold = (msg) => `${colors.bright}${msg}${colors.reset}`;

// Main setup function
async function setupAdmin() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log(bold('   ICIUS 2026 - Admin Setup Script'));
    console.log('='.repeat(70) + '\n');

    // Step 1: Connect to MongoDB
    info('Connecting to MongoDB...');
    await connectDatabase();
    success('Connected to MongoDB\n');

    // Admin credentials
    const adminEmail = 'icius2026@isius.org';
    const adminUsername = 'admin';
    const adminPassword = 'Admin@12345';

    // Step 2: Check if admin already exists
    info('Checking if admin user already exists...');
    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log('\n' + '─'.repeat(70));
      warn('Admin user already exists in database');
      console.log('─'.repeat(70));

      console.log(`
  Email:     ${bold(adminEmail)}
  Username:  ${bold(adminUsername)}
  Role:      ${bold(admin.role)}
  Status:    ${admin.verified ? bold('Verified ✓') : bold('Not Verified ✗')}
  Created:   ${new Date(admin.createdAt).toLocaleString()}
      `);

      // Update role if needed
      if (admin.role !== 'Admin') {
        warn('Role is not "Admin", updating...');
        admin.role = 'Admin';
        await admin.save();
        success('Role updated to Admin\n');
      }

      // Verify account if needed
      if (!admin.verified) {
        warn('Account is not verified, verifying...');
        admin.verified = true;
        admin.verificationToken = undefined;
        admin.verificationExpires = undefined;
        await admin.save();
        success('Account verified\n');
      }

      info('Existing admin user is ready to use');
    } else {
      // Step 3: Create new admin user
      info('Creating new admin user...');

      // Hash password
      const hash = await bcrypt.hash(adminPassword, 10);

      // Create admin document
      admin = new User({
        username: adminUsername,
        email: adminEmail,
        password: hash,
        role: 'Admin',
        verified: true,
        verificationToken: undefined,
        verificationExpires: undefined
      });

      // Save to database
      await admin.save();
      success('Admin user created successfully\n');

      console.log('─'.repeat(70));
      console.log(bold('✓ NEW ADMIN ACCOUNT CREATED'));
      console.log('─'.repeat(70));
    }

    // Step 4: Display admin information
    console.log(`
${bold('📋 Admin Account Details:')}
  ┌─ Email:        ${adminEmail}
  ├─ Username:     ${adminUsername}
  ├─ Password:     ${adminPassword}
  ├─ Role:         Admin
  ├─ Status:       Verified ✓
  └─ Created:      ${new Date(admin.createdAt).toLocaleString()}

${bold('🔐 Login Instructions:')}
  1. Open: https://icius2026-yovz.vercel.app/login
  2. Email:    ${adminEmail}
  3. Password: ${adminPassword}
  4. Click "Sign in"
  5. You'll be redirected to Admin Dashboard

${bold('⚠️  IMPORTANT - SECURITY CHECKLIST:')}
  ☐ Change password after first login
  ☐ Never share admin credentials with others
  ☐ Use strong passwords (min 8 chars with numbers, symbols)
  ☐ Keep JWT tokens secure in browser storage
  ☐ Logout when done with admin tasks
  ☐ Review audit logs regularly

${bold('🎯 Admin Panel Features:')}
  ✓ Create new Editor accounts
  ✓ View all Editors in system
  ✓ Delete/Remove Editor accounts
  ✓ Access Admin Dashboard
  ✓ Assign Editors to papers
  ✓ Manage system users
  ✓ View dashboard statistics

${bold('🚀 Access Admin Panel:')}
  1. Login with admin credentials above
  2. Click "Admin" button in navbar (red with gear icon)
  3. Direct URL: https://icius2026-yovz.vercel.app/admin

${bold('📝 How to Create First Editor:')}
  1. Login to Admin Panel (/admin)
  2. Click "Add Editor" button
  3. Fill in:
     - Email: editor1@example.com
     - Username: editor_name
     - Password: Strong password
  4. Click "Create Editor"
  5. Editor can now login with their credentials

${bold('📚 System Workflow:')}
  Admin          → Creates Editors
  Editor         → Creates Reviewers & Assigns to Papers
  Reviewer       → Reviews Papers
  Author         → Submits Papers

${bold('🔗 Important URLs:')}
  Frontend:      https://icius2026-yovz.vercel.app
  Backend API:   https://icius2026.vercel.app
  Login:         https://icius2026-yovz.vercel.app/login
  Admin Panel:   https://icius2026-yovz.vercel.app/admin
  Editor Dash:   https://icius2026-yovz.vercel.app/dashboard
  Reviewer Dash: https://icius2026-yovz.vercel.app/reviewer

${bold('📂 Database Info:')}
  Status:        ${process.env.MONGODB_URI ? '✓ Connected' : '✗ Not configured'}
  Environment:   ${process.env.NODE_ENV || 'development'}
  Backend Port:  ${process.env.PORT || 5000}
    `);

    console.log('─'.repeat(70));
    success('Admin setup completed successfully!');
    console.log('─'.repeat(70) + '\n');

    // Display credentials for copy-paste
    console.log(bold('📋 Quick Login Reference (Save This!):'));
    console.log(`
┌─────────────────────────────────────────────────────────────┐
│ Email:    icius2026@isius.org                       │
│ Password: Admin@12345                                       │
│ URL:      https://icius2026-yovz.vercel.app/login          │
└─────────────────────────────────────────────────────────────┘
    `);

    console.log('═'.repeat(70) + '\n');

    process.exit(0);
  } catch (error) {
    console.log('\n');
    error('Setup failed!');
    console.log('─'.repeat(70));
    console.error(`Error: ${error.message}`);
    console.log('─'.repeat(70) + '\n');

    // Provide troubleshooting help
    console.log(bold('🔧 Troubleshooting:'));
    console.log(`
  1. Verify MongoDB Connection:
     $ mongosh
     > db.version()

  2. Check .env file exists:
     File: /srm-back2/.env
     Required: MONGODB_URI

  3. Install dependencies:
     $ cd /srm-back2
     $ npm install bcrypt dotenv mongoose

  4. Verify file paths:
     ✓ Script:  /srm-back2/scripts/setup-admin.js
     ✓ Config:  /srm-back2/config/database.js
     ✓ Model:   /srm-back2/models/User.js

  5. Run with Node:
     $ node scripts/setup-admin.js

  6. Check database:
     $ mongosh
     > use societycis
     > db.users.find({email: 'icius2026@isius.org'})
    `);

    console.log(`\nFull Error: ${error.stack}\n`);
    process.exit(1);
  }
}

// Run setup
setupAdmin();
