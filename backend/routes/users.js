import express from 'express';
import db from '../db.js';
import { verifyToken, allowRoles } from '../middleware/role.js';

const router = express.Router();

// Get all users
router.get('/', verifyToken, allowRoles('superadmin', 'useradmin'), async (req, res) => {
  try {
    const [result] = await db.query('SELECT * FROM User');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load users' });
  }
});


// Get user by ID (self or admin)
router.get('/:id', verifyToken, async (req, res) => {
  const userId = Number(req.params.id);
  const requesterId = req.user.UserID;
  const role = req.user.role || req.user.Role; 

  // if (!(requesterId === userId || ['superadmin', 'useradmin'].includes(role?.toLowerCase()))) {
  //   return res.status(403).json({ error: 'Access denied' });
  // }

  try {
    const [result] = await db.query('SELECT * FROM User WHERE UserID = ?', [userId]);
    if (result.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load user', detail: err.message });
  }
});


// Update user info
router.put('/:id', verifyToken, allowRoles('superadmin', 'useradmin'), async (req, res) => {
  const userId = req.params.id;
  const {
    username, password, firstname, middlename,
    lastname, email, phone, profilePicture
  } = {
    username: req.body.username ?? req.body.Username,
    password: req.body.password ?? req.body.Password,
    firstname: req.body.firstname ?? req.body.Firstname,
    middlename: req.body.middlename ?? req.body.Middlename,
    lastname: req.body.lastname ?? req.body.Lastname,
    email: req.body.email ?? req.body.Email,
    phone: req.body.phone ?? req.body.Phone,
    profilePicture: req.body.profilePicture ?? req.body.ProfilePicture,
  }

  try {
    let sql, values;

    if (password) {

      sql = `
        UPDATE User SET
          Username = ?, Password = ?, Firstname = ?, Middlename = ?, Lastname = ?,
          Email = ?, Phone = ?, ProfilePicture = ?
        WHERE UserID = ?
      `;
      values = [
        username, password, firstname, middlename || '', lastname || '',
        email, phone || '', profilePicture || '', userId
      ];
    } else {
      sql = `
        UPDATE User SET
          Username = ?, Firstname = ?, Middlename = ?, Lastname = ?,
          Email = ?, Phone = ?, ProfilePicture = ?
        WHERE UserID = ?
      `;
      values = [
        username, firstname, middlename || '', lastname || '',
        email, phone || '', profilePicture || '', userId
      ];
    }

    await db.query(sql, values);
    res.json({ message: 'User updated' });

  } catch (err) {
    res.status(500).json({ error: 'Update failed', detail: err.message });
  }
});

// Upload profile image
router.post('/:id/profile', verifyToken, allowRoles('superadmin', 'useradmin'), async (req, res) => {
  const userId = req.params.id
  const { imageUrl } = req.body

  if (!imageUrl) {
    return res.status(400).json({ error: 'Missing imageUrl' })
  }

  try {
    await db.query('UPDATE User SET ProfilePicture = ? WHERE UserID = ?', [imageUrl, userId])
    res.json({ message: 'Profile updated', imageUrl })
  } catch (err) {
    res.status(500).json({ error: 'Image upload failed' })
  }
})


// Get user's booking history
router.get('/:id/bookings', verifyToken, allowRoles('superadmin', 'flightadmin', 'useradmin'), async (req, res) => {
  const userId = req.params.id;

  const sql = `
    SELECT 
      r.ReservationID AS bookingId,
      f.Departure AS from_location,
      f.Destination AS to_location,
      f.DepartureDateTime AS depart,
      f.ArrivalDateTime AS arrive,
      TIMESTAMPDIFF(MINUTE, f.DepartureDateTime, f.ArrivalDateTime) AS duration
    FROM Reservation r
    LEFT JOIN Flight f ON r.FlightID = f.FlightID
    WHERE r.UserID = ?
  `;

  try {
    const [result] = await db.query(sql, [userId]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load bookings', detail: err.message });
  }
});

// Get user's payment history
router.get('/:id/payments', verifyToken, allowRoles('superadmin', 'financeadmin', 'useradmin'), async (req, res) => {
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

  try {
    const [result] = await db.query(sql, [userId]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load payments', detail: err.message });
  }
});

// PATCH: update UserStatus
router.patch('/:id/status', verifyToken, allowRoles('superadmin', 'useradmin'), async (req, res) => {
  const userId = req.params.id
  const { status } = req.body

  if (!['Active', 'Suspended'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' })
  }

  try {
    await db.query('UPDATE User SET UserStatus = ? WHERE UserID = ?', [status, userId])
    res.json({ message: 'User status updated successfully' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user status', detail: err.message })
  }
})

// Add new user (by Admin panel)
router.post('/', verifyToken, allowRoles('superadmin', 'useradmin'), async (req, res) => {
  const { username, password, firstname, middlename, lastname, email, phone } = req.body;

  if (!username || !password || !firstname || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {

    const sql = `
      INSERT INTO User (Username, Password, Firstname, Middlename, Lastname, Email, Phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(
      sql,
      [username, password, firstname, middlename  || '', lastname || '', email, phone || '']
    );
    res.json({ message: 'User added successfully', userId: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username or Email already exists' });
    }
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

router.delete('/:id', verifyToken, allowRoles('superadmin', 'useradmin'), async (req, res) => {
  const userId = req.params.id;

  try {
    // ตรวจสอบก่อนว่าผู้ใช้มี role หรือไม่
    const [adminCheck] = await db.query('SELECT * FROM Admin WHERE UserID = ?', [userId]);
    if (adminCheck.length > 0) {
      await db.query('DELETE FROM Admin WHERE UserID = ?', [userId]);
    }

    // ลบ user ต่อ
    const [result] = await db.query('DELETE FROM User WHERE UserID = ?', [userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User and admin role deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user', detail: err.message });
  }
});


export default router;
