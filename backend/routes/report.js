import express from "express";
import db from "../db.js";

const router = express.Router();

// ------------- Report -------------

// Reservation Trends
router.get('/reservation-trends', async (req, res) => {
  const months = parseInt(req.query.months) || 12;
  try {
    const [rows] = await db.query(
      `SELECT DATE_FORMAT(BookingDate, '%b %Y') AS label, COUNT(*) AS value
       FROM Reservation
       GROUP BY DATE_FORMAT(BookingDate, '%b %Y')
       ORDER BY MIN(BookingDate) DESC
       LIMIT ?`,
      [months]
    );
    res.json(rows.reverse());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reservation trends' });
  }
});

// Revenue Trends
router.get('/revenue-trends', async (req, res) => {
  const months = parseInt(req.query.months) || 12;
  try {
    const [rows] = await db.query(
      `SELECT DATE_FORMAT(PaymentDate, '%b %Y') AS label, SUM(Amount) AS value
       FROM Payment
       WHERE Status = 'Successful'
       GROUP BY DATE_FORMAT(PaymentDate, '%b %Y')
       ORDER BY MIN(PaymentDate) DESC
       LIMIT ?`,
      [months]
    );
    res.json(rows.reverse());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch revenue trends' });
  }
});

// Delay Trends
router.get('/delays-trends', async (req, res) => {
  const months = parseInt(req.query.months) || 12;
  try {
    const [rows] = await db.query(
      `SELECT DATE_FORMAT(DepartureDateTime, '%b %Y') AS label, COUNT(*) AS value
       FROM Flight
       WHERE Status = 'Delayed' OR Status = 'Cancelled'
       GROUP BY DATE_FORMAT(DepartureDateTime, '%b %Y')
       ORDER BY MIN(DepartureDateTime) DESC
       LIMIT ?`,
      [months]
    );
    res.json(rows.reverse());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch delay trends' });
  }
});

// Top Booking Destinations
router.get('/top-destinations', async (req, res) => {
  const top = parseInt(req.query.top) || 10;
  try {
    const [rows] = await db.query(
      `SELECT Destination AS label, COUNT(*) AS value
       FROM Flight f
       JOIN Reservation r ON f.FlightID = r.FlightID
       GROUP BY Destination
       ORDER BY value DESC
       LIMIT ?`,
      [top]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch top destinations' });
  }
});

// Top Customers
router.get('/top-customers', async (req, res) => {
  const top = parseInt(req.query.top) || 10;
  try {
    const [rows] = await db.query(
      `SELECT u.Username AS label, COUNT(*) AS value
       FROM Reservation r
       JOIN User u ON r.UserID = u.UserID
       GROUP BY r.UserID
       ORDER BY value DESC
       LIMIT ?`,
      [top]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch top customers' });
  }
});

// Airlines with More Cancellations than Average
router.get('/cancel-heavy-airlines', async (req, res) => {
  const top = parseInt(req.query.top) || 10;

  try {
    // Calculate average cancellations per airline
    const [[{ avgCancel }]] = await db.query(`
      SELECT AVG(cancelCount) AS avgCancel FROM (
        SELECT COUNT(*) AS cancelCount
        FROM Flight
        WHERE Status = 'Canceled'
        GROUP BY AirlineID
      ) AS sub
    `);

    // Get airlines with more cancellations than average
    const [rows] = await db.query(`
      SELECT 
        a.Name AS label,
        COUNT(*) AS value
      FROM Flight f
      JOIN Airline a ON f.AirlineID = a.AirlineID
      WHERE f.Status = 'Canceled'
      GROUP BY f.AirlineID
      HAVING value > ?
      ORDER BY value DESC
      LIMIT ?
    `, [avgCancel, top]);

    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching cancel-heavy airlines:", err);
    res.status(500).json({ error: 'Failed to fetch cancel-heavy airlines' });
  }
});
// Most Expensive Ticket per Destination
router.get('/expensive-destinations', async (req, res) => {
  const top = parseInt(req.query.top) || 10;
  try {
    const [rows] = await db.query(
      `SELECT f.Destination AS label, MAX(p.Amount) AS value
       FROM Payment p
       JOIN Reservation r ON p.ReservationID = r.ReservationID
       JOIN Flight f ON r.FlightID = f.FlightID
       GROUP BY f.Destination
       ORDER BY value DESC
       LIMIT ?`,
      [top]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expensive destinations' });
  }
});

export default router;