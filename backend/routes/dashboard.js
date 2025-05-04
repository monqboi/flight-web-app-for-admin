import express from "express";
import getDBConnection from "../db.js";

const router = express.Router();

// ------------- Dashboard -------------

// For stats.value = statsRes.data
router.get('/stats', (req, res) => {
    const db = getDBConnection();
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM User) AS users,
        (SELECT COUNT(*) FROM Flight) AS flights,
        (SELECT COUNT(*) FROM Reservation) AS reservations,
        (SELECT COUNT(*) FROM Payment WHERE Status = 'Successful') AS tickets_sold
    `;
    db.query(query, (err, results) => {
      db.end();
      if (err) return res.status(500).send("Failed to load stats");
      const row = results[0];
      res.json([
        { title: 'Users', value: row.users },
        { title: 'Flights', value: row.flights },
        { title: 'Reservations', value: row.reservations },
        { title: 'Tickets Sold', value: row.tickets_sold },
      ]);
    });
  });

// For bookings.value = bookingsRes.data
router.get('/bookings', (req, res) => {
    const db = getDBConnection();
    const query = `
      SELECT r.ReservationID, u.Username, f.Departure, f.Destination, 
             TIME(f.DepartureTime) AS DepartureTime, TIME(f.ArrivalTime) AS ArrivalTime,
             f.StopOver, a.AirlineName, DATE(r.BookingDate) AS BookingDate, COUNT(*) AS Seats
      FROM Reservation r
      JOIN Flight f ON r.FlightID = f.FlightID
      JOIN User u ON r.UserID = u.UserID
      JOIN Airline a ON f.AirlineID = a.AirlineID
      GROUP BY r.ReservationID
      ORDER BY r.BookingDate DESC
      LIMIT 5
    `;
  
    db.query(query, (err, results) => {
      db.end();
      if (err) return res.status(500).send("Failed to load bookings");
  
      const formatted = results.map(r => ({
        departure: { time: r.DepartureTime, airport: r.Departure },
        arrival: { time: r.ArrivalTime, airport: r.Destination },
        stops: { time: '-', stop: r.StopOver || '-' },
        airline: r.AirlineName,
        date: r.BookingDate,
        seats: r.Seats
      }));
  
      res.json(formatted);
    });
  });

// For chartData.value = barRes.data
router.get('/chart/bar', (req, res) => {
    const db = getDBConnection();
    const query = `
      SELECT DATE_FORMAT(BookingDate, '%Y-%m') AS Month, COUNT(*) AS Reservations
      FROM Reservation
      GROUP BY Month
      ORDER BY Month DESC
      LIMIT 6
    `;
  
    db.query(query, (err, results) => {
      db.end();
      if (err) return res.status(500).send("Failed to load bar chart");
  
      res.json({
        labels: results.map(r => r.Month),
        datasets: [{
          label: "Reservations",
          data: results.map(r => r.Reservations),
        }]
      });
    });
  });

// For pieChartData.value = pieRes.data
router.get('/chart/pie', (req, res) => {
    const db = getDBConnection();
    const query = `
      SELECT a.AirlineName, COUNT(*) AS Count
      FROM Reservation r
      JOIN Flight f ON r.FlightID = f.FlightID
      JOIN Airline a ON f.AirlineID = a.AirlineID
      GROUP BY a.AirlineName
      LIMIT 3
    `;
  
    db.query(query, (err, results) => {
      db.end();
      if (err) return res.status(500).send("Failed to load pie chart");
  
      res.json({
        labels: results.map(r => r.AirlineName),
        datasets: [{
          data: results.map(r => r.Count)
        }]
      });
    });
  });

// For right legend of pie chart
router.get('/airlines', (req, res) => {
    const db = getDBConnection();
    const query = `
      SELECT a.AirlineName, COUNT(*) AS Count
      FROM Reservation r
      JOIN Flight f ON r.FlightID = f.FlightID
      JOIN Airline a ON f.AirlineID = a.AirlineID
      GROUP BY a.AirlineName
      LIMIT 3
    `;
  
    db.query(query, (err, results) => {
      db.end();
      const total = results.reduce((sum, r) => sum + r.Count, 0);
      const formatted = results.map((r, idx) => ({
        name: r.AirlineName,
        airline: ['orange', 'navy', 'light-blue'][idx], // match class name
        percent: `${Math.round((r.Count / total) * 100)}%`
      }));
      res.json(formatted);
    });
  });

// For flightsScheduleAnalysisData.value = lineRes.data
router.get('/chart/line', (req, res) => {
    const db = getDBConnection();
    const query = `
      SELECT 
        DATE_FORMAT(DepartureTime, '%Y-%m') AS Month,
        SUM(CASE WHEN Departure LIKE 'TH%' THEN 1 ELSE 0 END) AS Domestic,
        SUM(CASE WHEN Departure NOT LIKE 'TH%' THEN 1 ELSE 0 END) AS International
      FROM Flight
      GROUP BY Month
      ORDER BY Month DESC
      LIMIT 6
    `;
  
    db.query(query, (err, results) => {
      db.end();
      if (err) return res.status(500).send("Failed to load line chart");
  
      const labels = results.map(r => r.Month).reverse();
      const domesticData = results.map(r => r.Domestic).reverse();
      const intlData = results.map(r => r.International).reverse();
  
      res.json({
        labels,
        datasets: [
          { label: 'Domestic', data: domesticData },
          { label: 'International', data: intlData }
        ]
      });
    });
  });
  