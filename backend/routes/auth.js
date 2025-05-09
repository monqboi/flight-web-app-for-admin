import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';

const router = express.Router();

const JWT_SECRET = 'n0b0yH3r3!SuperJWT-Key-456@#';

// ========== Register (User only, not Admin) ==========
router.post('/register', async (req, res) => {
  const { username, password, firstname, middlename, lastname, email, phone } = req.body;

  if (!username || !password || !firstname || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO User (Username, Password, Firstname, Middlename, Lastname, Email, Phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(
      sql,
      [username, hashedPassword, firstname, middlename || '', lastname || '', email, phone || ''],
      (err, result) => {
        if (err) return res.status(500).json({ error: 'Registration failed', detail: err });
        res.json({ message: 'User registered', userId: result.insertId });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: err });
  }
});

// ========== Login (Admin only) ==========
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const sql = `
    SELECT u.UserID, u.Password, a.Role
    FROM User u
    JOIN Admin a ON u.UserID = a.UserID
    WHERE u.Username = ?
  `;

  db.query(sql, [username], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Login failed', detail: err });
    if (results.length === 0) {
      return res.status(401).json({ error: 'User not found or not an admin' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) return res.status(401).json({ error: 'Incorrect password' });

    const token = jwt.sign(
      { userId: user.UserID, role: user.Role },
      JWT_SECRET, // ✅ ใช้รหัสตรงนี้แทน
      { expiresIn: '3h' }
    );

    res.json({ message: 'Login successful', token });
  });
});

export default router;
