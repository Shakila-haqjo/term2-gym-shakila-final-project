// controllers/activity/activityController.js

const Activity = require('../../models/Activity');

// Get all activities
exports.getAllActivities = async (req, res) => {
    try {
        const activities = await Activity.findAll();
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single activity by ID
exports.getActivityById = async (req, res) => {
    try {
        const activity = await Activity.findById(req.params.id);
        if (!activity) {
            return res.status(404).json({ error: 'Activity not found' });
        }
        res.json(activity);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create new activity
exports.createActivity = async (req, res) => {
    try {
        const { name, description, duration_minutes } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Activity name is required' });
        }

        const activityId = await Activity.create({
            name,
            description: description || null,
            duration_minutes: duration_minutes || 60
        });

        const activity = await Activity.findById(activityId);
        res.status(201).json(activity);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update activity
exports.updateActivity = async (req, res) => {
    try {
        const { name, description, duration_minutes } = req.body;
        const activityId = req.params.id;

        const activity = await Activity.findById(activityId);
        if (!activity) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        await Activity.update(activityId, {
            name: name || activity.name,
            description: description !== undefined ? description : activity.description,
            duration_minutes: duration_minutes || activity.duration_minutes
        });

        const updatedActivity = await Activity.findById(activityId);
        res.json(updatedActivity);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete activity
exports.deleteActivity = async (req, res) => {
    try {
        const activityId = req.params.id;

        const activity = await Activity.findById(activityId);
        if (!activity) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        await Activity.delete(activityId);
        res.json({ message: 'Activity deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};