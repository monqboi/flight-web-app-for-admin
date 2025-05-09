import express from 'express';
import db from '../db.js';
import { verifyToken, allowRoles } from '../middleware/role.js';

const router = express.Router();

// ✅ GET /api/admins - Load all admins
router.get('/', verifyToken, allowRoles('Super Admin'), (req, res) => {
  const sql = `
    SELECT 
      a.UserID,
      u.Username,
      u.Firstname,
      u.Lastname,
      a.Role
    FROM Admin a
    JOIN User u ON a.UserID = u.UserID
  `;

  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to load admins', detail: err });
    res.json(result);
  });
});

// ✅ POST /api/admins/:userId - Add new admin with role
router.post('/:userId', verifyToken, allowRoles('Super Admin'), (req, res) => {
  const userId = req.params.userId;
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({ error: 'Missing role' });
  }

  const checkSql = 'SELECT * FROM Admin WHERE UserID = ?';
  db.query(checkSql, [userId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Check failed', detail: err });

    if (result.length > 0) {
      return res.status(400).json({ error: 'User is already an admin' });
    }

    const insertSql = 'INSERT INTO Admin (UserID, Role) VALUES (?, ?)';
    db.query(insertSql, [userId, role], (err2) => {
      if (err2) return res.status(500).json({ error: 'Add admin failed', detail: err2 });
      res.json({ message: 'Admin added successfully' });
    });
  });
});

// ✅ DELETE /api/admins/:userId - Remove admin
router.delete('/:userId', verifyToken, allowRoles('Super Admin'), (req, res) => {
  const userId = req.params.userId;

  const deleteSql = 'DELETE FROM Admin WHERE UserID = ?';
  db.query(deleteSql, [userId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Delete admin failed', detail: err });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    res.json({ message: 'Admin removed successfully' });
  });
});

export default router;
