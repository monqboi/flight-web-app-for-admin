import express from "express";
import db from "../db.js";
import combineDateTime from '../utils/combineDateTime.js';

const router = express.Router();

// ------------- Flight -------------

// Get all Flights
router.get("/", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM Flight");

    const formattedResults = results.map((flight) => {
      const departureDateTime = new Date(flight.DepartureDateTime);
      const arrivalDateTime = new Date(flight.ArrivalDateTime);
      return {
        flightID: flight.FlightID,
        airlineID: flight.AirlineID,
        departure: {
          airport: flight.Departure,
          date: departureDateTime.toISOString().split("T")[0],
          time: departureDateTime.toISOString().split("T")[1].substring(0, 5),
        },
        destination: {
          airport: flight.Destination,
          date: arrivalDateTime.toISOString().split("T")[0],
          time: arrivalDateTime.toISOString().split("T")[1].substring(0, 5),
        },
        stopOvers: flight.StopOver ? flight.StopOver.split(",").map(x => x.trim()) : [],
        duration: flight.Duration,
        aircraftID: flight.AircraftID,
        flightStatus: flight.Status,
        isSeatAvailable: true,
      };
    });

    res.json(formattedResults);
  } catch (err) {
    console.error("Error fetching flights:", err);
    res.status(500).json({ error: "Failed to fetch flights" });
  }
});

// Get a single Flight by ID
router.get("/:id", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM Flight WHERE FlightID = ?", [req.params.id]);

    if (results.length === 0) {
      return res.status(404).json({ error: "Flight not found" });
    }

    const flight = results[0];
    const departureDateTime = new Date(flight.DepartureDateTime);
    const arrivalDateTime = new Date(flight.ArrivalDateTime);

    res.json({
      flightID: flight.FlightID,
      airlineID: flight.AirlineID,
      departure: {
        airport: flight.Departure,
        date: departureDateTime.toISOString().split("T")[0],
        time: departureDateTime.toISOString().split("T")[1].substring(0, 5),
      },
      destination: {
        airport: flight.Destination,
        date: arrivalDateTime.toISOString().split("T")[0],
        time: arrivalDateTime.toISOString().split("T")[1].substring(0, 5),
      },
      stopOvers: flight.StopOver ? flight.StopOver.split(",").map(x => x.trim()) : [],
      duration: flight.Duration,
      aircraftID: flight.AircraftID,
      flightStatus: flight.Status,
      isSeatAvailable: true,
    });
  } catch (err) {
    console.error("Error fetching flight:", err);
    res.status(500).json({ error: "Failed to fetch flight" });
  }
});

// Create a new Flight
router.post("/", async (req, res) => {
  try {
    const {
      airlineID, // INTEGER: 1234
      departure, // VARCHAR(100): 'BKK'
      destination, // VARCHAR(100): 'USA'
      departureDate,    // '2025-05-15'
      departureTime,    // '18:00' 
      arrivalDate,      // '2025-05-16'
      arrivalTime,      // '07:00'
      stopOvers,         // VARCHAR(100): ['JPN', 'KR'] -> 'JPN', 'KR'
      duration,         // INTEGER: 660
      aircraftID,       // INTEGER: 1234
      status            // ENUM('Pending', 'Delayed', 'Completed', 'Canceled')
    } = req.body;

    const departureDateTime = combineDateTime(departureDate, departureTime);
    const arrivalDateTime = combineDateTime(arrivalDate, arrivalTime);

    // Validate: Departure !== Destination
    if (departure === destination) {
      return res.status(400).send("Departure and destination must be different.");
    }

    const query = `
      INSERT INTO Flight 
      (AirlineID, Departure, Destination, DepartureDateTime, ArrivalDateTime, StopOver, Duration, AircraftID, Status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      airlineID,
      departure,
      destination,
      departureDateTime,
      arrivalDateTime,
      stopOvers.join(", "),
      duration,
      aircraftID,
      status
    ];

    const [result] = await db.query(query, values);

    res.status(201).json({ message: "Flight created successfully", flightID: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Update an existing Flight
router.put("/:id", async (req, res) => {
  try {
    const {
      departure, destination,
      departureDate, departureTime,
      arrivalDate, arrivalTime,
      stopOvers, duration,
      aircraftID, status
    } = req.body;

    const departureDateTime = combineDateTime(departureDate, departureTime);
    const arrivalDateTime = combineDateTime(arrivalDate, arrivalTime);

    // Validate: Departure !== Destination
    if (departure === destination) {
      return res.status(400).send("Departure and destination must be different.");
    }

    const stopOverString = stopOvers.filter(x => x.trim() !== "").join(", ");

    const query = `
      UPDATE Flight 
      SET Departure = ?, Destination = ?, DepartureDateTime = ?, ArrivalDateTime = ?, StopOver = ?, Duration = ?, AircraftID = ?, Status = ?
      WHERE FlightID = ?
    `;

    const values = [
      departure,
      destination,
      departureDateTime,
      arrivalDateTime,
      stopOverString,
      duration,
      aircraftID,
      status,
      req.params.id
    ];

    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).send("Flight not found");
    }

    res.json({ message: "Flight updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating flight");
  }
});

// Delete a Flight
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM Flight WHERE FlightID = ?", [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).send("Flight not found");
    }

    res.json({ message: "Flight deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting flight");
  }
});

export default router;
