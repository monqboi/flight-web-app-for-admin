import express from 'express';
import db from '../db.js';
import { verifyToken, allowRoles } from '../middleware/role.js';

const router = express.Router();

//1. GET /api/seats/:flightId → Get all seats of a flight
router.get('/:flightId', verifyToken, allowRoles('superadmin', 'flightadmin'), async (req, res) => {
  const flightId = req.params.flightId;

  try {
    const [result] = await db.query(`
      SELECT 
        SeatID,
        SeatNumber,
        SeatClass,
        Available,
        CheckinStatus
      FROM Seat
      WHERE FlightID = ?
      ORDER BY SeatNumber
    `, [flightId]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load seats', detail: err.message });
  }
});

//2. GET /api/seats/:flightId/available → Get available seats
router.get('/:flightId/available', verifyToken, allowRoles('superadmin', 'flightadmin'), async (req, res) => {
  const flightId = req.params.flightId;

  try {
    const [result] = await db.query(`
      SELECT 
        SeatID,
        SeatNumber,
        SeatClass
      FROM Seat
      WHERE FlightID = ? AND Available = 'Yes'
      ORDER BY SeatNumber
    `, [flightId]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load available seats', detail: err.message });
  }
});

//3. PATCH /api/seats/:seatId → Update availability status
router.patch('/:seatId', verifyToken, allowRoles('superadmin', 'flightadmin'), async (req, res) => {
  const seatId = req.params.seatId;
  const { available } = req.body; // 'Yes' or 'No'

  if (!['Yes', 'No'].includes(available)) {
    return res.status(400).json({ error: 'Invalid value for available (must be Yes or No)' });
  }

  try {
    await db.query(
      `UPDATE Seat SET Available = ? WHERE SeatID = ?`,
      [available, seatId]
    );
    res.json({ message: 'Seat availability updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update seat', detail: err.message });
  }
});

export default router;
