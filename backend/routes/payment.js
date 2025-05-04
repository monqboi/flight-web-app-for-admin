import express from "express";
import getDBConnection from "../db.js";

const router = express.Router();

// ------------- Payment -------------

// GET all payments (with Reservation + User info)
router.get("/", (req, res) => {
  const db = getDBConnection();
  const query = `
    SELECT 
      p.PaymentID,
      p.Amount,
      p.PaymentMethod,
      p.PaymentDate,
      p.Status,
      u.Username,
      u.UserID,
      r.ReservationID,
      r.Departure,
      r.Destination
    FROM Payment p
    JOIN Reservation r ON p.ReservationID = r.ReservationID
    JOIN User u ON p.UserID = u.UserID
  `;

  db.query(query, (err, results) => {
    db.end();
    if (err) {
      console.error(err);
      return res.status(500).send("Error retrieving payments");
    }

    const formatted = results.map(p => ({
      id: p.PaymentID,
      reservationId: p.ReservationID,
      userId: p.UserID,
      username: p.Username,
      route: `${p.Departure} → ${p.Destination}`,
      date: new Date(p.PaymentDate).toISOString().split("T")[0],
      amount: p.Amount,
      status: p.Status,
      method: p.PaymentMethod
    }));

    res.json(formatted);
  });
});

// CREATE new payment + update Reservation if 'Successful'
router.post("/", (req, res) => {
  const db = getDBConnection();
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

  // Get SeatClass & BasePrice of Seat from Reservation
  const seatQuery = `
    SELECT s.BasePrice, s.SeatClass
    FROM Reservation r
    JOIN Seat s ON r.SeatID = s.SeatID
    WHERE r.ReservationID = ?
  `;

  db.query(seatQuery, [reservationID], (err, result) => {
    if (err || result.length === 0) {
      db.end();
      console.error(err);
      return res.status(500).send("Cannot find seat for reservation");
    }

    const { BasePrice, SeatClass } = result[0];
    let multiplier = 1;

    // Calculate Price from SeatClass
    switch (SeatClass) {
      case "Economy": multiplier = 1.0; break;
      case "Business": multiplier = 1.5; break;
      case "FirstClass": multiplier = 2.0; break;
      default: multiplier = 1.0;
    }

    const amount = BasePrice * multiplier;

    // Create Payment
    const insertQuery = `
      INSERT INTO Payment (ReservationID, UserID, Amount, PaymentMethod, PaymentDate, Status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [reservationID, userID, amount, paymentMethod, paymentDate, status];

    db.query(insertQuery, values, (err2, result2) => {
      if (err2) {
        db.end();
        console.error(err2);
        return res.status(500).send("Database error when creating payment");
      }

      const paymentID = result2.insertId;

      // Update Reservation Status from Payment Status
      let reservationStatus = status === "Successful" ? "Confirmed" :
                              status === "Failed" ? "Pending" : null;

      if (reservationStatus) {
        const updateQuery = `UPDATE Reservation SET Status = ? WHERE ReservationID = ?`;
        db.query(updateQuery, [reservationStatus, reservationID], (err3) => {
          db.end();
          if (err3) {
            console.error(err3);
            return res.status(500).send("Payment saved but failed to update reservation status");
          }
          return res.status(201).json({
            message: `Payment created. Reservation set to '${reservationStatus}'`,
            paymentID,
            amount
          });
        });
      } else {
        db.end();
        res.status(201).json({ message: "Payment created", paymentID, amount });
      }
    });
  });
});

// Update an existing payment
router.put("/:id", (req, res) => {
  const db = getDBConnection();
  const paymentID = req.params.id;
  const {
    reservationID,
    userID,
    amount,
    paymentMethod,
    paymentDate, 
    status
  } = req.body;

  const query = `
    UPDATE Payment
    SET ReservationID = ?, UserID = ?, Amount = ?, PaymentMethod = ?, PaymentDate = ?, Status = ?
    WHERE PaymentID = ?
  `;

  const values = [
    reservationID,
    userID,
    amount,
    paymentMethod,
    paymentDate, 
    status,
    paymentID
  ];

  db.query(query, values, (err, results) => {
    if (err) {
      db.end();
      console.error(err);
      return res.status(500).send("Database error when updating payment");
    }

    // Update Reservation status if needed
    let newReservationStatus = null;
    if (status === "Successful") {
      newReservationStatus = "Confirmed";
    } else if (status === "Failed") {
      newReservationStatus = "Pending";
    }

    if (newReservationStatus) {
      const updateReservation = `
        UPDATE Reservation SET Status = ? WHERE ReservationID = ?
      `;
      db.query(updateReservation, [newReservationStatus, reservationID], (err2) => {
        db.end();
        if (err2) {
          console.error(err2);
          return res.status(500).send("Payment updated but failed to sync reservation status");
        }
        return res.json({ message: `Payment + Reservation updated to '${newReservationStatus}'` });
      });
    } else {
      db.end();
      res.json({ message: "Payment updated successfully" });
    }
  });
});

export default router;