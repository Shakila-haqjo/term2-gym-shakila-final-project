// backend/routes/blogRoutes.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Blog routes - coming soon' });
});

module.exports = router;
