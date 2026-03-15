// DEPRECATED — replaced by server.mjs
/*
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/blogs', require('./routes/blogs'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/locations', require('./routes/locations'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// SPA fallback for HTML files - serve index.html for unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\nGym Management Server running at http://localhost:${PORT}`);
  console.log(`\nDefault login credentials:`);
  console.log(`  Admin:   admin@gym.com / admin123`);
  console.log(`  Trainer: sarah@gym.com / trainer123`);
  console.log(`  Member:  alice@gym.com / member123\n`);
});
*/
