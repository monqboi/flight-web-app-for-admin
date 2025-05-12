import express from 'express';
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
  
    const sql = `
      INSERT INTO User (Username, Password, Firstname, Middlename, Lastname, Email, Phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(sql, [
      username, password,
      firstname, middlename || '',
      lastname || '', email, phone || ''
    ]);

    // Return userId back to client
    return res.json({
      message: 'User registered successfully',
      userId: result.insertId
    });

  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username or Email already exists' });
    }

    console.error("Registration error:", err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});


// ========== Login (Admin only) ==========
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Login attempt:", username);

    const sql = `
      SELECT u.UserID, u.Password, a.Role
      FROM User u
      JOIN Admin a ON u.UserID = a.UserID
      WHERE u.Username = ?
    `;

    const [results] = await db.query(sql, [username]); 
    if (results.length === 0) {
      console.warn("⚠️ No admin user found for username:", username);
      return res.status(401).json({ error: 'User not found or not an admin' });
    }

    const user = results[0];
    console.log("User from DB:", user);
    console.log("Password from request:", password);

    const isMatch = password === user.Password;
    console.log("Password match:", isMatch);

    if (!isMatch) {
      console.warn("Incorrect password for:", username);
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const token = jwt.sign(
      { userId: user.UserID, role: user.Role },
      JWT_SECRET,
      { expiresIn: '3h' }
    );

    console.log("Login success:", username);
    return res.json({
      message: 'Login successful',
      token,
      user: {
        userId: user.UserID,
        role: user.Role,
        username: username
      }
    });

  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: 'Unexpected server error', detail: err.message });
  }
});

export default router;
