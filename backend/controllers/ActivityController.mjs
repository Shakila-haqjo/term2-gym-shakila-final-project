import express from 'express';
import { AuthController } from './AuthController.mjs';
import { ActivityModel } from '../models/ActivityModel.mjs';

export class ActivityController {
  static routes = express.Router();

  static {
    this.routes.get('/',      AuthController.restrict(),          ActivityController.listActivities);
    this.routes.post('/',     AuthController.restrict(['admin']), ActivityController.createActivity);
    this.routes.put('/:id',   AuthController.restrict(['admin']), ActivityController.updateActivity);
    this.routes.delete('/:id', AuthController.restrict(['admin']), ActivityController.deleteActivity);
  }

  static async listActivities(req, res) {
    const activeOnly = req.user.role === 'member';
    const activities = await ActivityModel.listActivities(activeOnly);
    res.json({ activities });
  }

  static async createActivity(req, res) {
    const { name, description, status } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const actStatus = ['active', 'inactive'].includes(status) ? status : 'active';
    try {
      const insertId = await ActivityModel.createActivity(name.trim(), description || null, actStatus);
      const activity = await ActivityModel.findById(insertId);
      res.status(201).json({ activity });
    } catch {
      res.status(500).json({ error: 'Failed to create activity' });
    }
  }

  static async updateActivity(req, res) {
    const activity = await ActivityModel.findById(req.params.id);
    if (!activity) return res.status(404).json({ error: 'Activity not found' });

    const { name, description, status } = req.body;
    const newName   = name        !== undefined ? name.trim()   : activity.name;
    const newDesc   = description !== undefined ? description   : activity.description;
    const newStatus = status && ['active', 'inactive'].includes(status) ? status : activity.status;

    await ActivityModel.updateActivity(req.params.id, newName, newDesc, newStatus);
    const updated = await ActivityModel.findById(req.params.id);
    res.json({ activity: updated });
  }

  static async deleteActivity(req, res) {
    const activity = await ActivityModel.findById(req.params.id);
    if (!activity) return res.status(404).json({ error: 'Activity not found' });

    const used = await ActivityModel.countUsage(req.params.id);
    if (used > 0) {
      await ActivityModel.deactivateActivity(req.params.id);
      return res.json({ message: 'Activity deactivated (used in sessions)' });
    }
    await ActivityModel.deleteActivity(req.params.id);
    res.json({ message: 'Activity deleted' });
  }
}
