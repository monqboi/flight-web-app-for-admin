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

// Get reservations only for a specific flight (cleaner route)
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
      passengerInfo
    } = req.body;

    if (!userID || !flightID || !seatNumber || !status || !bookingDate) {
      return res.status(400).send("Missing required fields");
    }

    // Check user
    const [userResult] = await db.query("SELECT * FROM User WHERE UserID = ?", [userID]);
    if (userResult.length === 0) return res.status(404).send("User not found");

    // Get seatID From seatNumber
    const [seatResult] = await db.query(
      "SELECT SeatID, SeatClass, Available FROM Seat WHERE SeatNumber = ? AND FlightID = ?",
      [seatNumber, flightID]
    );
    if (seatResult.length === 0) return res.status(404).send("Seat not found for this flight");

    const seatID = seatResult[0].SeatID;
    const seatClass = seatResult[0].SeatClass;
    const isAvailable = seatResult[0].Available === 'Yes';
    if (!isAvailable) return res.status(400).json("Seat is already reserved");

    // Pricing logic
    const [flightResult] = await db.query("SELECT Price FROM Flight WHERE FlightID = ?", [flightID]);
    if (flightResult.length === 0) return res.status(404).send("Flight not found");

    const basePrice = flightResult[0].Price;

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
      [reservationID, userID, amount, null, null, paymentStatus]
    );

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

      await db.query(
        `INSERT INTO Passenger (ReservationID, SeatID, Firstname, Middlename, Lastname, Nationality, BirthDate, Address, PassportNumber)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [reservationID, seatID, Firstname, Middlename, Lastname, Nationality, BirthDate, Address, PassportNumber]
      );
    }

    res.status(201).json({
      message: "Reservation created successfully",
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
      passengerInfo
    } = req.body;

    if (!userID || !flightID || !seatNumber || !status || !bookingDate) {
      return res.status(400).send("Missing required fields");
    }

    // Get Reservation.Status to check
    const [originalReservation] = await db.query(
      "SELECT Status FROM Reservation WHERE ReservationID = ?",
      [reservationID]
    );
    const previousStatus = originalReservation[0]?.Status;

    // Get Payment.Status to check
    const [paymentCheck] = await db.query("SELECT * FROM Payment WHERE ReservationID = ?", [reservationID]);
    const existingPaymentStatus = paymentCheck[0]?.Status || null;

    // Check seat
    const [seatResult] = await db.query(
      "SELECT SeatID, SeatClass, Available FROM Seat WHERE SeatNumber = ? AND FlightID = ?",
      [seatNumber, flightID]
    );
    if (seatResult.length === 0) return res.status(404).send("Seat not found for this flight");

    const seatID = seatResult[0].SeatID;
    const isAvailable = seatResult[0].Available === 'Yes';
    if (!isAvailable && status !== 'Canceled') {
      return res.status(400).json({ message: "Seat is already reserved" });
    }

    const seatClass = seatResult[0].SeatClass;

    // Pricing logic
    const [flightResult] = await db.query("SELECT Price FROM Flight WHERE FlightID = ?", [flightID]);
    const basePrice = flightResult[0]?.Price;
    const [multiplierResult] = await db.query("SELECT Multiplier FROM SeatMultiplier WHERE SeatClass = ?", [seatClass]);
    const multiplier = multiplierResult[0]?.Multiplier;
    const amount = basePrice * multiplier;

    // Update Reservation
    await db.query(
      "UPDATE Reservation SET UserID = ?, FlightID = ?, SeatID = ?, Status = ?, BookingDate = ? WHERE ReservationID = ?",
      [userID, flightID, seatID, status, bookingDate, reservationID]
    );

    // Do not overwrite Payment.Status in case of == 'Successful'
    const finalStatus = existingPaymentStatus === 'Successful'
      ? 'Successful'
      : (status === 'Confirmed' ? 'Successful' : 'Pending');

    if (paymentCheck.length > 0) {
      await db.query(
        "UPDATE Payment SET UserID = ?, Amount = ?, Status = ? WHERE ReservationID = ?",
        [userID, amount, finalStatus, reservationID]
      );
    } else {
      await db.query(
        "INSERT INTO Payment (ReservationID, UserID, Amount, PaymentMethod, PaymentDate, Status) VALUES (?, ?, ?, ?, ?, ?)",
        [reservationID, userID, amount, null, null, finalStatus]
      );
    }

    // Update Seat.Available from New Reservation.Status
    if (status === 'Pending' || status === 'Confirmed') {
      await db.query("UPDATE Seat SET Available = 'No' WHERE SeatID = ?", [seatID]);
    } else if (status === 'Canceled') {
      await db.query("UPDATE Seat SET Available = 'Yes' WHERE SeatID = ?", [seatID]);
    }

    // If Reservation Status == 'Confirmed' → Update & Add Passenger
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

    // If new Reservation Status == 'Pending' / 'Canceled'
    if (status === 'Pending' || status === 'Canceled') {
      await db.query("DELETE FROM Passenger WHERE ReservationID = ?", [reservationID]);

      if (existingPaymentStatus !== 'Successful') {
        await db.query("DELETE FROM Payment WHERE ReservationID = ?", [reservationID]);
      } else {
        console.log(`Kept Payment for Reservation ${reservationID} (already successful)`);
      }
    }

    res.json({ message: "Reservation updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).send("Database error on update");
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

// Get valid reservations for creating passenger (Status is Confirmed and no passenger yet)
router.get("/valid", async (req, res) => {
  const flightID = req.query.flightID;
  if (!flightID) return res.status(400).send("Missing flightID");

  try {
    const [rows] = await db.query(`
      SELECT 
        r.ReservationID AS reservationId,
        s.SeatNumber AS seatNumber,
        s.SeatID AS seatId
      FROM Reservation r
      JOIN Seat s ON r.SeatID = s.SeatID
      LEFT JOIN Passenger p ON r.ReservationID = p.ReservationID
      WHERE r.FlightID = ? AND r.Status = 'Confirmed' AND p.ReservationID IS NULL
    `, [flightID]);

    res.json(rows);
  } catch (err) {
    console.error("Failed to load valid reservations:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get Seat Avalaible for Flight
router.get('/seat/available', async (req, res) => {
  const { flightID } = req.query;
  const [seats] = await db.query(
    `SELECT SeatNumber AS SeatNumber FROM Seat WHERE FlightID = ? AND Available = 'Yes'`,
    [flightID]
  );
  res.json(seats);
});

export default router;