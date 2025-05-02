import express from "express";
import db from "../db.js";
import combineDateTime from '../utils/combineDateTime.js';

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
      airlineID, // INTEGER: 1234
      departure, // VARCHAR(100): 'BKK'
      destination, // VARCHAR(100): 'USA'
      departureDate,    // '2025-05-15'
      departureTime,    // '18:00' 
      arrivalDate,      // '2025-05-16'
      arrivalTime,      // '07:00'
      stopOver,         // VARCHAR(100): 'JPN, KR'
      duration,         // INTEGER: 660
      aircraftID,       // INTEGER: 1234
      status            // ENUM('Pending', 'Delayed', 'Completed', 'Canceled')
    } = req.body;

    // Ensure departure & destination is Uppercase
    const departureUpper = departure.toUpperCase();
    const destinationUpper = destination.toUpperCase();

    // Validate: Departure !== Destination
    if (departureUpper === destinationUpper) {
      return res.status(400).send("Departure and destination must be different.");
    }
    
    // Combine datetime
    const departureDateTime = combineDateTime(departureDate, departureTime);
    const arrivalDateTime = combineDateTime(arrivalDate, arrivalTime);

    // Validate: DepartureTime must be before ArrivalTime
    if (new Date(departureDateTime) >= new Date(arrivalDateTime)) {
      return res.status(400).send("Departure time must be before arrival time.");
    }

    // Ensure duration > 0
    if (duration <= 0) {
      return res.status(400).send("Duration must be a positive number.");
    }

    // Ensure status sent is correct as the system supports.
    //const allowedStatuses = ['Pending', 'Delayed', 'Completed', 'Canceled'];
    //if (!allowedStatuses.includes(status)) {
    //  return res.status(400).send("Invalid status value.");
    //}

    const query = `
      INSERT INTO Flight (AirlineID, Departure, Destination, DepartureTime, ArrivalTime, StopOver, Duration, AircraftID, Status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      airlineID,
      departureUpper,
      destinationUpper,
      departureDateTime, // DATETIME: '2025-05-15 22:00'
      arrivalDateTime, // DATETIME: '2025-05-16 6:00'
      stopOver,
      duration,
      aircraftID,
      status,
    ];

    db.query(query, values, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Database error when inserting flight");
      }
      res.status(201).json({
        message: "Flight created successfully", 
        flightID: results.insertId 
      }); 
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
    aircraftID,      
    status           
  } = req.body;
  
  // Ensure departure & destination is Uppercase
  const departureUpper = departure.toUpperCase();
  const destinationUpper = destination.toUpperCase();

  // Validate: Departure != Destination
  if (departureUpper === destinationUpper) {
    return res.status(400).send("Departure and destination must be different.");
  }
  
  // Combine datetime
  const departureDateTime = combineDateTime(departureDate, departureTime);
  const arrivalDateTime = combineDateTime(arrivalDate, arrivalTime);

  // Validate: DepartureTime must be before ArrivalTime
  if (new Date(departureDateTime) >= new Date(arrivalDateTime)) {
    return res.status(400).send("Departure time must be before arrival time.");
  }

  // Ensure duration > 0
  if (duration <= 0) {
    return res.status(400).send("Duration must be a positive number.");
  }

  // Ensure status sent is correct as the system supports.
  const allowedStatuses = ['Pending', 'Delayed', 'Completed', 'Canceled'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).send("Invalid status value.");
  }
  
  const query = `
    UPDATE Flight 
    SET Departure = ?, Destination = ?, DepartureTime = ?, ArrivalTime = ?, StopOver = ?, Duration = ?, AircraftID = ?, Status = ?
    WHERE FlightID = ?
  `;

  const values = [
      departureUpper,
      destinationUpper,
      departureDateTime,
      arrivalDateTime,
      stopOver,
      duration,
      aircraftID,
      status,
      flightID
  ];

  db.query(query, values, (err, results) => {
    if (results.affectedRows === 0) {
      return res.status(404).send("Flight not found");
    }
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
    if (results.affectedRows === 0) {
      return res.status(404).send("Flight not found");
    }
    res.json({ message: "Flight deleted successfully" });
  });
});

export default router;
