import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CommitteeMember from '../models/CommitteeMember.js';
import { connectDatabase } from '../config/database.js';

dotenv.config();

async function checkCommitteeData() {
  try {
    await connectDatabase();
    console.log('📡 Connected to MongoDB');

    const count = await CommitteeMember.countDocuments();
    console.log(`📊 Total committee members in database: ${count}`);

    if (count > 0) {
      const members = await CommitteeMember.find().limit(5).lean();
      console.log('📋 Sample members:');
      members.forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.name} - ${m.role}`);
      });
    } else {
      console.log('⚠️  No committee members found in database');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCommitteeData();
