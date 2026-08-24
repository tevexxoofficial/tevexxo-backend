/* Seeds MongoDB with:
   1. Default admin (credentials from backend/.env)
   2. The same initial data the Admin UI previously shipped as mock arrays
   3. Settings singleton + welcome notification + starter activity entries
   Safe to run multiple times - only fills EMPTY collections (admin is upserted). */
const mongoose = require('mongoose');
const dns = require('dns');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const env = require('../config/env');

// Fix Node.js DNS SRV resolution issue for MongoDB Atlas (same as server.js)
dns.setServers(['8.8.8.8', '1.1.1.1']);

const Admin = require('../models/Admin');
const User = require('../models/User');
const Course = require('../models/Course');
const Program = require('../models/Program');
const Project = require('../models/Project');
const Enrollment = require('../models/Enrollment');
const Order = require('../models/Order');
const Inquiry = require('../models/Inquiry');
const BlogPost = require('../models/BlogPost');
const Testimonial = require('../models/Testimonial');
const Mentor = require('../models/Mentor');
const Notification = require('../models/Notification');
const Setting = require('../models/Setting');
const Activity = require('../models/Activity');

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function seedCollection(Model, docs) {
  const count = await Model.countDocuments({});
  if (count > 0) {
    console.log(`[seed] ${Model.collection.name}: ${count} doc(s) already present - skipped`);
    return false;
  }
  await Model.insertMany(docs);
  console.log(`[seed] ${Model.collection.name}: inserted ${docs.length} doc(s)`);
  return true;
}

