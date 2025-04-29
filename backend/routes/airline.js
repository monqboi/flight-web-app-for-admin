import express from "express";
import db from "../db.js";

const router = express.Router();

// ------------- Airline -------------

// Get all Airlines
router.get("/", (req, res) => {
    const query = "SELECT * FROM Airline";
  
    db.query(query, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error retrieving airlines");
      }
      res.json(results);
    });
  });

// Get a single Airline by ID
router.get("/:id", (req, res) => {
  const airlineId = req.params.id;
  const query = "SELECT * FROM Airline WHERE AirlineID = ?";

  db.query(query, [airlineId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error retrieving airline");
    }
    if (result.length === 0) {
      return res.status(404).send("Airline not found");
    }
    res.json(result[0]);
  });
});

// Create a new Airline
router.post("/", (req, res) => {
  const {
    airlineId, // INTEGER: SG1234
    name, // 'Singapore Airlines'
    name_short, // VARCHAR(10): 'SIA'
    code, // VARCHAR(10): 'SG'
    contactPrefix, // VARCHAR(5): '+65'
    contactNumber, // VARCHAR(20): '62238888'
    country, // VARCHAR(50): 'Singapore'
    headquarters, // VARCHAR(50): 'Changi Airport, Singapore'
    airlineStatus, // ENUM('Open', 'Temporarily closed')
    airlineColor, // #ffffff
    airlineImage // TEXT: Base64 String
  } = req.body;

  // Ensure name_short & code is Uppercase, and avoid whitespace issues
  const name_shortUpper = name_short.trim().toUpperCase();
  const codeUpper = code.trim().toUpperCase();

  // Ensure status sent is correct as the system supports.
  //const allowedStatuses = ['Open', 'Temporarily closed'];
  //if (!allowedStatuses.includes(airlineStatus)) {
  //  return res.status(400).send("Invalid status value.");
  //}

  //Check if airlineID already exists
  const checkQuery = "SELECT * FROM Airline WHERE AirlineID = ?";

  db.query(checkQuery, [airlineId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error checking airline ID");
    }

    if (results.length > 0) {
      // If airlineID exists, return an error
      return res.status(400).send("Airline ID already exists");
    }

    // If airlineID doesn't exist, proceed with insertion
    const insertQuery = `
      INSERT INTO Airline 
      (AirlineID, Name, AirlineNameShort, Code, ContactPrefix, ContactNumber, Country, Headquarters, AirlineStatus, AirlineColor, AirlineLogo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      airlineId,
      name,
      name_shortUpper,
      codeUpper, 
      contactPrefix, 
      contactNumber, 
      country, 
      headquarters, 
      airlineStatus, 
      airlineColor, 
      airlineImage 
    ];

    db.query(insertQuery, values, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error adding new airline");
      }
      res.status(201).json({
        message: "Airline added successfully",
        airlineId });
    });
  });
});

// Update Airline Status ('Open', 'Temporarily closed')
router.put("/:id/status", (req, res) => {
  const airlineId = req.params.id;
  const { airlineStatus } = req.body;

  // Ensure status sent is correct as the system supports.
  //const allowedStatuses = ['Open', 'Temporarily closed'];
  //if (!allowedStatuses.includes(airlineStatus)) {
  //  return res.status(400).send("Invalid status value.");
  //}

  const query = `
    UPDATE Airline 
    SET AirlineStatus = ? 
    WHERE AirlineID = ?
  `;

  db.query(query, [airlineStatus, airlineId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Database error when updating airline status");
    }
    if (results.affectedRows === 0) {
      return res.status(404).send("Airline not found");
    }
    res.json({ message: "Airline status updated successfully" });
  });
});

export default router;
