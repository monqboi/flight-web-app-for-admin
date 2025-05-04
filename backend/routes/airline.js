import express from "express";
import db from "../db.js";

const router = express.Router();

// ------------- Airline -------------

// Get all Airlines
router.get("/", async (req, res) => {
  const query = `SELECT 
    AirlineID as airlineID,
    Name as name,
    AirlineNameShort as name_short,
    Country as country,
    Headquarters as headquarters,
    Code as code,
    ContactPrefix as contactPrefix,
    ContactNumber as contactNumber,
    AirlineStatus as airlineStatus,
    AirlineColor as airlineColor,
    AirlineImage as airlineImage
  FROM Airline`;

  try {
    const [results] = await db.query(query);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving airlines");
  }
});

// Get a single Airline by ID
router.get("/:id", async (req, res) => {
  const airlineID = req.params.id;
  const query = "SELECT * FROM Airline WHERE AirlineID = ?";

  try {
    const [result] = await db.query(query, [airlineID]);
    if (result.length === 0) {
      return res.status(404).send("Airline not found");
    }
    res.json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving airline");
  }
});

// Create a new Airline
router.post("/", async (req, res) => {
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
    (Name, AirlineNameShort, Code, ContactPrefix, ContactNumber, Country, Headquarters, AirlineStatus, AirlineColor, AirlineImage)
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

  try {
    const [results] = await db.query(insertQuery, values);
    res.status(201).json({
      message: "Airline added successfully",
      airlineID: results.insertId
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding new airline");
  }
});

// Update full Airline data by ID
router.put("/:id", async (req, res) => {
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

  // Ensure name_short & code is Uppercase, and avoid whitespace issues
  const name_shortUpper = (name_short || "").trim().toUpperCase();
  const codeUpper = (code || "").trim().toUpperCase();
  
  // Ensure status sent is correct as the system supports.
  //const allowedStatuses = ['Open', 'Temporarily closed'];
  //if (!allowedStatuses.includes(airlineStatus)) {
  //  return res.status(400).send("Invalid status value.");
  //}

  const query = `
    UPDATE Airline 
    SET 
      Name = ?, 
      AirlineNameShort = ?,
      Code = ?, 
      ContactPrefix = ?, 
      ContactNumber = ?, 
      Country = ?, 
      Headquarters = ?, 
      AirlineStatus = ?, 
      AirlineColor = ?, 
      AirlineImage = ?
    WHERE AirlineID = ?
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
    airlineImage,
    airlineID,
  ];

  try {
    const [results] = await db.query(query, values);
    if (results.affectedRows === 0) {
      return res.status(404).send("Airline not found");
    }
    res.json({ message: "Airline updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error when updating airline");
  }
});

// Update Airline Status ('Open', 'Temporarily closed')
router.put("/:id/status", async (req, res) => {
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

  try {
    const [results] = await db.query(query, [airlineStatus, airlineID]);
    if (results.affectedRows === 0) {
      return res.status(404).send("Airline not found");
    }
    res.json({ message: "Airline status updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error when updating airline status");
  }
});

export default router;