async function run() {
  await connectDB();

  // 1. Default admin (upsert so password reset via env is possible on re-seed)
  const hash = await bcrypt.hash(env.seedAdmin.password, 10);
  const admin = await Admin.findOneAndUpdate(
    { email: env.seedAdmin.email },
    {
      $set: {
        name: env.seedAdmin.name,
        email: env.seedAdmin.email,
        role: 'Super Admin',
        phone: '+91 98765 43210',
        location: 'Bengaluru, India',
        bio: 'Managing the Tevexxo learning platform and helping our team deliver a great learner experience.',
      },
      $setOnInsert: { password: hash },
    },
    { new: true, upsert: true }
  );
  console.log(`[seed] admin ready: ${admin.email}`);

  // 2. Entities (same data the UI used to hardcode)
  const users = [
    { name: 'Arjun Kumar', email: 'arjun@example.com', role: 'Learner', status: 'Active', date: 'May 14, 2025', detail: 'Full Stack Development' },
    { name: 'Priya Sharma', email: 'priya@example.com', role: 'Learner', status: 'Active', date: 'May 13, 2025', detail: 'Data Analytics' },
    { name: 'Rohit Verma', email: 'rohit@example.com', role: 'Instructor', status: 'Active', date: 'May 12, 2025', detail: 'AI & Machine Learning' },
    { name: 'Sneha Reddy', email: 'sneha@example.com', role: 'Learner', status: 'Inactive', date: 'May 10, 2025', detail: 'Cyber Security' },
    { name: 'Vikram Joshi', email: 'vikram@example.com', role: 'Learner', status: 'Active', date: 'May 09, 2025', detail: 'DevOps Engineering' },
    { name: 'Neha Singh', email: 'neha@example.com', role: 'Instructor', status: 'Active', date: 'May 08, 2025', detail: 'UI/UX Design' },
  ];

  const courseRows = [
    ['Full Stack Development', 'Web Development', 'Published', 2350, 12999],
    ['Data Analytics', 'Data Science', 'Published', 1850, 9999],
    ['AI & Machine Learning', 'Artificial Intelligence', 'Published', 1620, 14499],
    ['Cyber Security', 'Security', 'Published', 1250, 11499],
    ['Cloud & DevOps', 'DevOps', 'Draft', 740, 10499],
    ['UI/UX Design', 'Design', 'Published', 980, 8499],
  ];
  const courses = courseRows.map(([name, category, status, studentsCount, price], i) => ({
    name,
    category,
    status,
    studentsCount,
    price,
    amount: `₹${price.toLocaleString('en-IN')}`,
    detail: `${studentsCount.toLocaleString('en-IN')} students`,
    date: daysAgo(60 - i * 8).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }));

  const programs = [1, 2, 3, 4, 5].map((id) => ({
    id,
    name: ['Full Stack Development Program', 'Data Analytics Program', 'AI & ML Program', 'Cyber Security Program', 'UI/UX Design Program'][id - 1],
    category: '6 Courses',
    status: id === 4 ? 'Upcoming' : 'Active',
    detail: `${1126 - id * 74} enrolled`,
    enrolled: 1126 - id * 74,
    date: '6 Months',
  }));

  const projects = [1, 2, 3, 4, 5].map((id) => ({
    name: ['E-commerce Website', 'Data Analysis Dashboard', 'AI Chatbot System', 'Network Security Monitor', 'Task Management App'][id - 1],
    category: ['Web Development', 'Data Science', 'AI/ML', 'Cyber Security', 'Web Development'][id - 1],
    status: id === 5 ? 'Draft' : 'Published',
    detail: `${42 - id * 3} submissions`,
    submissions: 42 - id * 3,
    date: ['Arjun Kumar', 'Priya Sharma', 'Rohit Verma', 'Sneha Reddy', 'Vikram Joshi'][id - 1],
  }));

  const enrollments = [1, 2, 3, 4, 5, 6].map((id) => ({
    createdAt: daysAgo(id),
    name: ['Arjun Kumar', 'Priya Sharma', 'Rohit Verma', 'Sneha Reddy', 'Vikram Joshi', 'Neha Singh'][id - 1],
    email: ['arjun@example.com', 'priya@example.com', 'rohit@example.com', 'sneha@example.com', 'vikram@example.com', 'neha@example.com'][id - 1],
    category: ['Full Stack Development', 'Data Analytics', 'AI & Machine Learning', 'Cyber Security', 'UI/UX Design', 'Cloud & DevOps'][id - 1],
    status: id === 4 ? 'Completed' : 'Active',
    detail: `${72 - id * 6}%`,
    progress: 72 - id * 6,
    date: daysAgo(id).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }));

  const orders = [1, 2, 3, 4, 5, 6].map((id) => ({
    name: `#TX${12560 + id}`,
    category: ['Arjun Kumar', 'Priya Sharma', 'Rohit Verma', 'Sneha Reddy', 'Vikram Joshi', 'Neha Singh'][id - 1],
    amount: ['₹12,999', '₹9,999', '₹14,499', '₹11,499', '₹8,499', '₹10,499'][id - 1],
    status: id === 3 ? 'Pending' : id === 5 ? 'Refunded' : 'Paid',
    detail: id % 2 ? 'Card' : 'UPI',
    date: daysAgo(id).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }));

  const inquiries = [1, 2, 3, 4, 5].map((id) => ({
    name: ['Rahul Mehta', 'Aditi Patel', 'Gaurav Singh', 'Pooja Verma', 'Aman Yadav'][id - 1],
    email: `contact${id}@example.com`,
    category: ['Course Enrollment', 'Payment Query', 'Technical Support', 'Refund Request', 'General Inquiry'][id - 1],
    status: id === 3 ? 'In Progress' : id === 4 ? 'Resolved' : 'Open',
    priority: id < 3 ? 'High' : 'Normal',
    message: 'Interested in knowing more about the course curriculum and upcoming batch dates.',
    detail: id < 3 ? 'High' : 'Normal',
    date: daysAgo(id * 2).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }));

  const blog = [1, 2, 3, 4, 5].map((id) => ({
    name: ['How to become a Full Stack Developer', 'Data Analytics Career Guide', 'AI in Real Life Applications', 'Cyber Security Best Practices', 'Cloud Computing for Beginners'][id - 1],
    category: ['Career', 'Data Science', 'AI/ML', 'Security', 'DevOps'][id - 1],
    status: id === 3 ? 'Draft' : 'Published',
    detail: 'Admin',
    date: daysAgo(id * 4).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }));

  const testimonials = [1, 2, 3, 4, 5].map((id) => ({
    name: ['Arjun Kumar', 'Priya Sharma', 'Rohit Verma', 'Sneha Reddy', 'Vikram Joshi'][id - 1],
    category: ['Full Stack Development', 'Data Analytics', 'AI & Machine Learning', 'Cyber Security', 'UI/UX Design'][id - 1],
    status: id === 4 ? 'Pending' : 'Published',
    rating: 5 - (id % 2),
    detail: `${5 - (id % 2)} / 5`,
    message: 'Great learning experience with hands-on projects and supportive mentors.',
    date: daysAgo(id * 5).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }));

  const mentors = [1, 2, 3, 4, 5].map((id) => ({
    name: ['Saurabh Kumar', 'Anita Sharma', 'Amit Joshi', 'Richa Verma', 'Nikhil Singh'][id - 1],
    email: `mentor${id}@tevexxo.com`,
    category: ['Full Stack Development', 'Data Science', 'AI/ML', 'Cyber Security', 'Cloud & DevOps'][id - 1],
    status: id === 4 ? 'Inactive' : 'Active',
    detail: `${id + 3} courses`,
    date: `${1126 - id * 85} students`,
  }));

  await seedCollection(User, users);
  await seedCollection(Course, courses);
  await seedCollection(Program, programs.map(({ id, ...rest }) => rest));
  await seedCollection(Project, projects);
  await seedCollection(Enrollment, enrollments);
  await seedCollection(Order, orders);
  await seedCollection(Inquiry, inquiries);
  await seedCollection(BlogPost, blog);
  await seedCollection(Testimonial, testimonials);
  await seedCollection(Mentor, mentors);

  // 3. Settings singleton
  if ((await Setting.countDocuments({})) === 0) {
    await Setting.create({ key: 'global' });
    console.log('[seed] settings: created defaults');
  } else {
    console.log('[seed] settings: already present - skipped');
  }

  // 4. Welcome notification + starter activities (only when empty)
  if ((await Notification.countDocuments({})) === 0) {
    await Notification.create([
      { title: 'Welcome to Tevexxo Admin', message: 'Your admin panel is connected to MongoDB. Data now persists across refreshes.', type: 'system' },
      { title: 'Seed data loaded', message: 'Sample users, courses, programs and more were seeded for you.', type: 'system' },
    ]);
    console.log('[seed] notifications: created 2');
  }
  if ((await Activity.countDocuments({})) === 0) {
    await Activity.create([
      { type: 'SYSTEM_SEEDED', actor: 'System', description: 'Platform initialized with sample data', entity: 'SYSTEM' },
      { type: 'ADMIN_LOGIN', actor: admin.name, description: `${admin.name} signed in to the admin panel`, entity: 'AUTH' },
    ]);
    console.log('[seed] activities: created 2');
  }

  console.log('\n[seed] DONE. Login with:');
  console.log(`       Email:    ${env.seedAdmin.email}`);
  console.log(`       Password: ${env.seedAdmin.password} (from ADMIN_PASSWORD in backend/.env)`);

  await mongoose.connection.close();
}

run().catch(async (err) => {
  console.error('[seed] FAILED:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
