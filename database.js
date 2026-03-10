const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'gym.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      avatar TEXT,
      role TEXT NOT NULL CHECK(role IN ('member','trainer','admin')) DEFAULT 'member',
      status TEXT NOT NULL CHECK(status IN ('active','inactive')) DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL CHECK(status IN ('active','inactive')) DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      capacity INTEGER DEFAULT 20,
      status TEXT NOT NULL CHECK(status IN ('active','inactive')) DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      activity_id INTEGER REFERENCES activities(id),
      location_id INTEGER REFERENCES locations(id),
      trainer_id INTEGER REFERENCES users(id),
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 60,
      max_participants INTEGER DEFAULT 20,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      session_id INTEGER NOT NULL REFERENCES sessions(id),
      status TEXT NOT NULL CHECK(status IN ('confirmed','cancelled','completed')) DEFAULT 'confirmed',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, session_id)
    );

    CREATE TABLE IF NOT EXISTS blogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author_id INTEGER NOT NULL REFERENCES users(id),
      category TEXT,
      content TEXT,
      featured_image TEXT,
      status TEXT NOT NULL CHECK(status IN ('published','draft')) DEFAULT 'draft',
      views INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Check if already seeded
  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
  if (userCount.cnt > 0) return;

  console.log('Seeding database...');

  const hashSync = (pw) => bcrypt.hashSync(pw, 10);

  // Seed users
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, phone, address, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const adminId = insertUser.run('Admin User', 'admin@gym.com', hashSync('admin123'), '555-0100', '1 Gym Plaza', 'admin', 'active').lastInsertRowid;
  const trainer1Id = insertUser.run('Sarah Connor', 'sarah@gym.com', hashSync('trainer123'), '555-0101', '2 Fitness Ave', 'trainer', 'active').lastInsertRowid;
  const trainer2Id = insertUser.run('Mike Johnson', 'mike@gym.com', hashSync('trainer123'), '555-0102', '3 Health Blvd', 'trainer', 'active').lastInsertRowid;
  const member1Id = insertUser.run('Alice Smith', 'alice@gym.com', hashSync('member123'), '555-0201', '10 Oak Street', 'member', 'active').lastInsertRowid;
  const member2Id = insertUser.run('Bob Brown', 'bob@gym.com', hashSync('member123'), '555-0202', '11 Pine Lane', 'member', 'active').lastInsertRowid;
  const member3Id = insertUser.run('Carol White', 'carol@gym.com', hashSync('member123'), '555-0203', '12 Maple Drive', 'member', 'active').lastInsertRowid;

  // Seed activities
  const insertActivity = db.prepare('INSERT INTO activities (name, description, status) VALUES (?, ?, ?)');
  const act1 = insertActivity.run('Yoga', 'Mind and body balance through yoga postures and breathing exercises.', 'active').lastInsertRowid;
  const act2 = insertActivity.run('CrossFit', 'High-intensity functional fitness training.', 'active').lastInsertRowid;
  const act3 = insertActivity.run('Spinning', 'Indoor cycling cardio workout.', 'active').lastInsertRowid;
  const act4 = insertActivity.run('Boxing', 'Fitness boxing for strength and coordination.', 'active').lastInsertRowid;
  const act5 = insertActivity.run('Pilates', 'Core strengthening and flexibility training.', 'active').lastInsertRowid;
  const act6 = insertActivity.run('Zumba', 'Dance-based aerobic fitness class.', 'active').lastInsertRowid;
  const act7 = insertActivity.run('Strength Training', 'Weightlifting and resistance training.', 'inactive').lastInsertRowid;

  // Seed locations
  const insertLocation = db.prepare('INSERT INTO locations (name, address, capacity, status) VALUES (?, ?, ?, ?)');
  const loc1 = insertLocation.run('Main Studio', '1 Gym Plaza, Studio A', 30, 'active').lastInsertRowid;
  const loc2 = insertLocation.run('Fitness Hall', '1 Gym Plaza, Hall B', 50, 'active').lastInsertRowid;
  const loc3 = insertLocation.run('Spin Room', '1 Gym Plaza, Room C', 20, 'active').lastInsertRowid;
  const loc4 = insertLocation.run('Boxing Ring', '1 Gym Plaza, Room D', 15, 'active').lastInsertRowid;
  const loc5 = insertLocation.run('Yoga Studio', '2 Fitness Ave, Studio 1', 25, 'active').lastInsertRowid;
  const loc6 = insertLocation.run('Outdoor Court', '2 Fitness Ave, Outdoor', 40, 'inactive').lastInsertRowid;

  // Seed sessions (some upcoming, some past)
  const insertSession = db.prepare(`
    INSERT INTO sessions (name, activity_id, location_id, trainer_id, date, time, duration_minutes, max_participants, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sess1 = insertSession.run('Morning Yoga Flow', act1, loc5, trainer1Id, '2026-03-15', '07:00', 60, 20, 'Energizing morning yoga session for all levels.').lastInsertRowid;
  const sess2 = insertSession.run('CrossFit HIIT Blast', act2, loc2, trainer2Id, '2026-03-16', '09:00', 45, 30, 'Intense HIIT-style CrossFit workout.').lastInsertRowid;
  const sess3 = insertSession.run('Evening Spin Class', act3, loc3, trainer1Id, '2026-03-17', '18:00', 50, 18, 'High-energy spinning to great music.').lastInsertRowid;
  const sess4 = insertSession.run('Boxing Fundamentals', act4, loc4, trainer2Id, '2026-03-18', '10:00', 60, 12, 'Learn boxing basics and get a great workout.').lastInsertRowid;
  const sess5 = insertSession.run('Power Pilates', act5, loc1, trainer1Id, '2026-03-20', '08:00', 55, 22, 'Strengthen your core with power pilates.').lastInsertRowid;
  const sess6 = insertSession.run('Zumba Party', act6, loc2, trainer2Id, '2026-03-21', '11:00', 60, 40, 'Dance your way to fitness!').lastInsertRowid;
  const sess7 = insertSession.run('Advanced Yoga', act1, loc5, trainer1Id, '2026-03-22', '07:30', 75, 15, 'Advanced yoga for experienced practitioners.').lastInsertRowid;
  const sess8 = insertSession.run('CrossFit Strength', act2, loc2, trainer2Id, '2026-03-14', '09:00', 60, 25, 'Strength-focused CrossFit session.').lastInsertRowid;

  // Seed bookings
  const insertBooking = db.prepare('INSERT INTO bookings (user_id, session_id, status) VALUES (?, ?, ?)');
  insertBooking.run(member1Id, sess1, 'confirmed');
  insertBooking.run(member1Id, sess2, 'confirmed');
  insertBooking.run(member1Id, sess8, 'completed');
  insertBooking.run(member2Id, sess1, 'confirmed');
  insertBooking.run(member2Id, sess3, 'confirmed');
  insertBooking.run(member2Id, sess4, 'cancelled');
  insertBooking.run(member3Id, sess2, 'confirmed');
  insertBooking.run(member3Id, sess5, 'confirmed');
  insertBooking.run(member3Id, sess6, 'confirmed');
  insertBooking.run(member1Id, sess5, 'confirmed');

  // Seed blogs
  const insertBlog = db.prepare(`
    INSERT INTO blogs (title, author_id, category, content, status, views, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  insertBlog.run(
    'Top 10 Tips for Beginner Gym-Goers',
    trainer1Id,
    'Fitness Tips',
    `<p>Starting your fitness journey can be overwhelming. Here are our top 10 tips to help you get started on the right foot.</p>
    <h2>1. Start Slow</h2>
    <p>Don't try to do everything at once. Build up gradually to avoid injury and burnout.</p>
    <h2>2. Consistency is Key</h2>
    <p>Going to the gym 3 times a week consistently beats sporadic intense sessions every time.</p>
    <h2>3. Proper Form First</h2>
    <p>Always prioritize good form over heavy weights. Poor form leads to injuries.</p>
    <h2>4. Hydrate</h2>
    <p>Drink plenty of water before, during, and after your workout.</p>
    <h2>5. Rest and Recovery</h2>
    <p>Your muscles grow during rest, not during workouts. Make sure to get enough sleep.</p>`,
    'published',
    245,
    '-5 days'
  );

  insertBlog.run(
    'The Science of Muscle Building',
    trainer2Id,
    'Science',
    `<p>Understanding how muscles grow can help you train smarter. Let's dive into the science.</p>
    <h2>Muscle Hypertrophy</h2>
    <p>Muscle growth (hypertrophy) occurs when muscle fibers are damaged through exercise and then repaired stronger.</p>
    <h2>Progressive Overload</h2>
    <p>Gradually increasing the weight, reps, or sets over time is the primary driver of muscle growth.</p>
    <h2>Protein Synthesis</h2>
    <p>Adequate protein intake (0.8-1g per pound of bodyweight) supports muscle repair and growth.</p>`,
    'published',
    189,
    '-10 days'
  );

  insertBlog.run(
    'Yoga for Stress Relief',
    trainer1Id,
    'Wellness',
    `<p>In today's fast-paced world, stress management is crucial. Yoga offers a holistic approach to finding calm.</p>
    <h2>Breathing Techniques</h2>
    <p>Pranayama breathing techniques can activate the parasympathetic nervous system, reducing stress hormones.</p>
    <h2>Mindfulness</h2>
    <p>Yoga encourages present-moment awareness, helping to break cycles of anxious thinking.</p>
    <h2>Physical Release</h2>
    <p>Gentle stretching releases physical tension stored in muscles due to stress.</p>`,
    'published',
    312,
    '-2 days'
  );

  insertBlog.run(
    'Nutrition for Peak Performance',
    trainer2Id,
    'Nutrition',
    `<p>What you eat directly impacts your gym performance. Here's a guide to fueling your workouts.</p>
    <h2>Pre-Workout Nutrition</h2>
    <p>Eat a balanced meal 2-3 hours before training. Focus on complex carbs and lean protein.</p>
    <h2>Post-Workout Recovery</h2>
    <p>Consume protein and carbohydrates within 30 minutes of finishing your workout.</p>`,
    'draft',
    0,
    '-1 days'
  );

  console.log('Database seeded successfully!');
  console.log('Login credentials:');
  console.log('  Admin:   admin@gym.com / admin123');
  console.log('  Trainer: sarah@gym.com / trainer123');
  console.log('  Trainer: mike@gym.com  / trainer123');
  console.log('  Member:  alice@gym.com / member123');
}

initializeDatabase();

module.exports = db;
