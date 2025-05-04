import express from "express";
import getDBConnection from "../db.js";

const router = express.Router();

// Get all passengers (optionally include joined data)
router.get("/", (req, res) => {
  const db = getDBConnection();
  const query = `
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
  `;

  db.query(query, (err, results) => {
    db.end();
    if (err) return res.status(500).send("Database error");
    res.json(results.map(row => ({
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
  });
});

// Add new passenger
router.post("/", (req, res) => {
  const db = getDBConnection();
  const {
    reservationId, seatID, firstName, middleName, lastName,
    nationality, birth, passport, address
  } = req.body;

  const query = `
    INSERT INTO Passenger 
    (ReservationID, SeatID, Firstname, Middlename, Lastname, Nationality, BirthDate, PassportNumber, Address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [reservationId, seatID, firstName, middleName, lastName, nationality, birth, passport, address];

  db.query(query, values, (err, result) => {
    db.end();
    if (err) return res.status(500).send("Failed to insert passenger");
    res.status(201).json({ message: "Passenger added", id: result.insertId });
  });
});

// Update passenger
router.put("/:id", (req, res) => {
  const db = getDBConnection();
  const passengerID = req.params.id;
  const {
    reservationId, seatID, firstName, middleName, lastName,
    nationality, birth, passport, address
  } = req.body;

  const query = `
    UPDATE Passenger SET
    ReservationID = ?, SeatID = ?, Firstname = ?, Middlename = ?, Lastname = ?, 
    Nationality = ?, BirthDate = ?, PassportNumber = ?, Address = ?
    WHERE PassengerID = ?
  `;
  const values = [reservationId, seatID, firstName, middleName, lastName, nationality, birth, passport, address, passengerID];

  db.query(query, values, (err) => {
    db.end();
    if (err) return res.status(500).send("Failed to update passenger");
    res.json({ message: "Passenger updated" });
  });
});

// Delete passenger
router.delete("/:id", (req, res) => {
  const db = getDBConnection();
  const passengerID = req.params.id;
  db.query("DELETE FROM Passenger WHERE PassengerID = ?", [passengerID], (err, result) => {
    db.end();
    if (err) return res.status(500).send("Failed to delete passenger");
    if (result.affectedRows === 0) return res.status(404).send("Passenger not found");
    res.json({ message: "Passenger deleted" });
  });
});

export default router;
