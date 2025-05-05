import express from "express";
import db from "../db.js";

const router = express.Router();

// ------------- Passenger -------------

// Get all passengers
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        p.PassengerID,
        p.ReservationID,
        p.SeatID,
        p.Firstname,
        p.Middlename,
        p.Lastname,
        p.Nationality,
        p.BirthDate,
        p.PassportNumber,
        p.Address,
        u.Username,
        u.UserID,
        s.SeatNumber
      FROM Passenger p
      JOIN Reservation r ON p.ReservationID = r.ReservationID
      JOIN User u ON r.UserID = u.UserID
      JOIN Seat s ON r.SeatID = s.SeatID
    `);

    res.json(rows.map(row => ({
      id: row.PassengerID,
      reservationId: row.ReservationID,
      seat: row.SeatNumber,
      seatID: row.SeatID,
      userId: row.UserID,
      username: row.Username,
      fullname: `${row.Firstname} ${row.Middlename} ${row.Lastname}`.replace(/\s+/g, ' ').trim(),
      nationality: row.Nationality,
      birth: row.BirthDate,
      passport: row.PassportNumber,
      address: row.Address
    })));
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// Add new passenger
router.post("/", async (req, res) => {
  const {
    reservationId, seatID, firstName, middleName, lastName,
    nationality, birth, passport, address
  } = req.body;

  try {
    const [result] = await db.query(`
      INSERT INTO Passenger 
      (ReservationID, SeatID, Firstname, Middlename, Lastname, Nationality, BirthDate, PassportNumber, Address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [reservationId, seatID, firstName, middleName, lastName, nationality, birth, passport, address]);

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
    nationality, birth, passport, address
  } = req.body;

  try {
    await db.query(`
      UPDATE Passenger SET
        ReservationID = ?, SeatID = ?, Firstname = ?, Middlename = ?, Lastname = ?, 
        Nationality = ?, BirthDate = ?, PassportNumber = ?, Address = ?
      WHERE PassengerID = ?
    `, [reservationId, seatID, firstName, middleName, lastName, nationality, birth, passport, address, passengerID]);

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