import express from "express";
import getDBConnection from "../db.js";

const router = express.Router();

// ------------- Airline -------------

// Get all Airlines
router.get("/", (req, res) => {
  const db = getDBConnection();
  const query = "SELECT * FROM Airline";

  db.query(query, (err, results) => {
    db.end(); // Close connection everytime to prevent Connection lost
    if (err) {
      console.error(err);
      return res.status(500).send("Error retrieving airlines");
    }
    res.json(results);
  });
});

// Get a single Airline by ID
router.get("/:id", (req, res) => {
  const db = getDBConnection();
  const airlineID = req.params.id;
  const query = "SELECT * FROM Airline WHERE AirlineID = ?";

  db.query(query, [airlineID], (err, result) => {
    db.end();
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
  const db = getDBConnection();
  console.log("Incoming airline payload:", req.body);
  const {
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

  const insertQuery = `
    INSERT INTO Airline 
    (Name, AirlineNameShort, Code, ContactPrefix, ContactNumber, Country, Headquarters, AirlineStatus, AirlineColor, AirlineLogo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
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
    db.end();
    if (err) {
      console.error(err);
      return res.status(500).send("Error adding new airline");
    }
    console.log("Insert result:", results); 
    res.status(201).json({
      message: "Airline added successfully",
      airlineID: results.insertId });
  });
});

// Update all fields of an Airline
router.put("/:id", (req, res) => {
  const db = getDBConnection();
  const airlineID = req.params.id;
  const {
    name,
    name_short,
    code,
    contactPrefix,
    contactNumber,
    country,
    headquarters,
    airlineStatus,
    airlineColor,
    airlineImage,
  } = req.body;

  const query = `
    UPDATE Airline
    SET Name = ?, AirlineNameShort = ?, Code = ?, ContactPrefix = ?, ContactNumber = ?, 
        Country = ?, Headquarters = ?, AirlineStatus = ?, AirlineColor = ?, AirlineLogo = ?
    WHERE AirlineID = ?
  `;

  const values = [
    name,
    name_short.trim().toUpperCase(),
    code.trim().toUpperCase(),
    contactPrefix,
    contactNumber,
    country,
    headquarters,
    airlineStatus,
    airlineColor,
    airlineImage,
    airlineID,
  ];

  db.query(query, values, (err, results) => {
    db.end();
    if (err) {
      console.error(err);
      return res.status(500).send("Failed to update airline");
    }
    if (results.affectedRows === 0) {
      return res.status(404).send("Airline not found");
    }
    res.json({ message: "Airline updated successfully" });
  });
});

// Update Airline Status ('Open', 'Temporarily closed')
router.put("/:id/status", (req, res) => {
  const db = getDBConnection();
  const airlineID = req.params.id;
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

  db.query(query, [airlineStatus, airlineID], (err, results) => {
    db.end();
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

// Delete an Airline
router.delete("/:id", (req, res) => {
  const db = getDBConnection();
  const airlineID = req.params.id;
  const query = "DELETE FROM Airline WHERE AirlineID = ?";

  db.query(query, [airlineID], (err, results) => {
    db.end();
    if (err) {
      console.error(err);
      return res.status(500).send("Error deleting airline");
    }
    if (results.affectedRows === 0) {
      return res.status(404).send("Airline not found");
    }
    res.json({ message: "Airline deleted successfully" });
  });
});


export default router;

