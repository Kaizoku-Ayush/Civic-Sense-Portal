/**
 * seed.js — Seed the production MongoDB database with:
 *   - 3 departments (Sanitation, Public Works, Electrical)
 *   - 1 admin user  (set role manually after seeding via Atlas UI or the
 *     admin-promote endpoint if you prefer)
 *   - 10 realistic civic issues across Indian city locations
 *
 * Usage:
 *   cd server
 *   node utils/seed.js
 *
 * Requires MONGODB_URI in server/.env (or as an environment variable).
 * Safe to re-run — uses upsert / findOrCreate logic to avoid duplicates.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { User, Issue, Department, IssueUpdate } from '../models/index.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ─── Department seed data ─────────────────────────────────────────────────────

const DEPARTMENTS = [
  {
    name: 'Sanitation Department',
    description: 'Handles garbage collection, waste management, and sanitation issues.',
    email: 'sanitation@city.gov.in',
    phone: '+91-11-2345-6780',
    categories: ['garbage'],
    isActive: true,
  },
  {
    name: 'Public Works Department',
    description: 'Responsible for road maintenance, pothole repairs, and infrastructure.',
    email: 'publicworks@city.gov.in',
    phone: '+91-11-2345-6781',
    categories: ['pothole', 'road_damage', 'drainage'],
    isActive: true,
  },
  {
    name: 'Electrical Department',
    description: 'Manages street lighting, electrical infrastructure, and power supply.',
    email: 'electrical@city.gov.in',
    phone: '+91-11-2345-6782',
    categories: ['streetlight'],
    isActive: true,
  },
];

// ─── Demo admin user ──────────────────────────────────────────────────────────
// firebaseUid is a placeholder — replace with the real UID from Firebase Auth
// after the admin logs in for the first time, or promote via Atlas UI.

const ADMIN_USER = {
  firebaseUid: 'seed-admin-placeholder-uid-001',
  email: 'admin@civicsense.app',
  name: 'CivicSense Admin',
  role: 'ADMIN',
  civicPoints: 0,
};

// ─── Issue locations (Indian cities: Delhi, Bengaluru, Mumbai, Hyderabad) ─────

const LOCATIONS = [
  // [longitude, latitude], address
  [[77.2090, 28.6139], 'Connaught Place, New Delhi'],
  [[77.1890, 28.6280], 'Karol Bagh, New Delhi'],
  [[77.2215, 28.6350], 'Chandni Chowk, New Delhi'],
  [[72.8777, 19.0760], 'Dadar, Mumbai'],
  [[72.8311, 18.9667], 'Colaba, Mumbai'],
  [[77.5946, 12.9716], 'MG Road, Bengaluru'],
  [[77.5500, 12.9800], 'Malleshwaram, Bengaluru'],
  [[78.4867, 17.3850], 'Banjara Hills, Hyderabad'],
  [[78.4744, 17.4065], 'Secunderabad, Hyderabad'],
  [[80.2707, 13.0827], 'Anna Nagar, Chennai'],
];

// Stable placeholder images from Cloudinary demo account
// (These are publicly accessible demo images — replace with real images post-launch)
const ISSUE_IMAGES = [
  'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
  'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
  'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
  'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
  'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
  'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
  'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
  'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
  'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
  'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
];

// ─── Issue templates ──────────────────────────────────────────────────────────

function buildIssues(userId, deptMap) {
  const sanitation = deptMap['Sanitation Department'];
  const publicWorks = deptMap['Public Works Department'];
  const electrical = deptMap['Electrical Department'];

  const templates = [
    {
      title: 'Large pothole on main road',
      description: 'A massive pothole near the traffic signal is causing accidents. Vehicles are swerving dangerously.',
      category: 'pothole',
      aiCategory: 'pothole',
      aiConfidence: 0.94,
      aiSeverityScore: 0.92,
      aiDescription: 'Large pothole posing immediate vehicle damage risk. Dispatch road crew within 24 hours.',
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      assignedDepartment: publicWorks,
      daysAgoCreated: 5,
      upvotes: 23,
    },
    {
      title: 'Overflowing garbage bin near market',
      description: 'The municipal garbage bin outside the vegetable market has been overflowing for 3 days.',
      category: 'garbage',
      aiCategory: 'garbage',
      aiConfidence: 0.88,
      aiSeverityScore: 0.71,
      aiDescription: 'Overflowing garbage poses public health risk. Schedule immediate collection.',
      status: 'ACKNOWLEDGED',
      priority: 'HIGH',
      assignedDepartment: sanitation,
      daysAgoCreated: 3,
      upvotes: 11,
    },
    {
      title: 'Street light not working for 2 weeks',
      description: 'The street light at the corner of the lane has been non-functional. Area is completely dark at night.',
      category: 'streetlight',
      aiCategory: 'streetlight',
      aiConfidence: 0.81,
      aiSeverityScore: 0.65,
      aiDescription: 'Non-functional street light creating safety hazard. Inspection and bulb replacement needed.',
      status: 'RESOLVED',
      priority: 'HIGH',
      assignedDepartment: electrical,
      daysAgoCreated: 14,
      upvotes: 8,
      resolvedAt: daysAgo(2),
      resolutionNotes: 'Faulty ballast replaced. Light restored to full operation.',
    },
    {
      title: 'Road crack causing traffic disruption',
      description: 'Multiple deep cracks across the road surface have appeared after heavy rains.',
      category: 'road_damage',
      aiCategory: 'road_damage',
      aiConfidence: 0.86,
      aiSeverityScore: 0.78,
      aiDescription: 'Severe road surface cracking. Immediate patching required to prevent further deterioration.',
      status: 'PENDING',
      priority: 'HIGH',
      assignedDepartment: publicWorks,
      daysAgoCreated: 1,
      upvotes: 5,
    },
    {
      title: 'Garbage dumped on footpath',
      description: 'Residents are dumping construction waste on the public footpath blocking pedestrian movement.',
      category: 'garbage',
      aiCategory: 'garbage',
      aiConfidence: 0.79,
      aiSeverityScore: 0.55,
      aiDescription: 'Illegal dumping on public footpath. Collection and fine notice recommended.',
      status: 'PENDING',
      priority: 'MEDIUM',
      assignedDepartment: sanitation,
      daysAgoCreated: 2,
      upvotes: 3,
    },
    {
      title: 'Pothole filled with water — invisible hazard',
      description: 'After rain, a large pothole filled with water is invisible to motorists. Two bikes have already fallen.',
      category: 'pothole',
      aiCategory: 'pothole',
      aiConfidence: 0.91,
      aiSeverityScore: 0.96,
      aiDescription: 'Water-filled pothole creating extreme hazard. Immediate barricading and repair within 12 hours.',
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      assignedDepartment: publicWorks,
      daysAgoCreated: 1,
      upvotes: 31,
    },
    {
      title: 'Blocked storm drain causing flooding',
      description: 'The storm drain on the main road is completely blocked with debris. Causes flooding every time it rains.',
      category: 'drainage',
      aiCategory: 'drainage',
      aiConfidence: 0.83,
      aiSeverityScore: 0.82,
      aiDescription: 'Blocked drainage system causing urban flooding. Clearing required before next rainfall.',
      status: 'ACKNOWLEDGED',
      priority: 'HIGH',
      assignedDepartment: publicWorks,
      daysAgoCreated: 7,
      upvotes: 18,
    },
    {
      title: 'Broken street light on highway ramp',
      description: 'Three consecutive lights on the highway ramp are broken. Risk of road accidents at night.',
      category: 'streetlight',
      aiCategory: 'streetlight',
      aiConfidence: 0.87,
      aiSeverityScore: 0.88,
      aiDescription: 'Multiple non-functional highway lights creating severe night-time accident risk.',
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      assignedDepartment: electrical,
      daysAgoCreated: 4,
      upvotes: 14,
    },
    {
      title: 'Garbage pile near school entrance',
      description: 'A large garbage pile has accumulated near the school entrance. Health risk for children.',
      category: 'garbage',
      aiCategory: 'garbage',
      aiConfidence: 0.92,
      aiSeverityScore: 0.85,
      aiDescription: 'Garbage near school. Immediate priority — public health risk for minors.',
      status: 'RESOLVED',
      priority: 'CRITICAL',
      assignedDepartment: sanitation,
      daysAgoCreated: 10,
      upvotes: 27,
      resolvedAt: daysAgo(6),
      resolutionNotes: 'Garbage cleared. Extra bin installed. Awareness notice sent to nearby shops.',
    },
    {
      title: 'Sunken road surface near bridge',
      description: 'The road surface near the underpass has sunk by about 4 inches. Trucks are getting stuck.',
      category: 'road_damage',
      aiCategory: 'road_damage',
      aiConfidence: 0.85,
      aiSeverityScore: 0.79,
      aiDescription: 'Road subsidence near bridge. Structural inspection and asphalting required.',
      status: 'ACKNOWLEDGED',
      priority: 'HIGH',
      assignedDepartment: publicWorks,
      daysAgoCreated: 6,
      upvotes: 9,
    },
  ];

  return templates.map((t, i) => {
    const [[lng, lat], address] = LOCATIONS[i];
    const createdAt = daysAgo(t.daysAgoCreated);
    return {
      userId,
      title: t.title,
      description: t.description,
      category: t.category,
      aiCategory: t.aiCategory,
      aiConfidence: t.aiConfidence,
      aiSeverityScore: t.aiSeverityScore,
      imageUrl: ISSUE_IMAGES[i],
      imageHash: `seed_hash_${i.toString().padStart(3, '0')}`,
      location: { type: 'Point', coordinates: [lng, lat] },
      address,
      status: t.status,
      priority: t.priority,
      assignedDepartment: t.assignedDepartment || null,
      upvotes: t.upvotes,
      resolvedAt: t.resolvedAt || null,
      resolutionNotes: t.resolutionNotes || null,
      createdAt,
      updatedAt: createdAt,
    };
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌  MONGODB_URI is not set. Add it to server/.env first.');
    process.exit(1);
  }

  console.log('🔗  Connecting to MongoDB…');
  await mongoose.connect(uri);
  console.log(`✅  Connected: ${mongoose.connection.host}`);

  // ── 1. Upsert departments ────────────────────────────────────────────────
  console.log('\n📦  Seeding departments…');
  const deptMap = {};
  for (const d of DEPARTMENTS) {
    const dept = await Department.findOneAndUpdate(
      { name: d.name },
      { $set: d },
      { upsert: true, new: true }
    );
    deptMap[dept.name] = dept._id;
    console.log(`   ✔ ${dept.name} (${dept._id})`);
  }

  // ── 2. Upsert admin user ─────────────────────────────────────────────────
  console.log('\n👤  Seeding admin user…');
  const admin = await User.findOneAndUpdate(
    { email: ADMIN_USER.email },
    { $set: ADMIN_USER },
    { upsert: true, new: true }
  );
  console.log(`   ✔ ${admin.name} <${admin.email}> (${admin._id})`);
  console.log('   ⚠  Remember to set the real Firebase UID after first login.');

  // ── 3. Seed issues (skip if already seeded) ──────────────────────────────
  console.log('\n🗺   Seeding issues…');
  const existingCount = await Issue.countDocuments({ userId: admin._id });
  if (existingCount >= 10) {
    console.log('   ℹ  Issues already seeded — skipping to avoid duplicates.');
  } else {
    const issues = buildIssues(admin._id, deptMap);
    const inserted = await Issue.insertMany(issues, { ordered: false });
    console.log(`   ✔ Inserted ${inserted.length} issues`);

    // Create IssueUpdate timeline entries for non-PENDING issues
    const updates = [];
    for (const iss of inserted) {
      if (iss.status !== 'PENDING') {
        updates.push({
          issueId: iss._id,
          userId: admin._id,
          oldStatus: 'PENDING',
          newStatus: iss.status,
          comment: 'Initial status set during demo seeding.',
          isPublic: true,
          createdAt: iss.createdAt,
          updatedAt: iss.createdAt,
        });
      }
    }
    if (updates.length) {
      await IssueUpdate.insertMany(updates, { ordered: false });
      console.log(`   ✔ Created ${updates.length} timeline entries`);
    }
  }

  console.log('\n🎉  Seeding complete!\n');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('💥  Seed failed:', err.message);
  process.exit(1);
});
