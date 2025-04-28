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

// Get a specific Airline
router.get("/:id", (req, res) => {
  const airlineID = req.params.id;
  const query = "SELECT * FROM Airline WHERE AirlineID = ?";

  db.query(query, [airlineID], (err, result) => {
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
    airlineID,
    name,
    name_short,
    code,
    contactPrefix,
    contactNumber,
    country,
    headquarters,
    airlineStatus,
    airlineColor,
    airlineImage // Base64 Img
  } = req.body;

  // Validate: Required fields
  if (!airlineID || !name || !name_short || !code || !contactPrefix || !contactNumber || !country || !headquarters || !airlineStatus || !airlineColor || !airlineImage) {
    return res.status(400).send("Missing required fields");
  }

  const query = `
    INSERT INTO Airline 
    (AirlineID, Name, AirlineNameShort, Code, ContactPrefix, ContactNumber, Country, Headquarters, AirlineStatus, AirlineColor, AirlineLogo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    airlineID,
    name,
    name_short,
    code,
    contactPrefix,
    contactNumber,
    country,
    headquarters,
    airlineStatus,
    airlineColor,
    airlineImage // Base64 String
  ];

  db.query(query, values, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Database error when creating airline");
    }
    res.status(201).json({ message: "Airline created successfully" });
  });
});

// Update Airline Status ('Open', 'Tempolarily Closed')
router.put("/:id/status", (req, res) => {
  const airlineID = req.params.id;
  const { airlineStatus } = req.body;

  if (!airlineStatus) {
    return res.status(400).send("Missing airlineStatus field");
  }

  const query = `
    UPDATE Airline 
    SET AirlineStatus = ?
    WHERE AirlineID = ?
  `;

  db.query(query, [airlineStatus, airlineID], (err, results) => {
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
