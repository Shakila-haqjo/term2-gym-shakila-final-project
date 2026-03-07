// backend/routes/locationRoutes.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Location routes - coming soon' });
});

module.exports = router;
