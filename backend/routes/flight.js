import express from "express";
import db from "../db.js";
import combineDateTime from "./utils/combineDateTime.js";

const router = express.Router();

// ------------- Flight -------------

// Get all Flights
router.get("/", (req, res) => {
  const query = "SELECT * FROM Flight";

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error retrieving flights");
    }

    const formattedResults = results.map((flight) => {
      const departureDateTime = new Date(flight.DepartureTime);
      const arrivalDateTime = new Date(flight.ArrivalTime);

      return {
        ...flight,
        DepartureDate: departureDateTime.toISOString().split('T')[0], // YYYY-MM-DD
        DepartureTimeOnly: departureDateTime.toISOString().split('T')[1].substring(0,5), // HH:MM
        ArrivalDate: arrivalDateTime.toISOString().split('T')[0],     // YYYY-MM-DD
        ArrivalTimeOnly: arrivalDateTime.toISOString().split('T')[1].substring(0,5) // HH:MM
      };
    });

    res.json(formattedResults);
  });
});

// Get a single Flight by ID
router.get("/:id", (req, res) => {
  const flightID = req.params.id;
  const query = "SELECT * FROM Flight WHERE FlightID = ?";

  db.query(query, [flightID], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error retrieving flight");
    }
    if (result.length === 0) {
      return res.status(404).send("Flight not found");
    }

    const flight = result[0];
    const departureDateTime = new Date(flight.DepartureTime);
    const arrivalDateTime = new Date(flight.ArrivalTime);

    const formattedFlight = {
      ...flight,
      DepartureDate: departureDateTime.toISOString().split('T')[0],
      DepartureTimeOnly: departureDateTime.toISOString().split('T')[1].substring(0,5),
      ArrivalDate: arrivalDateTime.toISOString().split('T')[0],
      ArrivalTimeOnly: arrivalDateTime.toISOString().split('T')[1].substring(0,5)
    };

    res.json(formattedFlight);
  });
});

// Create a new Flight
router.post("/", (req, res) => {
  try {
    const {
      airlineId,
      departure,
      destination,
      departureDate,    // 'Mar 09, 2024'
      departureTime,    // '18:00'
      arrivalDate,      // 'Mar 10, 2024'
      arrivalTime,      // '07:00'
      stopOver,         // '1 Stop'
      duration,         // 660
      aircraftId,       // aircraft id (integer)
      status            // 'Pending' | 'Delayed' | 'Completed' | 'Canceled'
    } = req.body;

    if (!airlineId || !departure || !destination || !departureDate || !departureTime || !arrivalDate || !arrivalTime || !stopOver || !duration || !aircraftId || !status) {
      return res.status(400).send("Missing required fields");
    }

    // Validate: Departure !== Destination
    if (departure === destination) {
      return res.status(400).send("Departure and destination must be different.");
    }
    
    // Combine Departure datetime
    const departureDateTime = combineDateTime(departureDate, departureTime);

    // Combine Arrival datetime
    let arrivalDateTime = combineDateTime(arrivalDate, arrivalTime);

    // Validate: DepartureTime must be before ArrivalTime
    if (new Date(departureDateTime) >= new Date(arrivalDateTime)) {
      return res.status(400).send("Departure time must be before arrival time.");
    }

    if (duration <= 0) {
      return res.status(400).send("Duration must be a positive number.");
    }

    const query = `
      INSERT INTO Flight (AirlineID, Departure, Destination, DepartureTime, ArrivalTime, StopOver, Duration, AircraftID, Status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      airlineId,
      departure,
      destination,
      departureDateTime,
      arrivalDateTime,
      stopOver,
      duration,
      aircraftId,
      status,
    ];

    db.query(query, values, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Database error when inserting flight");
      }
      res.status(201).json({ message: "Flight created successfully" });
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// Update an existing Flight
router.put("/:id", (req, res) => {
  const flightID = req.params.id;
  const {
    departure,
    destination,
    departureDate, 
    departureTime,   
    arrivalDate,      
    arrivalTime,      
    stopOver,         
    duration,         
    aircraftId,      
    status           
  } = req.body;
  
  // Validate: Departure !== Destination
  if (departure === destination) {
    return res.status(400).send("Departure and destination must be different.");
  }
  
  // Combine Departure datetime
  const departureDateTime = combineDateTime(departureDate, departureTime);

  // Combine Arrival datetime
  let arrivalDateTime = combineDateTime(arrivalDate, arrivalTime);

  // Validate: DepartureTime must be before ArrivalTime
  if (new Date(departureDateTime) >= new Date(arrivalDateTime)) {
    return res.status(400).send("Departure time must be before arrival time.");
  }

  if (duration <= 0) {
    return res.status(400).send("Duration must be a positive number.");
  }

  const query = `
    UPDATE Flight 
    SET Departure = ?, Destination = ?, DepartureTime = ?, ArrivalTime = ?, StopOver = ?, Duration = ?, AircraftID = ?, Status = ?
    WHERE FlightID = ?
  `;

  const values = [
      departure,
      destination,
      departureDateTime,
      arrivalDateTime,
      stopOver,
      duration,
      aircraftId,
      status,
      flightID
  ];

  db.query(query, values, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error updating flight");
    }
    res.json({ message: "Flight updated successfully" });
  });
});

// Delete a Flight
router.delete("/:id", (req, res) => {
  const flightID = req.params.id;
  const query = "DELETE FROM Flight WHERE FlightID = ?";

  db.query(query, [flightID], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error deleting flight");
    }
    res.json({ message: "Flight deleted successfully" });
  });
});
 
// ------------- Aircraft -------------

// Get all Aircrafts
router.get("/aircraft", (req, res) => {
  const query = "SELECT * FROM Aircraft";

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error retrieving aircraft");
    }
    res.json(results);
  });
});

// Update Aircraft status ('Available', 'Not Available')
router.put("/aircraft/:id/status", (req, res) => {
  const aircraftID = req.params.id;
  const { status } = req.body;

  const query = `
    UPDATE Aircraft
    SET Status = ?
    WHERE AircraftID = ?
  `;

  db.query(query, [status, aircraftID], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error updating aircraft status");
    }
    res.json({ message: "Aircraft status updated successfully" });
  });
});

export default router;
