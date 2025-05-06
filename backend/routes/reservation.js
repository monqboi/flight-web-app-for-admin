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
    const flightID = req.query.flightID;

    let query = `
      SELECT 
        r.ReservationID,
        r.UserID,
        r.FlightID,
        s.SeatNumber,
        r.Status,
        r.BookingDate,
        p.PaymentID,
        p.Amount,
        u.Username
      FROM Reservation r
      JOIN Seat s ON r.SeatID = s.SeatID
      LEFT JOIN Payment p ON p.ReservationID = r.ReservationID
      LEFT JOIN User u ON u.UserID = r.UserID
    `;

    const params = [];

    if (flightID) {
      query += " WHERE r.FlightID = ?";
      params.push(flightID);
    }

    const [results] = await db.query(query, params);
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
      paymentMethod,
      paymentDate,
      passengerInfo
    } = req.body;

    if (!userID || !flightID || !seatNumber || !status || !bookingDate || !paymentMethod || !paymentDate) {
      return res.status(400).send("Missing required fields");
    }

    // Check user
    const [userResult] = await db.query("SELECT * FROM User WHERE UserID = ?", [userID]);
    if (userResult.length === 0) return res.status(404).send("User not found");

    // Get seat ID
    const [seatResult] = await db.query(
      "SELECT SeatID, SeatClass FROM Seat WHERE SeatNumber = ? AND FlightID = ? AND Available = 'Yes'",
      [seatNumber, flightID]
    );
    if (seatResult.length === 0) return res.status(400).send("Seat not available");

    const seatID = seatResult[0].SeatID;
    const seatClass = seatResult[0].SeatClass;

    // Get price per flight
    const [flightResult] = await db.query("SELECT Price FROM Flight WHERE FlightID = ?", [flightID]);
    if (flightResult.length === 0) return res.status(404).send("Flight not found");

    const basePrice = flightResult[0].Price;

    // Get mutiplier price per seatclass
    const [multiplierResult] = await db.query("SELECT Multiplier FROM SeatMultiplier WHERE SeatClass = ?", [seatClass]);
    if (multiplierResult.length === 0) return res.status(404).send("Seat multiplier not found");

    const multiplier = multiplierResult[0].Multiplier;
    const amount = basePrice * multiplier;
    
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
      const {
        Firstname = null,
        Middlename = null,
        Lastname = null,
        Nationality = null,
        BirthDate = null,
        Address = null,
        PassportNumber = null
      } = passengerInfo || {};

      // Create passenger
      await db.query(
        `INSERT INTO Passenger (ReservationID, SeatID, Firstname, Middlename, Lastname, Nationality, BirthDate, Address, PassportNumber)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [reservationID, seatID, Firstname, Middlename, Lastname, Nationality, BirthDate, Address, PassportNumber]
      );
    }

    res.status(201).json({
      message: "Reservation, payment, and optional passenger created.",
      reservationID,
      seatID,
      amount
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// Update Reservation
router.put("/:id", async (req, res) => {
  try {
    const reservationID = req.params.id;
    const {
      userID,
      flightID,
      seatNumber,
      status,
      bookingDate,
      paymentMethod,
      paymentDate,
      passengerInfo
    } = req.body;

    if (!userID || !flightID || !seatNumber || !status || !bookingDate || !paymentMethod || !paymentDate) {
      return res.status(400).send("Missing required fields");
    }

    const [userResult] = await db.query("SELECT * FROM User WHERE UserID = ?", [userID]);
    if (userResult.length === 0) return res.status(404).send("User not found");

    const [seatResult] = await db.query(
      "SELECT SeatID, SeatClass FROM Seat WHERE SeatNumber = ? AND FlightID = ?",
      [seatNumber, flightID]
    );
    if (seatResult.length === 0) return res.status(400).send("Seat not available");

    const seatID = seatResult[0].SeatID;
    const seatClass = seatResult[0].SeatClass;

    const [flightResult] = await db.query("SELECT Price FROM Flight WHERE FlightID = ?", [flightID]);
    if (flightResult.length === 0) return res.status(404).send("Flight not found");

    const basePrice = flightResult[0].Price;
    const [multiplierResult] = await db.query("SELECT Multiplier FROM SeatMultiplier WHERE SeatClass = ?", [seatClass]);
    if (multiplierResult.length === 0) return res.status(404).send("Seat multiplier not found");

    const multiplier = multiplierResult[0].Multiplier;
    const amount = basePrice * multiplier;

    // Update Reservation
    await db.query(
      "UPDATE Reservation SET UserID = ?, FlightID = ?, SeatID = ?, Status = ?, BookingDate = ? WHERE ReservationID = ?",
      [userID, flightID, seatID, status, bookingDate, reservationID]
    );

    const paymentStatus = status === 'Confirmed' ? 'Successful' : 'Pending';

    // Update or insert payment
    const [paymentCheck] = await db.query("SELECT * FROM Payment WHERE ReservationID = ?", [reservationID]);
    if (paymentCheck.length > 0) {
      await db.query(
        "UPDATE Payment SET UserID = ?, Amount = ?, PaymentMethod = ?, PaymentDate = ?, Status = ? WHERE ReservationID = ?",
        [userID, amount, paymentMethod, paymentDate, paymentStatus, reservationID]
      );
    } else {
      await db.query(
        "INSERT INTO Payment (ReservationID, UserID, Amount, PaymentMethod, PaymentDate, Status) VALUES (?, ?, ?, ?, ?, ?)",
        [reservationID, userID, amount, paymentMethod, paymentDate, paymentStatus]
      );
    }

    // Update Seat
    await db.query("UPDATE Seat SET Available = 'No' WHERE SeatID = ?", [seatID]);

    if (status === 'Confirmed') {
      const {
        Firstname = null,
        Middlename = null,
        Lastname = null,
        Nationality = null,
        BirthDate = null,
        Address = null,
        PassportNumber = null
      } = passengerInfo || {};

      const [existingPassenger] = await db.query("SELECT * FROM Passenger WHERE ReservationID = ?", [reservationID]);
      if (existingPassenger.length > 0) {
        await db.query(
          `UPDATE Passenger SET SeatID = ?, Firstname = ?, Middlename = ?, Lastname = ?, Nationality = ?, BirthDate = ?, Address = ?, PassportNumber = ? WHERE ReservationID = ?`,
          [seatID, Firstname, Middlename, Lastname, Nationality, BirthDate, Address, PassportNumber, reservationID]
        );
      } else {
        await db.query(
          `INSERT INTO Passenger (ReservationID, SeatID, Firstname, Middlename, Lastname, Nationality, BirthDate, Address, PassportNumber)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [reservationID, seatID, Firstname, Middlename, Lastname, Nationality, BirthDate, Address, PassportNumber]
        );
      }
    }

    if (status === 'Pending') {
      await db.query("DELETE FROM Passenger WHERE ReservationID = ?", [reservationID]);
    }

    if (status === 'Canceled') {
      const [paymentResult] = await db.query("SELECT * FROM Payment WHERE ReservationID = ?", [reservationID]);
      const payment = paymentResult[0];
      await db.query("DELETE FROM Passenger WHERE ReservationID = ?", [reservationID]);
      if (!payment || payment.Status !== 'Successful') {
        await db.query("DELETE FROM Payment WHERE ReservationID = ?", [reservationID]);
      }
      await db.query("UPDATE Seat SET Available = 'Yes' WHERE SeatID = ?", [seatID]);
    }

    res.json({ message: "Reservation updated with logic applied" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error on update");
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