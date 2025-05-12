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
        CheckinStatus,
        FlightID
      FROM Seat
      WHERE FlightID = ?
      ORDER BY SeatNumber
    `, [flightId]);
    console.log("🔥 Seats for flight", flightId, result);
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

//4. Add new seat
router.post("/", verifyToken, allowRoles("superadmin", "flightadmin"), async (req, res) => {
  const { SeatNumber, SeatClass, Available, CheckinStatus, FlightID } = req.body;

  if (!SeatNumber || !SeatClass || !Available || !CheckinStatus || !FlightID) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const checkQuery = `SELECT * FROM Seat WHERE SeatNumber = ? AND FlightID = ?`;
    const [existing] = await db.query(checkQuery, [SeatNumber, FlightID]);

    if (existing.length > 0) {
      return res.status(409).json({ error: "SeatNumber already exists in this flight" });
    }

    const insertQuery = `
      INSERT INTO Seat (SeatNumber, SeatClass, Available, CheckinStatus, FlightID)
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.query(insertQuery, [SeatNumber, SeatClass, Available, CheckinStatus, FlightID]);

    res.status(201).json({ message: "Seat added successfully" });
  } catch (err) {
    console.error("Add seat error:", err);
    res.status(500).json({ error: "Failed to add seat" });
  }
});

// modify seat
router.put("/:seatNumber", verifyToken, allowRoles("superadmin", "seatadmin"), async (req, res) => {
  const seatNumber = req.params.seatNumber;
  const { SeatClass, Available, CheckinStatus, FlightID } = req.body;

  try {
    await db.query(
      `UPDATE Seat SET SeatClass = ?, Available = ?, CheckinStatus = ?  WHERE SeatNumber = ? AND FlightID = ?`,
      [SeatClass, Available, CheckinStatus, seatNumber, FlightID]
    );

    res.json({ message: "Seat info updated" });
  } catch (err) {
    console.error("Seat update error:", err);
    res.status(500).json({ error: "Failed to update seat" });
  }
});

// DELETE /api/seats/:seatNumber
router.delete("/:seatNumber", verifyToken, allowRoles("superadmin", "seatadmin"), async (req, res) => {
  const seatNumber = req.params.seatNumber;
  const { FlightID } = req.body;

  try {
    const [result] = await db.query(
      `DELETE FROM Seat WHERE SeatNumber = ? AND FlightID = ?`,
      [seatNumber, FlightID]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Seat not found" });
    }

    res.json({ message: "Seat deleted successfully" });
  } catch (err) {
    console.error("Delete seat error:", err);
    res.status(500).json({ error: "Failed to delete seat" });
  }
});



export default router;
