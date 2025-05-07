import express from 'express';
import db from '../db.js';

const router = express.Router();

// ---------- 1. Stats Summary Cards ----------
router.get('/stats', async (req, res) => {
  try {
    const [[{ countUsers }]] = await db.query('SELECT COUNT(*) AS countUsers FROM User');
    const [[{ countFlights }]] = await db.query('SELECT COUNT(*) AS countFlights FROM Flight');
    const [[{ totalRevenue }]] = await db.query(`
      SELECT IFNULL(SUM(Amount), 0) AS totalRevenue
      FROM Payment WHERE Status = 'Successful'
    `);

    res.json([
      { title: 'Users', value: countUsers },
      { title: 'Flights', value: countFlights },
      { title: 'Revenue', value: `${totalRevenue}฿` },
      { title: 'Global', value: 'Online' } // mock
    ]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// ---------- 2. Recent Bookings Section ----------
router.get('/bookings', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        f.FlightID,
        f.Departure,
        f.Destination,
        f.DepartureDateTime,
        f.ArrivalDateTime,
        f.StopOver,
        f.Duration,
        a.AirlineID,
        a.Name AS Airline,
        (
          SELECT COUNT(*) 
          FROM Passenger p
          JOIN Reservation r2 ON p.ReservationID = r2.ReservationID
          JOIN Flight f2 ON r2.FlightID = f2.FlightID
          WHERE f2.AirlineID = a.AirlineID
        ) AS passengerCount
      FROM Reservation r
      JOIN Flight f ON r.FlightID = f.FlightID
      JOIN Airline a ON f.AirlineID = a.AirlineID
      GROUP BY r.FlightID
      ORDER BY MAX(r.BookingDate) DESC
      LIMIT 2
    `);

    const bookings = results.map(r => {
      const departure = new Date(r.DepartureDateTime);
      const arrival = new Date(r.ArrivalDateTime);
      const durationMinutes = Math.round((arrival - departure) / 60000);
      const stopOvers = (r.StopOver || '').split(',').map(s => s.trim()).filter(Boolean);

      return {
        departure: {
          airport: r.Departure,
          time: departure.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        },
        arrival: {
          airport: r.Destination,
          time: arrival.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        },
        flight: {
          departure: {
            date: departure.toISOString().split("T")[0],
            time: departure.toTimeString().slice(0,5)
          },
          destination: {
            date: arrival.toISOString().split("T")[0],
            time: arrival.toTimeString().slice(0,5)
          },
          duration: {
            time: r.Duration || durationMinutes,
            stop: stopOvers.length
          },
          stopOvers: stopOvers
        },
        airline: r.Airline,
        date: departure.toLocaleDateString(),
        seats: `${r.passengerCount}`
      };
    });

    res.json(bookings);
  } catch (err) {
    console.error("Error in /bookings:", err);
    res.status(500).json({ error: 'Failed to load bookings' });
  }
});

// ---------- 3. Reservation Summary (Bar Chart) ----------
router.get('/reservation-chart', async (req, res) => {
  try {
    const [results] = await db.query(`
        SELECT DATE(BookingDate) as date, COUNT(*) as count
        FROM Reservation
        GROUP BY DATE(BookingDate)
        ORDER BY date DESC
        LIMIT 1
    `);

    const data = results.reverse(); // chronological order
    res.json({
      labels: data.map(r => r.date),
      datasets: [
        {
          label: 'Reservations',
          data: data.map(r => r.count)
        }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load reservation chart' });
  }
});

// ---------- 4. Popular Airlines (Pie Chart) ----------
router.get('/popular-airlines', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT a.Name AS name, COUNT(*) AS count
      FROM Reservation r
      JOIN Flight f ON r.FlightID = f.FlightID
      JOIN Airline a ON f.AirlineID = a.AirlineID
      GROUP BY a.AirlineID
      ORDER BY count DESC
      LIMIT 3
    `);

    res.json({
      labels: results.map(r => r.name),
      datasets: [
        {
          label: 'Popular Airlines',
          data: results.map(r => r.count)
        }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load popular airlines chart' });
  }
});

// ---------- 5. Flights Schedule (Line Chart) ----------
router.get('/schedule-chart', async (req, res) => {
  try {
    const [domestic] = await db.query(`
      SELECT DATE(DepartureDateTime) AS date, COUNT(*) AS count
      FROM Flight
      WHERE LENGTH(StopOver) = 0
      GROUP BY DATE(DepartureDateTime)
      ORDER BY date DESC
      LIMIT 7
    `);

    const [international] = await db.query(`
      SELECT DATE(DepartureDateTime) AS date, COUNT(*) AS count
      FROM Flight
      WHERE LENGTH(StopOver) > 0
      GROUP BY DATE(DepartureDateTime)
      ORDER BY date DESC
      LIMIT 7
    `);

    const allDates = [...new Set([...domestic, ...international].map(r => r.date))].sort();

    const dataset = (source, label) => ({
      label,
      data: allDates.map(d => {
        const found = source.find(s => s.date === d);
        return found ? found.count : 0;
      })
    });

    res.json({
      labels: allDates,
      datasets: [
        dataset(domestic, 'Domestic'),
        dataset(international, 'International')
      ]
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load flight schedule chart' });
  }
});

export default router;
