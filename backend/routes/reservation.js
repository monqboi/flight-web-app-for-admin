import express from "express";
import db from "../db.js";

const router = express.Router();

// ------------- Reservation -------------

// Get all Reservations (with Seat + User + Payment info)
router.get("/", async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        r.ReservationID,
        r.Status,
        r.BookingDate,
        u.UserID,
        u.Username,
        s.SeatNumber,
        p.PaymentID,
        p.Amount
      FROM Reservation r
      JOIN User u ON r.UserID = u.UserID
      JOIN Seat s ON r.SeatID = s.SeatID
      LEFT JOIN Payment p ON r.ReservationID = p.ReservationID
    `);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving reservations");
  }
});

// Get a single Reservation by ID
router.get("/:id", async (req, res) => {
  try {
    const [result] = await db.query(
      "SELECT * FROM Reservation WHERE ReservationID = ?",
      [req.params.id]
    );
    if (result.length === 0) {
      return res.status(404).send("Reservation not found");
    }
    res.json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving reservation");
  }
});

// Get full detail of a Reservation by ID (with User + Seat + Flight + Payment)
router.get("/:id/full", async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        r.ReservationID,
        r.Status AS ReservationStatus,
        r.BookingDate,
        u.UserID,
        u.Username,
        u.Email,
        s.SeatID,
        s.SeatNumber,
        s.SeatClass,
        f.FlightID,
        f.Departure,
        f.Destination,
        f.DepartureTime,
        p.PaymentID,
        p.Amount,
        p.PaymentMethod,
        p.PaymentDate,
        p.Status AS PaymentStatus
      FROM Reservation r
      JOIN User u ON r.UserID = u.UserID
      JOIN Seat s ON r.SeatID = s.SeatID
      JOIN Flight f ON r.FlightID = f.FlightID
      LEFT JOIN Payment p ON r.ReservationID = p.ReservationID
      WHERE r.ReservationID = ?
    `, [req.params.id]);

    if (results.length === 0) {
      return res.status(404).send("Reservation not found");
    }

    const r = results[0];

    res.json({
      reservationID: r.ReservationID,
      bookingDate: r.BookingDate,
      status: r.ReservationStatus,
      user: {
        userID: r.UserID,
        username: r.Username,
        email: r.Email
      },
      flight: {
        flightID: r.FlightID,
        departure: r.Departure,
        destination: r.Destination,
        time: r.DepartureTime
      },
      seat: {
        seatID: r.SeatID,
        seatNumber: r.SeatNumber,
        seatClass: r.SeatClass
      },
      payment: r.PaymentID ? {
        paymentID: r.PaymentID,
        amount: r.Amount,
        method: r.PaymentMethod,
        date: r.PaymentDate,
        status: r.PaymentStatus
      } : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error retrieving full reservation details");
  }
});

// Create a new Reservation
router.post("/", async (req, res) => {
  try {
    const { 
      userID,        // INTEGER: 1234
      flightID,      // INTEGER: 1234
      seatNumber,    // STRING: 'A2'
      status,        // ENUM('Pending', 'Confirmed', 'Canceled')
      bookingDate    // DATETIME: '2025-05-15 08:00'
    } = req.body;

    if (!userID || !flightID || !seatNumber || !status || !bookingDate) {
      return res.status(400).send("Missing required reservation fields");
    }

    // Check user
    const [userResult] = await db.query("SELECT * FROM User WHERE UserID = ?", [userID]);
    if (userResult.length === 0) {
      return res.status(404).send("User not found");
    }

    // Get seat ID
    const [seatResult] = await db.query(
      "SELECT SeatID FROM Seat WHERE SeatNumber = ? AND FlightID = ? AND Availability = 'Yes'",
      [seatNumber, flightID]
    );
    if (seatResult.length === 0) {
      return res.status(400).send("Seat not available or not found for this flight");
    }

    const seatID = seatResult[0].SeatID;

    // Create reservation
    const [insertResult] = await db.query(
      "INSERT INTO Reservation (UserID, FlightID, SeatID, Status, BookingDate) VALUES (?, ?, ?, ?, ?)",
      [userID, flightID, seatID, status, bookingDate]
    );

    // Update seat availability
    await db.query("UPDATE Seat SET Availability = 'No' WHERE SeatID = ? AND FlightID = ?", [seatID, flightID]);

    res.status(201).json({
      message: "Reservation created successfully",
      reservationID: insertResult.insertId,
      seatID,
      seatNumber
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error creating reservation");
  }
});

// Delete a Reservation
router.delete("/:id", async (req, res) => {
  try {
    const [results] = await db.query("DELETE FROM Reservation WHERE ReservationID = ?", [req.params.id]);
    if (results.affectedRows === 0) {
      return res.status(404).send("Reservation not found");
    }
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

    if (!userID || !flightID || !seatNumber || !status || !bookingDate) {
      return res.status(400).send("Missing required reservation fields");
    }

    // Check user
    const [userResult] = await db.query("SELECT * FROM User WHERE UserID = ?", [userID]);
    if (userResult.length === 0) {
      return res.status(404).send("User not found");
    }

    // Find new Seat
    const [seatResult] = await db.query(
      "SELECT SeatID FROM Seat WHERE SeatNumber = ? AND FlightID = ? AND Availability = 'Yes'",
      [seatNumber, flightID]
    );
    if (seatResult.length === 0) {
      return res.status(400).send("Seat not available or doesn't exist");
    }

    const newSeatID = seatResult[0].SeatID;

    // Get old SeatID
    const [oldResult] = await db.query("SELECT SeatID FROM Reservation WHERE ReservationID = ?", [reservationID]);
    if (oldResult.length === 0) {
      return res.status(404).send("Reservation not found");
    }
    const oldSeatID = oldResult[0].SeatID;

    // Update Reservation
    await db.query(
      "UPDATE Reservation SET UserID = ?, FlightID = ?, SeatID = ?, Status = ?, BookingDate = ? WHERE ReservationID = ?",
      [userID, flightID, newSeatID, status, bookingDate, reservationID]
    );

    // Update seat availability
    await db.query("UPDATE Seat SET Availability = 'No' WHERE SeatID = ?", [newSeatID]);
    await db.query("UPDATE Seat SET Availability = 'Yes' WHERE SeatID = ?", [oldSeatID]);

    res.json({ message: "Reservation updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating reservation");
  }
});
  
export default router;