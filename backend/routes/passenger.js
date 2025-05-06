import express from "express";
import db from "../db.js";

const router = express.Router();

// ------------- Passenger -------------

// Get all passengers from Flight
router.get('/', async (req, res) => {
  const { flightID } = req.query;

  try {
    let sql = `
      SELECT 
        pa.PassengerID,
        pa.ReservationID,
        pa.SeatID,
        pa.Firstname,
        pa.Middlename,
        pa.Lastname,
        pa.Nationality,
        pa.Birth,
        pa.PassportNumber,
        pa.Address,
        u.UserID,
        u.Username,
        s.SeatNumber
      FROM Passenger pa
      JOIN Reservation r ON pa.ReservationID = r.ReservationID
      JOIN User u ON r.UserID = u.UserID
      JOIN Seat s ON pa.SeatID = s.SeatID
    `;

    const params = [];

    if (flightID) {
      sql += ` WHERE r.FlightID = ?`;
      params.push(flightID);
    }

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Failed to load passengers:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new passenger
router.post("/", async (req, res) => {
  const {
    reservationId, seatID, firstName, middleName, lastName,
    nationality, passport, address
  } = req.body;

  try {
    const [result] = await db.query(`
      INSERT INTO Passenger 
      (ReservationID, SeatID, Firstname, Middlename, Lastname, Nationality, PassportNumber, Address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [reservationId, seatID, firstName, middleName, lastName, nationality, passport, address]);

    res.status(201).json({ message: "Passenger added", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to insert passenger");
  }
});

// Update passenger
router.put("/:id", async (req, res) => {
  const passengerID = req.params.id;
  const {
    reservationId, seatID, firstName, middleName, lastName,
    nationality, passport, address
  } = req.body;

  try {
    await db.query(`
      UPDATE Passenger SET
        ReservationID = ?, SeatID = ?, Firstname = ?, Middlename = ?, Lastname = ?, 
        Nationality = ?, PassportNumber = ?, Address = ?
      WHERE PassengerID = ?
    `, [reservationId, seatID, firstName, middleName, lastName, nationality, passport, address, passengerID]);

    res.json({ message: "Passenger updated" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to update passenger");
  }
});

// Delete passenger
router.delete("/:id", async (req, res) => {
  const passengerID = req.params.id;
  try {
    const [result] = await db.query("DELETE FROM Passenger WHERE PassengerID = ?", [passengerID]);

    if (result.affectedRows === 0) return res.status(404).send("Passenger not found");
    res.json({ message: "Passenger deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to delete passenger");
  }
});

export default router;