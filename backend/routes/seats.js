import express from 'express';
import db from '../db.js';
import { verifyToken, allowRoles } from '../middleware/role.js';

const router = express.Router();

// ✅ GET /api/seats/:flightId → Get all seats for a flight
router.get('/:flightId', verifyToken, allowRoles('Super Admin', 'Flight Admin'), (req, res) => {
  const flightId = req.params.flightId;

  const sql = `
    SELECT 
      SeatID,
      SeatNumber,
      SeatClass,
      Available,
      CheckinStatus
    FROM Seat
    WHERE FlightID = ?
    ORDER BY SeatNumber
  `;

  db.query(sql, [flightId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to load seats', detail: err });
    res.json(result);
  });
});

export default router;
