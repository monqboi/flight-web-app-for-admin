import express from "express";
import db from "../db.js";
import combineDateTime from '../utils/combineDateTime.js';

const router = express.Router();

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}


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
        duration: {
          time: flight.Duration,
          stop: flight.StopOver ? flight.StopOver.split(",").length : 0,
        },
        aircraftID: flight.AircraftID,
        flightStatus: flight.Status,
        flightPrice: flight.Price,
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
      duration: {
        time: flight.Duration,
        stop: flight.StopOver ? flight.StopOver.split(",").length : 0,
      },
      aircraftID: flight.AircraftID,
      flightStatus: flight.Status,
      flightPrice: flight.Price,
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
      airlineID,
      departure,
      destination,
      departureDate,
      departureTime,
      arrivalDate,
      arrivalTime,
      stopOvers,
      duration,
      aircraftID,
      status,
      price
    } = req.body;

    const departureDateTime = combineDateTime(departureDate, departureTime);
    const arrivalDateTime = combineDateTime(arrivalDate, arrivalTime);

    if (departure === destination) {
      return res.status(400).send("Departure and destination must be different.");
    }

    const query = `
      INSERT INTO Flight 
      (AirlineID, Departure, Destination, DepartureDateTime, ArrivalDateTime, StopOver, Duration, AircraftID, Status, Price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      capitalize(status),
      price
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
      departure,
      destination,
      departureDate,
      departureTime,
      arrivalDate,
      arrivalTime,
      stopOvers,
      duration,
      aircraftID,
      status,
      price
    } = req.body;

    const departureDateTime = combineDateTime(departureDate, departureTime);
    const arrivalDateTime = combineDateTime(arrivalDate, arrivalTime);

    if (departure === destination) {
      return res.status(400).send("Departure and destination must be different.");
    }

    const query = `
      UPDATE Flight SET 
        Departure = ?, 
        Destination = ?, 
        DepartureDateTime = ?, 
        ArrivalDateTime = ?, 
        StopOver = ?, 
        Duration = ?, 
        AircraftID = ?, 
        Status = ?
        Price = ?
      WHERE FlightID = ?
    `;

    const values = [
      departure,
      destination,
      departureDateTime,
      arrivalDateTime,
      stopOvers.join(", "),
      duration,
      aircraftID,
      capitalize(status),
      price,
      req.params.id,
    ];

    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Flight not found" });
    }

    res.json({ message: "Flight updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Delete a Flight
router.delete("/:id", async (req, res) => {
  const flightID = req.params.id;

  try {
    // Check if there is a Reservation associated with this Flight (ignore the status)
    const [reservationCheck] = await db.query(
      "SELECT COUNT(*) AS count FROM Reservation WHERE FlightID = ?",
      [flightID]
    );

    if (reservationCheck[0].count > 0) {
      return res
        .status(400)
        .json({ error: "Cannot delete flight with any existing reservations." });
    }

    // If there is no reservation, you can delete it.
    const [result] = await db.query("DELETE FROM Flight WHERE FlightID = ?", [flightID]);

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