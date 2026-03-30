import express from 'express';
import bcrypt from 'bcryptjs';
import { AuthController } from './AuthController.mjs';
import { UserModel } from '../models/UserModel.mjs';

export class UserController {
  static routes = express.Router();

  static {
    this.routes.get('/stats', AuthController.restrict(['admin']), UserController.getStats);
    this.routes.get('/',      AuthController.restrict(['admin']), UserController.listUsers);
    this.routes.get('/:id',   AuthController.restrict(['admin']), UserController.getUser);
    this.routes.post('/',     AuthController.restrict(['admin']), UserController.createUser);
    this.routes.put('/:id',   AuthController.restrict(['admin']), UserController.updateUser);
    this.routes.delete('/:id', AuthController.restrict(['admin']), UserController.deleteUser);
  }

  static async listUsers(req, res) {
    const { search, role, status } = req.query;
    const users = await UserModel.listUsers({ search, role, status });
    res.json({ users });
  }

  static async getStats(_req, res) {
    const stats = await UserModel.getStats();
    res.json(stats);
  }

  static async getUser(req, res) {
    const user = await UserModel.getFullById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  }

  static async createUser(req, res) {
    const { name, email, password, phone, address, role, status } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });

    const userRole   = ['member', 'trainer', 'admin'].includes(role) ? role : 'member';
    const userStatus = ['active', 'inactive'].includes(status) ? status : 'active';

    try {
      const existing = await UserModel.checkEmailExists(email.toLowerCase().trim());
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const hash = bcrypt.hashSync(password, 10);
      const insertId = await UserModel.createUser(
        name.trim(), email.toLowerCase().trim(), hash,
        phone || null, address || null, userRole, userStatus
      );
      const user = await UserModel.getFullById(insertId);
      res.status(201).json({ user });
    } catch {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  static async updateUser(req, res) {
    const existing = await UserModel.getFullById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'User not found' });

    const { name, email, phone, address, role, status, password } = req.body;
    const fields = {};

    if (name) fields.name = name.trim();
    if (email) {
      const conflict = await UserModel.checkEmailConflict(email.toLowerCase().trim(), req.params.id);
      if (conflict) return res.status(409).json({ error: 'Email already in use' });
      fields.email = email.toLowerCase().trim();
    }
    if (phone   !== undefined) fields.phone   = phone;
    if (address !== undefined) fields.address = address;
    if (role   && ['member', 'trainer', 'admin'].includes(role))   fields.role   = role;
    if (status && ['active', 'inactive'].includes(status))         fields.status = status;
    if (password) fields.passwordHash = bcrypt.hashSync(password, 10);

    if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'No fields to update' });

    await UserModel.updateUser(req.params.id, fields);
    const updated = await UserModel.getFullById(req.params.id);
    res.json({ user: updated });
  }

  static async deleteUser(req, res) {
    const user = await UserModel.getFullById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await UserModel.deactivateUser(req.params.id);
    res.json({ message: 'User deactivated' });
  }
}
