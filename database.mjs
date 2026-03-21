import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './DatabaseModel.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read CREATE TABLE IF NOT EXISTS statements from database.sql
// (the section between -- [SCHEMA:START] and -- [SCHEMA:END])
function readSchemaStatements() {
  const sql = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf8');
  const start = sql.indexOf('-- [SCHEMA:START]');
  const end   = sql.indexOf('-- [SCHEMA:END]');
  if (start === -1 || end === -1) throw new Error('Schema markers not found in database.sql');
  return sql
    .slice(start + '-- [SCHEMA:START]'.length, end)
    .split(';')
    .map(s => s.replace(/--.*$/gm, '').trim())   // strip line comments
    .filter(s => s.length > 0);
}

async function initializeDatabase() {
  const conn = await pool.getConnection();
  try {
    // Create all tables from database.sql schema section
    for (const stmt of readSchemaStatements()) {
      await conn.execute(stmt);
    }

    // Skip seeding if data already exists
    const [[{ cnt }]] = await conn.execute('SELECT COUNT(*) as cnt FROM users');
    if (cnt > 0) return;

    console.log('Seeding database...');

    const hashSync = (pw) => bcrypt.hashSync(pw, 10);
    const ts = '2026-03-10 11:37:09';

    const insertUser = `INSERT INTO users (name, email, password_hash, phone, address, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    await conn.execute(insertUser, ['Admin User',     'admin@gym.com', hashSync('admin123'),   '555-0100', '1 Gym Plaza',     'admin',   'active', ts]);
    const [r2] = await conn.execute(insertUser, ['Sarah Connorddd','sarah@gym.com', hashSync('trainer123'), '555-0101', '2 Fitness Ave',   'trainer', 'active', ts]);
    const [r3] = await conn.execute(insertUser, ['Mike Johnson',   'mike@gym.com',  hashSync('trainer123'), '555-0102', '3 Health Blvd',   'trainer', 'active', ts]);
    const [r4] = await conn.execute(insertUser, ['Alice Smith',    'alice@gym.com', hashSync('member123'),  '555-0201', '10 Oak Street',   'member',  'active', ts]);
    const [r5] = await conn.execute(insertUser, ['Bob Brown',      'bob@gym.com',   hashSync('member123'),  '555-0202', '11 Pine Lane',    'member',  'active', ts]);
    const [r6] = await conn.execute(insertUser, ['Carol White',    'carol@gym.com', hashSync('member123'),  '555-0203', '12 Maple Drive',  'member',  'active', ts]);

    const trainer1Id = r2.insertId, trainer2Id = r3.insertId;
    const member1Id = r4.insertId, member2Id = r5.insertId, member3Id = r6.insertId;

    const insertActivity = `INSERT INTO activities (name, description, status) VALUES (?, ?, ?)`;
    const [a1] = await conn.execute(insertActivity, ['Yoga',              'Mind and body balance through yoga postures and breathing exercises.', 'active']);
    const [a2] = await conn.execute(insertActivity, ['CrossFit',          'High-intensity functional fitness training.',                          'active']);
    const [a3] = await conn.execute(insertActivity, ['Spinning',          'Indoor cycling cardio workout.',                                       'active']);
    const [a4] = await conn.execute(insertActivity, ['Boxing',            'Fitness boxing for strength and coordination.',                        'active']);
    const [a5] = await conn.execute(insertActivity, ['Pilates',           'Core strengthening and flexibility training.',                         'active']);
    const [a6] = await conn.execute(insertActivity, ['Zumba',             'Dance-based aerobic fitness class.',                                   'active']);
    await conn.execute(insertActivity,              ['Strength Training', 'Weightlifting and resistance training.',                               'active']);

    const act1 = a1.insertId, act2 = a2.insertId, act3 = a3.insertId;
    const act4 = a4.insertId, act5 = a5.insertId, act6 = a6.insertId;

    const insertLocation = `INSERT INTO locations (name, address, capacity, status) VALUES (?, ?, ?, ?)`;
    const [l1] = await conn.execute(insertLocation, ['Main Studio',   '1 Gym Plaza, Studio A',       30, 'active']);
    const [l2] = await conn.execute(insertLocation, ['Fitness Hall',  '1 Gym Plaza, Hall B',         50, 'active']);
    const [l3] = await conn.execute(insertLocation, ['Spin Room',     '1 Gym Plaza, Room C',         20, 'active']);
    const [l4] = await conn.execute(insertLocation, ['Boxing Ring',   '1 Gym Plaza, Room D',         15, 'active']);
    const [l5] = await conn.execute(insertLocation, ['Yoga Studio',   '2 Fitness Ave, Studio 1',     25, 'active']);
    await conn.execute(insertLocation,              ['Outdoor Court', '2 Fitness Ave, Outdoor',      40, 'inactive']);

    const loc1 = l1.insertId, loc2 = l2.insertId, loc3 = l3.insertId;
    const loc4 = l4.insertId, loc5 = l5.insertId;

    const insertSession = `INSERT INTO sessions (name, activity_id, location_id, trainer_id, date, time, duration_minutes, max_participants, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const [s1] = await conn.execute(insertSession, ['Morning Yoga Flow',       act1, loc5, trainer1Id, '2026-03-15', '07:00:00', 60, 20, 'Energizing morning yoga session for all levels.', ts]);
    const [s2] = await conn.execute(insertSession, ['CrossFit HIIT Blast',     act2, loc2, trainer2Id, '2026-03-16', '09:00:00', 45, 30, 'Intense HIIT-style CrossFit workout.',             ts]);
    const [s3] = await conn.execute(insertSession, ['Evening Spin Class',      act3, loc3, trainer1Id, '2026-03-17', '18:00:00', 50, 18, 'High-energy spinning to great music.',             ts]);
    const [s4] = await conn.execute(insertSession, ['Boxing Fundamentals',     act4, loc4, trainer2Id, '2026-03-18', '10:00:00', 60, 12, 'Learn boxing basics and get a great workout.',     ts]);
    const [s5] = await conn.execute(insertSession, ['Power Pilates',           act5, loc1, trainer1Id, '2026-03-20', '08:00:00', 55, 22, 'Strengthen your core with power pilates.',         ts]);
    const [s6] = await conn.execute(insertSession, ['Zumba Party',             act6, loc2, trainer2Id, '2026-03-21', '11:00:00', 60, 40, 'Dance your way to fitness!',                       ts]);
    await conn.execute(insertSession,              ['Advanced Yoga',           act1, loc5, trainer1Id, '2026-03-22', '07:30:00', 75, 15, 'Advanced yoga for experienced practitioners.',     ts]);
    const [s8] = await conn.execute(insertSession, ['CrossFit Strength',       act2, loc2, trainer2Id, '2026-03-14', '09:00:00', 60, 25, 'Strength-focused CrossFit session.',               ts]);

    const sess1 = s1.insertId, sess2 = s2.insertId, sess3 = s3.insertId, sess4 = s4.insertId;
    const sess5 = s5.insertId, sess6 = s6.insertId, sess8 = s8.insertId;

    const insertBooking = `INSERT INTO bookings (user_id, session_id, status, created_at) VALUES (?, ?, ?, ?)`;
    await conn.execute(insertBooking, [member1Id, sess1,  'confirmed', ts]);
    await conn.execute(insertBooking, [member1Id, sess2,  'confirmed', ts]);
    await conn.execute(insertBooking, [member1Id, sess8,  'completed', ts]);
    await conn.execute(insertBooking, [member2Id, sess1,  'confirmed', ts]);
    await conn.execute(insertBooking, [member2Id, sess3,  'confirmed', ts]);
    await conn.execute(insertBooking, [member2Id, sess4,  'cancelled', ts]);
    await conn.execute(insertBooking, [member3Id, sess2,  'confirmed', ts]);
    await conn.execute(insertBooking, [member3Id, sess5,  'confirmed', ts]);
    await conn.execute(insertBooking, [member3Id, sess6,  'confirmed', ts]);
    await conn.execute(insertBooking, [member1Id, sess5,  'confirmed', ts]);

    const insertBlog = `INSERT INTO blogs (title, author_id, category, content, status, views, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    await conn.execute(insertBlog, [
      'Top 10 Tips for Beginner Gym-Goers', trainer1Id, 'Fitness Tips',
      `<p>Starting your fitness journey can be overwhelming. Here are our top 10 tips to help you get started on the right foot.</p>
<h2>1. Start Slow</h2><p>Don't try to do everything at once. Build up gradually to avoid injury and burnout.</p>
<h2>2. Consistency is Key</h2><p>Going to the gym 3 times a week consistently beats sporadic intense sessions every time.</p>
<h2>3. Proper Form First</h2><p>Always prioritize good form over heavy weights. Poor form leads to injuries.</p>
<h2>4. Hydrate</h2><p>Drink plenty of water before, during, and after your workout.</p>
<h2>5. Rest and Recovery</h2><p>Your muscles grow during rest, not during workouts. Make sure to get enough sleep.</p>`,
      'published', 246, '2026-03-05 11:37:09'
    ]);
    await conn.execute(insertBlog, [
      'The Science of Muscle Building', trainer2Id, 'Science',
      `<p>Understanding how muscles grow can help you train smarter. Let's dive into the science.</p>
<h2>Muscle Hypertrophy</h2><p>Muscle growth occurs when muscle fibers are damaged through exercise and then repaired stronger.</p>
<h2>Progressive Overload</h2><p>Gradually increasing the weight, reps, or sets over time is the primary driver of muscle growth.</p>
<h2>Protein Synthesis</h2><p>Adequate protein intake (0.8-1g per pound of bodyweight) supports muscle repair and growth.</p>`,
      'published', 189, '2026-02-28 11:37:09'
    ]);
    await conn.execute(insertBlog, [
      'Yoga for Stress Relief', trainer1Id, 'Wellness',
      `<p>In today's fast-paced world, stress management is crucial. Yoga offers a holistic approach to finding calm.</p>
<h2>Breathing Techniques</h2><p>Pranayama breathing techniques can activate the parasympathetic nervous system, reducing stress hormones.</p>
<h2>Mindfulness</h2><p>Yoga encourages present-moment awareness, helping to break cycles of anxious thinking.</p>
<h2>Physical Release</h2><p>Gentle stretching releases physical tension stored in muscles due to stress.</p>`,
      'published', 312, '2026-03-08 11:37:09'
    ]);
    await conn.execute(insertBlog, [
      'Nutrition for Peak Performance', trainer2Id, 'Nutrition',
      `<p>What you eat directly impacts your gym performance. Here's a guide to fueling your workouts.</p>
<h2>Pre-Workout Nutrition</h2><p>Eat a balanced meal 2-3 hours before training. Focus on complex carbs and lean protein.</p>
<h2>Post-Workout Recovery</h2><p>Consume protein and carbohydrates within 30 minutes of finishing your workout.</p>`,
      'draft', 0, '2026-03-09 11:37:09'
    ]);

    console.log('Database seeded successfully!');
    console.log('  Admin:   admin@gym.com  / admin123');
    console.log('  Trainer: sarah@gym.com  / trainer123');
    console.log('  Trainer: mike@gym.com   / trainer123');
    console.log('  Member:  alice@gym.com  / member123');
  } finally {
    conn.release();
  }
}

initializeDatabase().catch(console.error);

export default pool;
