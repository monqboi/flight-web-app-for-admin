import express from "express";
import db from "../db.js";

const router = express.Router();

// ------------- Payment -------------
/*
Edit Payment:
- If Status == 'Successful' → Update Reservation.Status to 'Confirmed', set Seat.Available = 'No', and create Passenger (With Null Value)
- If not → Delete Passenger If any, set Reservation.Status to 'Pending', and set Seat.Available = 'Yes'
*/

// GET all payments (with Reservation + User info)
router.get("/", async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        p.PaymentID,
        p.Amount,
        p.PaymentMethod,
        p.PaymentDate,
        p.Status,
        u.Username,
        u.UserID,
        r.ReservationID,
        f.Departure,
        f.Destination
      FROM Payment p
      JOIN Reservation r ON p.ReservationID = r.ReservationID
      JOIN User u ON p.UserID = u.UserID
      JOIN Seat s ON r.SeatID = s.SeatID
      JOIN Flight f ON s.FlightID = f.FlightID
    `);

    const formatted = results.map(p => ({
      id: p.PaymentID,
      reservationId: p.ReservationID,
      userId: p.UserID,
      username: p.Username,
      route: `${p.Departure} → ${p.Destination}`,
      paymentDate: p.PaymentDate ? new Date(p.PaymentDate).toISOString().slice(0, 16) : '', // yyyy-MM-ddTHH:mm
      amount: p.Amount,
      status: p.Status,
      method: p.PaymentMethod
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving payments");
  }
});

/*
// CREATE new payment + update Reservation if 'Successful'
router.post("/", async (req, res) => {
  const {
    reservationID, // INTEGER: 1234
    userID,        // INTEGER: 1234
    amount,        // INTEGER: 1234
    paymentMethod, // ENUM('Credit Card', 'Paypal', 'Bank Transfer')
    paymentDate,   // DATETIME: '2025-05-15 8:00'
    status         // ENUM('Pending', 'Successful', 'Failed')
  } = req.body;

  if (!reservationID || !amount || !paymentMethod || !paymentDate || !status) {
    return res.status(400).send("Missing required fields");
  }

  try {
    const [seatRows] = await db.query(`
      SELECT s.BasePrice, s.SeatClass
      FROM Reservation r
      JOIN Seat s ON r.SeatID = s.SeatID
      WHERE r.ReservationID = ?
    `, [reservationID]);

    if (seatRows.length === 0) {
      return res.status(500).send("Cannot find seat for reservation");
    }

    const { BasePrice, SeatClass } = seatRows[0];
    let multiplier = 1;

    switch (SeatClass) {
      case "Economy": multiplier = 1.0; break;
      case "Business": multiplier = 1.5; break;
      case "FirstClass": multiplier = 2.0; break;
      default: multiplier = 1.0;
    }

    const calculatedAmount = BasePrice * multiplier;

    const [insertResult] = await db.query(`
      INSERT INTO Payment (ReservationID, UserID, Amount, PaymentMethod, PaymentDate, Status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [reservationID, userID, calculatedAmount, paymentMethod, paymentDate, status]);

    const paymentID = insertResult.insertId;

    let reservationStatus = null;
    if (status === "Successful") reservationStatus = "Confirmed";
    if (status === "Failed") reservationStatus = "Pending";

    if (reservationStatus) {
      await db.query(`
        UPDATE Reservation SET Status = ? WHERE ReservationID = ?
      `, [reservationStatus, reservationID]);
    }

    res.status(201).json({
      message: reservationStatus
        ? `Payment created. Reservation set to '${reservationStatus}'`
        : "Payment created",
      paymentID,
      amount: calculatedAmount
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing payment");
  }
});
*/

// Update an existing payment
router.put("/:id", async (req, res) => {
  const paymentID = req.params.id;
  const {
    reservationID,
    userID,
    amount,
    paymentMethod,
    paymentDate,
    status
  } = req.body;

  try {
    // Update Payment record
    await db.query(`
      UPDATE Payment
      SET ReservationID = ?, UserID = ?, Amount = ?, PaymentMethod = ?, PaymentDate = ?, Status = ?
      WHERE PaymentID = ?
    `, [reservationID, userID, amount, paymentMethod, paymentDate, status, paymentID]);

    // Get SeatID for this reservation
    const [reservationRows] = await db.query(`SELECT SeatID FROM Reservation WHERE ReservationID = ?`, [reservationID]);
    if (reservationRows.length === 0) {
      return res.status(404).send("Reservation not found");
    }
    const seatID = reservationRows[0].SeatID;

    if (status === "Successful") {
      // Set Reservation to Confirmed
      await db.query(`UPDATE Reservation SET Status = 'Confirmed' WHERE ReservationID = ?`, [reservationID]);

      // Set Seat to Unavailable
      await db.query(`UPDATE Seat SET Available = 'No' WHERE SeatID = ?`, [seatID]);

      // Create passenger (with NULL fields)
      await db.query(`
        INSERT INTO Passenger (ReservationID, SeatID, Firstname, Middlename, Lastname, Nationality, BirthDate, PassportNumber, Address)
        VALUES (?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL)
      `, [reservationID, seatID]);

      return res.json({ message: "Payment updated, reservation confirmed, passenger created" });

    } else {
      // Set Reservation to Pending
      await db.query(`UPDATE Reservation SET Status = 'Pending' WHERE ReservationID = ?`, [reservationID]);

      // Set Seat to Available
      await db.query(`UPDATE Seat SET Available = 'Yes' WHERE SeatID = ?`, [seatID]);

      // Delete Passenger (if any)
      await db.query(`DELETE FROM Passenger WHERE ReservationID = ?`, [reservationID]);

      return res.json({ message: "Payment updated, reservation downgraded, passenger removed" });
    }

  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating payment");
  }
});

export default router;