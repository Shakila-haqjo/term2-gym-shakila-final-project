import express from 'express';
import { AuthController } from './AuthController.mjs';
import { LocationModel } from '../models/LocationModel.mjs';

export class LocationController {
  static routes = express.Router();

  static {
    this.routes.param('id', (_req, res, next, id) => {
      if (!/^\d+$/.test(id)) return res.status(400).json({ error: 'Invalid ID' });
      next();
    });

    this.routes.get('/',      AuthController.restrict(),          LocationController.listLocations);
    this.routes.post('/',     AuthController.restrict(['admin']), LocationController.createLocation);
    this.routes.put('/:id',   AuthController.restrict(['admin']), LocationController.updateLocation);
    this.routes.delete('/:id', AuthController.restrict(['admin']), LocationController.deleteLocation);
  }

  static async listLocations(req, res) {
    const activeOnly = req.user.role === 'member';
    const locations = await LocationModel.listLocations(activeOnly);
    res.json({ locations });
  }

  static async createLocation(req, res) {
    const { name, address, capacity, status } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const locStatus = ['active', 'inactive'].includes(status) ? status : 'active';
    try {
      const insertId = await LocationModel.createLocation(name.trim(), address || null, capacity || 20, locStatus);
      const location = await LocationModel.findById(insertId);
      res.status(201).json({ location });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: `A location named "${name.trim()}" already exists.` });
      res.status(500).json({ error: `Failed to create location: ${err.message || 'database error'}` });
    }
  }

  static async updateLocation(req, res) {
    try {
      const location = await LocationModel.findById(req.params.id);
      if (!location) return res.status(404).json({ error: 'Location not found' });

      const { name, address, capacity, status } = req.body;
      const fields = {};
      if (name)                                              fields.name     = name.trim();
      if (address !== undefined)                             fields.address  = address || null;
      if (capacity !== undefined && capacity !== null && capacity !== '') fields.capacity = parseInt(capacity);
      if (status && ['active', 'inactive'].includes(status)) fields.status  = status;

      if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'No fields to update' });

      await LocationModel.updateLocation(req.params.id, fields);
      const updated = await LocationModel.findById(req.params.id);
      res.json({ location: updated });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: `A location with that name already exists.` });
      res.status(500).json({ error: `Failed to update location: ${err.message || 'database error'}` });
    }
  }

  static async deleteLocation(req, res) {
    const location = await LocationModel.findById(req.params.id);
    if (!location) return res.status(404).json({ error: 'Location not found' });

    const used = await LocationModel.countUsage(req.params.id);
    if (used > 0) {
      await LocationModel.deactivateLocation(req.params.id);
      return res.json({ message: 'Location deactivated (used in sessions)' });
    }
    await LocationModel.deleteLocation(req.params.id);
    res.json({ message: 'Location deleted' });
  }
}
