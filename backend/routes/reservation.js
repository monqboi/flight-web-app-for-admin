import express from "express";
import db from "../db.js";

const router = express.Router();

// ------------- Reservation -------------
/*
If Reservation Status === "Confirmed" when Creating or Updating Reservation:
    - Create Reservation row with Status = 'Confirmed'
    - Create Payment row with Status = 'Successful'
    - Create Passenger row immediately
    - Seat's availibity is 'No'

If Reservation Status === "Pending" when creating Reservation:
    - Create Reservation row with Status = 'Pending'
    - Create Payment row with Status = 'Pending'
    - Don't create Passenger until Payment is Successful
    - Seat's availibity is 'No'

If Reservation Status === "Pending" when Updating Reservation:
    - Delete the associated Passenger
    - Seat's availibity is 'No'

If Reservation Status == "Canceled" && Payment == "Successful"
    - Delete the associated Passenger (Not Payment due to Refund Case)
    - Seat's availibity is 'Yes'

If Reservation Status == "Canceled" && Payment != "Successful"
    - Delete the associated Passenger, and Payment
    - Seat's availibity is 'Yes'
*/

// Get all Reservations
router.get("/", async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        r.ReservationID,    // INTEGER: 1234
        r.UserID,           // INTEGER: 1234
        r.FlightID,         // INTEGER: 1234
        r.SeatID,           // INTEGER: 1234
        r.Status,           // ENUM('Pending', 'Confirmed', 'Canceled')
        r.BookingDate       // DATETIME: '2025-05-15 08:00'
      FROM Reservation r`);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving reservations");
  }
});

// Create a new Reservation and Initial Payment
router.post("/", async (req, res) => {
  try {
    const {
      userID,
      flightID,
      seatNumber,
      status,
      bookingDate,
      amount,
      paymentMethod,
      paymentDate,
      passengerInfo
    } = req.body;

    if (!userID || !flightID || !seatNumber || !status || !bookingDate || !amount || !paymentMethod || !paymentDate) {
      return res.status(400).send("Missing required fields");
    }

    // Check user
    const [userResult] = await db.query("SELECT * FROM User WHERE UserID = ?", [userID]);
    if (userResult.length === 0) return res.status(404).send("User not found");

    // Get seat ID
    const [seatResult] = await db.query(
      "SELECT SeatID FROM Seat WHERE SeatNumber = ? AND FlightID = ? AND Available = 'Yes'",
      [seatNumber, flightID]
    );
    if (seatResult.length === 0) return res.status(400).send("Seat not available");

    const seatID = seatResult[0].SeatID;

    // Create reservation
    const [resResult] = await db.query(
      "INSERT INTO Reservation (UserID, FlightID, SeatID, Status, BookingDate) VALUES (?, ?, ?, ?, ?)",
      [userID, flightID, seatID, status, bookingDate]
    );
    const reservationID = resResult.insertId;

    const paymentStatus = status === 'Confirmed' ? 'Successful' : 'Pending';

    await db.query(
      "INSERT INTO Payment (ReservationID, UserID, Amount, PaymentMethod, PaymentDate, Status) VALUES (?, ?, ?, ?, ?, ?)",
      [reservationID, userID, amount, paymentMethod, paymentDate, paymentStatus]
    );

    // Update Seat Available 
    await db.query("UPDATE Seat SET Available = 'No' WHERE SeatID = ?", [seatID]);

    if (status === 'Confirmed') {
      if (!passengerInfo) return res.status(400).send("Missing passenger info for confirmed reservation");

      const {
        Firstname,
        Middlename,
        Lastname,
        Nationality,
        BirthDate,
        Address,
        PassportNumber
      } = passengerInfo;

      if (!Firstname || !Lastname || !Nationality || !BirthDate || !Address || !PassportNumber) {
        return res.status(400).send("Incomplete passenger info");
      }

      await db.query(
        `INSERT INTO Passenger (ReservationID, SeatID, Firstname, Middlename, Lastname, Nationality, BirthDate, Address, PassportNumber)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [reservationID, seatID, Firstname, Middlename || '', Lastname, Nationality, BirthDate, Address, PassportNumber]
      );
    }

    res.status(201).json({
      message: "Reservation, payment, and optional passenger created.",
      reservationID,
      seatID
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// Auto-confirm reservation if payment becomes successful
router.put("/auto-confirm/:paymentID", async (req, res) => {
  try {
    const paymentID = req.params.paymentID;

    const [payResult] = await db.query("SELECT * FROM Payment WHERE PaymentID = ?", [paymentID]);
    if (payResult.length === 0) return res.status(404).send("Payment not found");

    const payment = payResult[0];
    if (payment.Status !== 'Successful') return res.status(400).send("Payment not successful yet");

    await db.query("UPDATE Reservation SET Status = 'Confirmed' WHERE ReservationID = ?", [payment.ReservationID]);

    res.json({ message: "Reservation confirmed." });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error confirming reservation");
  }
});

// Cancel Reservation with conditional cleanup
router.put("/cancel/:id", async (req, res) => {
  try {
    const reservationID = req.params.id;

    const [resResult] = await db.query("SELECT * FROM Reservation WHERE ReservationID = ?", [reservationID]);
    if (resResult.length === 0) return res.status(404).send("Reservation not found");

    const [paymentResult] = await db.query("SELECT * FROM Payment WHERE ReservationID = ?", [reservationID]);
    const payment = paymentResult[0];

    await db.query("UPDATE Reservation SET Status = 'Canceled' WHERE ReservationID = ?", [reservationID]);

    await db.query("DELETE FROM Passenger WHERE ReservationID = ?", [reservationID]);

    if (!payment || payment.Status !== 'Successful') {
      await db.query("DELETE FROM Payment WHERE ReservationID = ?", [reservationID]);
    }

    await db.query("UPDATE Seat SET Available = 'Yes' WHERE SeatID = ?", [resResult[0].SeatID]);

    res.json({ message: "Reservation canceled and related records handled." });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error canceling reservation");
  }
});

// Delete Reservation (Only allowed if Payment != Successful || Status != Confirmed)
router.delete("/:id", async (req, res) => {
  try {
    const reservationID = req.params.id;

    const [resResult] = await db.query("SELECT * FROM Reservation WHERE ReservationID = ?", [reservationID]);
    if (resResult.length === 0) return res.status(404).send("Reservation not found");

    const [paymentResult] = await db.query("SELECT * FROM Payment WHERE ReservationID = ?", [reservationID]);
    const payment = paymentResult[0];

    if ((payment && payment.Status === 'Successful') || resResult[0].Status === 'Confirmed') {
      return res.status(400).send("Cannot delete reservation with successful payment or confirmed status. Please cancel instead.");
    }

    await db.query("DELETE FROM Passenger WHERE ReservationID = ?", [reservationID]);
    await db.query("DELETE FROM Payment WHERE ReservationID = ?", [reservationID]);
    await db.query("DELETE FROM Reservation WHERE ReservationID = ?", [reservationID]);

    res.json({ message: "Reservation and related data deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).send("Delete failed");
  }
});

export default router;