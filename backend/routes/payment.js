import express from "express";
import db from "../db.js";

const router = express.Router();

// ------------- Payment -------------

// Get all payments
router.get("/", async (req, res) => {
  try {
    const [results] = await db.promise().query("SELECT * FROM Payment");
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving payments");
  }
});

// Get a single payment by ID
router.get("/:id", async (req, res) => {
  try {
    const [results] = await db.promise().query(
      "SELECT * FROM Payment WHERE PaymentID = ?",
      [req.params.id]
    );
    if (results.length === 0) {
      return res.status(404).send("Payment not found");
    }
    res.json(results[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving payment");
  }
});

// Create a new payment
router.post("/", async (req, res) => {
  try {
    const {
      reservationID, // INTEGER: 1234
      userID, // INTEGER: 1234
      amount, // INTEGER: 1234
      paymentMethod,  // ENUM('Pending', 'Success', 'Failed')
      paymentDate, // DATETIME: '2025-05-15 8:00'
      status // ENUM('Credit Card', 'Paypal', 'Bank Transfer')
    } = req.body;

    if (!reservationID || !userID || !amount || !paymentMethod || !paymentDate || !status) {
      return res.status(400).send("Missing required fields");
    }

    const query = `
      INSERT INTO Payment (ReservationID, UserID, Amount, PaymentMethod, PaymentDate, Status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [reservationID, userID, amount, paymentMethod, paymentDate, status];

    const [results] = await db.promise().query(query, values);

    res.status(201).json({
      message: "Payment created successfully",
      paymentID: results.insertId
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error when creating payment");
  }
});

// Update an existing payment
router.put("/:id", async (req, res) => {
  try {
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

    const [results] = await db.promise().query(query, values);

    if (results.affectedRows === 0) {
      return res.status(404).send("Payment not found");
    }

    res.json({ message: "Payment updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error when updating payment");
  }
});

export default router;
