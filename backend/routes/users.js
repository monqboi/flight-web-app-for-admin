import express from 'express';
import db from '../db.js';
import { verifyToken, allowRoles } from '../middleware/role.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// ✅ 1. Get all users
router.get('/', verifyToken, allowRoles('Super Admin', 'User Admin'), (req, res) => {
  db.query('SELECT * FROM User', (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to load users' });
    res.json(result);
  });
});

// ✅ 2. Get user by ID
router.get('/:id', verifyToken, allowRoles('Super Admin', 'User Admin'), (req, res) => {
  const userId = req.params.id;
  db.query('SELECT * FROM User WHERE UserID = ?', [userId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to load user' });
    if (result.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result[0]);
  });
});

// ✅ 3. Update user info
router.put('/:id', verifyToken, allowRoles('Super Admin', 'User Admin'), (req, res) => {
  const userId = req.params.id;
  const {
    username, password, firstname, middlename,
    lastname, email, phone, passport,
    nationality, birthdate, address
  } = req.body;

  const sql = `
    UPDATE User SET
      Username = ?, ${password ? 'Password = ?,' : ''}
      Firstname = ?, Middlename = ?, Lastname = ?,
      Email = ?, Phone = ?, Passport = ?,
      Nationality = ?, Birthdate = ?, Address = ?
    WHERE UserID = ?
  `;

  const values = [
    username,
    ...(password ? [password] : []),
    firstname, middlename || '', lastname || '',
    email, phone || '', passport || '',
    nationality || '', birthdate || '', address || '',
    userId
  ];

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: 'Update failed', detail: err });
    res.json({ message: 'User updated' });
  });
});

// ✅ 4. Change status (Active/Suspended)
router.patch('/:id/status', verifyToken, allowRoles('Super Admin', 'User Admin'), (req, res) => {
  const userId = req.params.id;
  const { status } = req.body;

  db.query('UPDATE User SET Status = ? WHERE UserID = ?', [status, userId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Status update failed' });
    res.json({ message: 'Status updated' });
  });
});

// ✅ 5. Upload profile image
router.post('/:id/profile', verifyToken, allowRoles('Super Admin', 'User Admin'), (req, res) => {
  const userId = req.params.id;
  const { imageUrl } = req.body;

  if (!imageUrl) return res.status(400).json({ error: 'Missing imageUrl' });

  db.query('UPDATE User SET ProfilePicture = ? WHERE UserID = ?', [imageUrl, userId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Image upload failed' });
    res.json({ message: 'Profile updated', imageUrl });
  });
});

// ✅ 6. Get user's booking history
router.get('/:id/bookings', verifyToken, allowRoles('Super Admin', 'User Admin'), (req, res) => {
  const userId = req.params.id;

  const sql = `
    SELECT 
      r.ReservationID AS bookingId,
      f.Departure AS \`from\`,
      f.Destination AS \`to\`,
      f.DepartureDateTime AS depart,
      f.ArrivalDateTime AS arrive,
      TIMESTAMPDIFF(MINUTE, f.DepartureDateTime, f.ArrivalDateTime) AS duration,
      f.StopOver AS stops
    FROM Reservation r
    JOIN Flight f ON r.FlightID = f.FlightID
    WHERE r.UserID = ?
  `;

  db.query(sql, [userId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to load bookings', detail: err });
    res.json(result);
  });
});

// ✅ 7. Get user's payment history
router.get('/:id/payments', verifyToken, allowRoles('Super Admin', 'Finance Admin'), (req, res) => {
  const userId = req.params.id;

  const sql = `
    SELECT 
      p.PaymentID AS paymentId,
      CONCAT(f.Departure, ' → ', f.Destination) AS route,
      p.PaymentDate AS date,
      p.Amount AS amount,
      p.Status AS status
    FROM Payment p
    JOIN Reservation r ON p.ReservationID = r.ReservationID
    JOIN Flight f ON r.FlightID = f.FlightID
    WHERE p.UserID = ?
  `;

  db.query(sql, [userId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to load payments', detail: err });
    res.json(result);
  });
});

// ✅ 8. Add new user (by Admin panel)
router.post('/', verifyToken, allowRoles('Super Admin', 'User Admin'), async (req, res) => {
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
          if (err) return res.status(500).json({ error: 'Add user failed', detail: err });
          res.json({ message: 'User added successfully', userId: result.insertId });
        }
      );
    } catch (err) {
      res.status(500).json({ error: 'Server error', detail: err });
    }
  });

export default router;
