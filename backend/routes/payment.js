import express from "express";
import db from "../db.js";

const router = express.Router();

// ------------- Payment -------------

// Get all payments
router.get("/", (req, res) => {
  const query = "SELECT * FROM Payment";

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error retrieving payments");
    }
    res.json(results);
  });
});

// Get a single payment by ID
router.get("/:id", (req, res) => {
  const paymentID = req.params.id;
  const query = "SELECT * FROM Payment WHERE PaymentID = ?";

  db.query(query, [paymentID], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error retrieving payment");
    }
    if (results.length === 0) {
      return res.status(404).send("Payment not found");
    }
    res.json(results[0]);
  });
});

// Create a new payment
router.post("/", (req, res) => {
  const {
    paymentID, // INTEGER: 1234
    reservationID, // INTEGER: 1234
    userID, // INTEGER: 1234
    amount, // INTEGER: 1234
    paymentMethod,  // ENUM('Pending', 'Success', 'Failed')
    paymentDate, // DATETIME: '2025-05-15 8:00'
    status // ENUM('Credit Card', 'Paypal', 'Bank Transfer')
  } = req.body;

  if (!paymentID || !reservationID || !userID || !amount || !paymentMethod || !paymentDate || !status) {
    return res.status(400).send("Missing required fields");
  }

  const query = `
    INSERT INTO Payment (paymentID, ReservationID, UserID, Username, ReservationID, Amount, PaymentMethod, PaymentDate, Status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    paymentID,
    reservationID,
    userID,
    username,
    amount,
    paymentMethod,
    paymentDate, 
    status
  ];

  db.query(query, values, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Database error when creating payment");
    }
    res.status(201).json({ message: "Payment created successfully" });
  });
});

// Update an existing payment
router.put("/:id", (req, res) => {
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
      console.error(err);
      return res.status(500).send("Database error when updating payment");
    }
    res.json({ message: "Payment updated successfully" });
  });
});

export default router;
