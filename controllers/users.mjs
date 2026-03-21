import express from 'express';
import bcrypt from 'bcryptjs';
import { requireRole } from '../middleware/auth.mjs';
import * as User from '../models/UserModel.mjs';

const router = express.Router();

// GET /api/users - admin only
router.get('/', requireRole('admin'), async (req, res) => {
  const { search, role, status } = req.query;
  const users = await User.listUsers({ search, role, status });
  res.json({ users });
});

// GET /api/users/stats - admin only
router.get('/stats', requireRole('admin'), async (_req, res) => {
  const stats = await User.getStats();
  res.json(stats);
});

// GET /api/users/:id - admin only
router.get('/:id', requireRole('admin'), async (req, res) => {
  const user = await User.getFullById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// POST /api/users - admin only
router.post('/', requireRole('admin'), async (req, res) => {
  const { name, email, password, phone, address, role, status } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });

  const validRoles   = ['member', 'trainer', 'admin'];
  const userRole     = validRoles.includes(role) ? role : 'member';
  const userStatus   = ['active', 'inactive'].includes(status) ? status : 'active';

  try {
    const existing = await User.checkEmailExists(email.toLowerCase().trim());
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hash = bcrypt.hashSync(password, 10);
    const insertId = await User.createUser(
      name.trim(), email.toLowerCase().trim(), hash,
      phone || null, address || null, userRole, userStatus
    );
    const user = await User.getFullById(insertId);
    res.status(201).json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:id - admin only
router.put('/:id', requireRole('admin'), async (req, res) => {
  const existing = await User.getFullById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'User not found' });

  const { name, email, phone, address, role, status, password } = req.body;
  const fields = {};

  if (name)   fields.name    = name.trim();
  if (email) {
    const conflict = await User.checkEmailConflict(email.toLowerCase().trim(), req.params.id);
    if (conflict) return res.status(409).json({ error: 'Email already in use' });
    fields.email = email.toLowerCase().trim();
  }
  if (phone   !== undefined) fields.phone    = phone;
  if (address !== undefined) fields.address  = address;
  if (role   && ['member','trainer','admin'].includes(role))     fields.role   = role;
  if (status && ['active','inactive'].includes(status))         fields.status = status;
  if (password) fields.passwordHash = bcrypt.hashSync(password, 10);

  if (Object.keys(fields).length === 0) return res.status(400).json({ error: 'No fields to update' });

  await User.updateUser(req.params.id, fields);
  const updated = await User.getFullById(req.params.id);
  res.json({ user: updated });
});

// DELETE /api/users/:id - admin only (soft delete)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const user = await User.getFullById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  await User.deactivateUser(req.params.id);
  res.json({ message: 'User deactivated' });
});

export default router;
