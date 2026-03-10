const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gym_fitness_db_shakila',
  waitForConnections: true,
  connectionLimit: 10,
  multipleStatements: false,
});

async function initializeDatabase() {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        avatar VARCHAR(255),
        role ENUM('member','trainer','admin') NOT NULL DEFAULT 'member',
        status ENUM('active','inactive') NOT NULL DEFAULT 'active',
        created_at DATETIME NOT NULL DEFAULT NOW()
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS activities (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('active','inactive') NOT NULL DEFAULT 'active'
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS locations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        capacity INT DEFAULT 20,
        status ENUM('active','inactive') NOT NULL DEFAULT 'active'
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        activity_id INT,
        location_id INT,
        trainer_id INT,
        date DATE NOT NULL,
        time TIME NOT NULL,
        duration_minutes INT DEFAULT 60,
        max_participants INT DEFAULT 20,
        description TEXT,
        created_at DATETIME NOT NULL DEFAULT NOW(),
        FOREIGN KEY (activity_id) REFERENCES activities(id),
        FOREIGN KEY (location_id) REFERENCES locations(id),
        FOREIGN KEY (trainer_id) REFERENCES users(id)
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        session_id INT NOT NULL,
        status ENUM('confirmed','cancelled','completed') NOT NULL DEFAULT 'confirmed',
        created_at DATETIME NOT NULL DEFAULT NOW(),
        UNIQUE KEY uq_user_session (user_id, session_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )
    `);

    await conn.execute(`
      CREATE TABLE IF NOT EXISTS blogs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        author_id INT NOT NULL,
        category VARCHAR(100),
        content LONGTEXT,
        featured_image VARCHAR(255),
        status ENUM('published','draft') NOT NULL DEFAULT 'draft',
        views INT DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT NOW(),
        FOREIGN KEY (author_id) REFERENCES users(id)
      )
    `);

    // Check if already seeded
    const [[{ cnt }]] = await conn.execute('SELECT COUNT(*) as cnt FROM users');
    if (cnt > 0) return;

    console.log('Seeding database with existing data...');

    const hashSync = (pw) => bcrypt.hashSync(pw, 10);

    // Seed users (exact data from previous SQLite db)
    const insertUser = `INSERT INTO users (name, email, password_hash, phone, address, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const ts = '2026-03-10 11:37:09';

    const [r1] = await conn.execute(insertUser, ['Admin User', 'admin@gym.com', hashSync('admin123'), '555-0100', '1 Gym Plaza', 'admin', 'active', ts]);
    const [r2] = await conn.execute(insertUser, ['Sarah Connorddd', 'sarah@gym.com', hashSync('trainer123'), '555-0101', '2 Fitness Ave', 'trainer', 'active', ts]);
    const [r3] = await conn.execute(insertUser, ['Mike Johnson', 'mike@gym.com', hashSync('trainer123'), '555-0102', '3 Health Blvd', 'trainer', 'active', ts]);
    const [r4] = await conn.execute(insertUser, ['Alice Smith', 'alice@gym.com', hashSync('member123'), '555-0201', '10 Oak Street', 'member', 'active', ts]);
    const [r5] = await conn.execute(insertUser, ['Bob Brown', 'bob@gym.com', hashSync('member123'), '555-0202', '11 Pine Lane', 'member', 'active', ts]);
    const [r6] = await conn.execute(insertUser, ['Carol White', 'carol@gym.com', hashSync('member123'), '555-0203', '12 Maple Drive', 'member', 'active', ts]);

    const adminId = r1.insertId, trainer1Id = r2.insertId, trainer2Id = r3.insertId;
    const member1Id = r4.insertId, member2Id = r5.insertId, member3Id = r6.insertId;

    // Seed activities
    const insertActivity = `INSERT INTO activities (name, description, status) VALUES (?, ?, ?)`;
    const [a1] = await conn.execute(insertActivity, ['Yoga', 'Mind and body balance through yoga postures and breathing exercises.', 'active']);
    const [a2] = await conn.execute(insertActivity, ['CrossFit', 'High-intensity functional fitness training.', 'active']);
    const [a3] = await conn.execute(insertActivity, ['Spinning', 'Indoor cycling cardio workout.', 'active']);
    const [a4] = await conn.execute(insertActivity, ['Boxing', 'Fitness boxing for strength and coordination.', 'active']);
    const [a5] = await conn.execute(insertActivity, ['Pilates', 'Core strengthening and flexibility training.', 'active']);
    const [a6] = await conn.execute(insertActivity, ['Zumba', 'Dance-based aerobic fitness class.', 'active']);
    const [a7] = await conn.execute(insertActivity, ['Strength Training', 'Weightlifting and resistance training.', 'active']);

    const act1 = a1.insertId, act2 = a2.insertId, act3 = a3.insertId, act4 = a4.insertId;
    const act5 = a5.insertId, act6 = a6.insertId;

    // Seed locations
    const insertLocation = `INSERT INTO locations (name, address, capacity, status) VALUES (?, ?, ?, ?)`;
    const [l1] = await conn.execute(insertLocation, ['Main Studio', '1 Gym Plaza, Studio A', 30, 'active']);
    const [l2] = await conn.execute(insertLocation, ['Fitness Hall', '1 Gym Plaza, Hall B', 50, 'active']);
    const [l3] = await conn.execute(insertLocation, ['Spin Room', '1 Gym Plaza, Room C', 20, 'active']);
    const [l4] = await conn.execute(insertLocation, ['Boxing Ring', '1 Gym Plaza, Room D', 15, 'active']);
    const [l5] = await conn.execute(insertLocation, ['Yoga Studio', '2 Fitness Ave, Studio 1', 25, 'active']);
    const [l6] = await conn.execute(insertLocation, ['Outdoor Court', '2 Fitness Ave, Outdoor', 40, 'inactive']);

    const loc1 = l1.insertId, loc2 = l2.insertId, loc3 = l3.insertId;
    const loc4 = l4.insertId, loc5 = l5.insertId;

    // Seed sessions
    const insertSession = `INSERT INTO sessions (name, activity_id, location_id, trainer_id, date, time, duration_minutes, max_participants, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const [s1] = await conn.execute(insertSession, ['Morning Yoga Flow', act1, loc5, trainer1Id, '2026-03-15', '07:00:00', 60, 20, 'Energizing morning yoga session for all levels.', ts]);
    const [s2] = await conn.execute(insertSession, ['CrossFit HIIT Blast', act2, loc2, trainer2Id, '2026-03-16', '09:00:00', 45, 30, 'Intense HIIT-style CrossFit workout.', ts]);
    const [s3] = await conn.execute(insertSession, ['Evening Spin Class', act3, loc3, trainer1Id, '2026-03-17', '18:00:00', 50, 18, 'High-energy spinning to great music.', ts]);
    const [s4] = await conn.execute(insertSession, ['Boxing Fundamentals', act4, loc4, trainer2Id, '2026-03-18', '10:00:00', 60, 12, 'Learn boxing basics and get a great workout.', ts]);
    const [s5] = await conn.execute(insertSession, ['Power Pilates', act5, loc1, trainer1Id, '2026-03-20', '08:00:00', 55, 22, 'Strengthen your core with power pilates.', ts]);
    const [s6] = await conn.execute(insertSession, ['Zumba Party', act6, loc2, trainer2Id, '2026-03-21', '11:00:00', 60, 40, 'Dance your way to fitness!', ts]);
    const [s7] = await conn.execute(insertSession, ['Advanced Yoga', act1, loc5, trainer1Id, '2026-03-22', '07:30:00', 75, 15, 'Advanced yoga for experienced practitioners.', ts]);
    const [s8] = await conn.execute(insertSession, ['CrossFit Strength', act2, loc2, trainer2Id, '2026-03-14', '09:00:00', 60, 25, 'Strength-focused CrossFit session.', ts]);

    const sess1 = s1.insertId, sess2 = s2.insertId, sess3 = s3.insertId, sess4 = s4.insertId;
    const sess5 = s5.insertId, sess6 = s6.insertId, sess8 = s8.insertId;

    // Seed bookings
    const insertBooking = `INSERT INTO bookings (user_id, session_id, status, created_at) VALUES (?, ?, ?, ?)`;
    await conn.execute(insertBooking, [member1Id, sess1, 'confirmed', ts]);
    await conn.execute(insertBooking, [member1Id, sess2, 'confirmed', ts]);
    await conn.execute(insertBooking, [member1Id, sess8, 'completed', ts]);
    await conn.execute(insertBooking, [member2Id, sess1, 'confirmed', ts]);
    await conn.execute(insertBooking, [member2Id, sess3, 'confirmed', ts]);
    await conn.execute(insertBooking, [member2Id, sess4, 'cancelled', ts]);
    await conn.execute(insertBooking, [member3Id, sess2, 'confirmed', ts]);
    await conn.execute(insertBooking, [member3Id, sess5, 'confirmed', ts]);
    await conn.execute(insertBooking, [member3Id, sess6, 'confirmed', ts]);
    await conn.execute(insertBooking, [member1Id, sess5, 'confirmed', ts]);

    // Seed blogs
    const insertBlog = `INSERT INTO blogs (title, author_id, category, content, status, views, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    await conn.execute(insertBlog, [
      'Top 10 Tips for Beginner Gym-Goers', trainer1Id, 'Fitness Tips',
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
      'published', 246, '2026-03-05 11:37:09'
    ]);

    await conn.execute(insertBlog, [
      'The Science of Muscle Building', trainer2Id, 'Science',
      `<p>Understanding how muscles grow can help you train smarter. Let's dive into the science.</p>
    <h2>Muscle Hypertrophy</h2>
    <p>Muscle growth (hypertrophy) occurs when muscle fibers are damaged through exercise and then repaired stronger.</p>
    <h2>Progressive Overload</h2>
    <p>Gradually increasing the weight, reps, or sets over time is the primary driver of muscle growth.</p>
    <h2>Protein Synthesis</h2>
    <p>Adequate protein intake (0.8-1g per pound of bodyweight) supports muscle repair and growth.</p>`,
      'published', 189, '2026-02-28 11:37:09'
    ]);

    await conn.execute(insertBlog, [
      'Yoga for Stress Relief', trainer1Id, 'Wellness',
      `<p>In today's fast-paced world, stress management is crucial. Yoga offers a holistic approach to finding calm.</p>
    <h2>Breathing Techniques</h2>
    <p>Pranayama breathing techniques can activate the parasympathetic nervous system, reducing stress hormones.</p>
    <h2>Mindfulness</h2>
    <p>Yoga encourages present-moment awareness, helping to break cycles of anxious thinking.</p>
    <h2>Physical Release</h2>
    <p>Gentle stretching releases physical tension stored in muscles due to stress.</p>`,
      'published', 312, '2026-03-08 11:37:09'
    ]);

    await conn.execute(insertBlog, [
      'Nutrition for Peak Performance', trainer2Id, 'Nutrition',
      `<p>What you eat directly impacts your gym performance. Here's a guide to fueling your workouts.</p>
    <h2>Pre-Workout Nutrition</h2>
    <p>Eat a balanced meal 2-3 hours before training. Focus on complex carbs and lean protein.</p>
    <h2>Post-Workout Recovery</h2>
    <p>Consume protein and carbohydrates within 30 minutes of finishing your workout.</p>`,
      'draft', 0, '2026-03-09 11:37:09'
    ]);

    console.log('Database seeded successfully!');
    console.log('Login credentials:');
    console.log('  Admin:   admin@gym.com / admin123');
    console.log('  Trainer: sarah@gym.com / trainer123');
    console.log('  Trainer: mike@gym.com  / trainer123');
    console.log('  Member:  alice@gym.com / member123');
  } finally {
    conn.release();
  }
}

initializeDatabase().catch(console.error);

module.exports = pool;
