import express from 'express';
import db from '../db.js';
import { verifyToken, allowRoles } from '../middleware/role.js';

const router = express.Router();

// GET /api/admins - Load all admins
router.get('/', verifyToken, allowRoles('superadmin'), async (req, res) => {
  try {
    const [result] = await db.query(`
      SELECT 
        a.UserID,
        u.Username,
        u.Firstname,
        u.Lastname,
        a.Role
      FROM Admin a
      JOIN User u ON a.UserID = u.UserID
    `);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load admins', detail: err });
  }
});

// POST /api/admins/:userId - Add new admin with role
router.post('/:userId', verifyToken, allowRoles('superadmin'), async (req, res) => {
  const userId = req.params.userId;
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ error: 'Missing role' });
  }

  try {
    const [existing] = await db.query('SELECT * FROM Admin WHERE UserID = ?', [userId]);

    if (existing.length > 0) {
      return res.status(400).json({ error: 'User is already an admin' });
    }

    await db.query('INSERT INTO Admin (UserID, Role) VALUES (?, ?)', [userId, role]);
    res.json({ message: 'Admin added successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Add admin failed', detail: err });
  }
});

// DELETE /api/admins/:userId - Remove admin
router.delete('/:userId', verifyToken, allowRoles('superadmin'), async (req, res) => {
  const userId = req.params.userId;

  try {
    const [result] = await db.query('DELETE FROM Admin WHERE UserID = ?', [userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    res.json({ message: 'Admin removed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Delete admin failed', detail: err });
  }
});

export default router;
