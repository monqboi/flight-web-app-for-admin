import express from "express";
import db from "../db.js";

const router = express.Router();

// ------------- Reservation -------------

// Get all Reservations
router.get("/", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM Reservation");
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving reservations");
  }
});

// Get a single Reservation by ID
router.get("/:id", async (req, res) => {
  try {
    const reservationID = req.params.id;
    const [result] = await db.query("SELECT * FROM Reservation WHERE ReservationID = ?", [reservationID]);
    if (result.length === 0) return res.status(404).send("Reservation not found");
    res.json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving reservation");
  }
});

// Create a new Reservation
router.post("/", async (req, res) => {
  try {
    const { 
      userID,        // INTEGER: 1234
      flightID,      // INTEGER: 1234
      seatNumber,    // STRING: 'A2'
      status,        // ENUM('Pending', 'Confirmed', 'Cancelled')
      bookingDate    // DATETIME: '2025-05-15 08:00'
    } = req.body;

    if (!userID || !flightID || !seatNumber || !status || !bookingDate)
      return res.status(400).send("Missing required fields");

    // Check if user exists
    const [[user]] = await db.query("SELECT * FROM User WHERE UserID = ?", [userID]);
    if (!user) return res.status(404).send("User not found");

    // Find SeatID from SeatNumber + FlightID
    const [[seat]] = await db.query(
      `SELECT SeatID FROM Seat WHERE SeatNumber = ? AND FlightID = ? AND Availability = 'Yes'`,
      [seatNumber, flightID]
    );
    if (!seat) return res.status(400).send("Seat not available");

    const [insertResult] = await db.query(
      `INSERT INTO Reservation (UserID, FlightID, SeatID, Status, BookingDate) VALUES (?, ?, ?, ?, ?)`,
      [userID, flightID, seat.SeatID, status, bookingDate]
    );

    // Update Seat to 'No' (not available)
    await db.query(
      `UPDATE Seat SET Availability = 'No' WHERE SeatID = ? AND FlightID = ?`,
      [seat.SeatID, flightID]
    );

    res.status(201).json({
      message: "Reservation created successfully",
      reservationID: insertResult.insertId,
      seatID: seat.SeatID,
      seatNumber
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating reservation");
  }
});

// Delete a Reservation
router.delete("/:id", async (req, res) => {
  try {
    const reservationID = req.params.id;
    const [results] = await db.query("DELETE FROM Reservation WHERE ReservationID = ?", [reservationID]);
    if (results.affectedRows === 0) return res.status(404).send("Reservation not found");
    res.json({ message: "Reservation deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting reservation");
  }
});

// Update a Reservation
router.put("/:id", async (req, res) => {
  try {
    const reservationID = req.params.id;
    const { userID, flightID, seatNumber, status, bookingDate } = req.body;

    if (!userID || !flightID || !seatNumber || !status || !bookingDate)
      return res.status(400).send("Missing required fields");

    const [[user]] = await db.query("SELECT * FROM User WHERE UserID = ?", [userID]);
    if (!user) return res.status(404).send("User not found");

    const [[newSeat]] = await db.query(
      `SELECT SeatID FROM Seat WHERE SeatNumber = ? AND FlightID = ? AND Availability = 'Yes'`,
      [seatNumber, flightID]
    );
    if (!newSeat) return res.status(400).send("Seat not available");

    const [[oldRes]] = await db.query("SELECT SeatID FROM Reservation WHERE ReservationID = ?", [reservationID]);
    if (!oldRes) return res.status(404).send("Reservation not found");

    await db.query(
      `UPDATE Reservation SET UserID = ?, FlightID = ?, SeatID = ?, Status = ?, BookingDate = ? WHERE ReservationID = ?`,
      [userID, flightID, newSeat.SeatID, status, bookingDate, reservationID]
    );

    await db.query("UPDATE Seat SET Availability = 'No' WHERE SeatID = ?", [newSeat.SeatID]);
    await db.query("UPDATE Seat SET Availability = 'Yes' WHERE SeatID = ?", [oldRes.SeatID]);

    res.json({ message: "Reservation updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating reservation");
  }
});

export default router;
