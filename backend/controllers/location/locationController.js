// controllers/location/locationController.js

const Location = require('../../models/Location');

// Get all locations
exports.getAllLocations = async (req, res) => {
    try {
        const locations = await Location.findAll();
        res.json(locations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single location by ID
exports.getLocationById = async (req, res) => {
    try {
        const location = await Location.findById(req.params.id);
        if (!location) {
            return res.status(404).json({ error: 'Location not found' });
        }
        res.json(location);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create new location
exports.createLocation = async (req, res) => {
    try {
        const { name, address } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Location name is required' });
        }

        const locationId = await Location.create({
            name,
            address: address || null
        });

        const location = await Location.findById(locationId);
        res.status(201).json(location);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update location
exports.updateLocation = async (req, res) => {
    try {
        const { name, address } = req.body;
        const locationId = req.params.id;

        const location = await Location.findById(locationId);
        if (!location) {
            return res.status(404).json({ error: 'Location not found' });
        }

        await Location.update(locationId, {
            name: name || location.name,
            address: address !== undefined ? address : location.address
        });

        const updatedLocation = await Location.findById(locationId);
        res.json(updatedLocation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete location
exports.deleteLocation = async (req, res) => {
    try {
        const locationId = req.params.id;

        const location = await Location.findById(locationId);
        if (!location) {
            return res.status(404).json({ error: 'Location not found' });
        }

        await Location.delete(locationId);
        res.json({ message: 'Location deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};