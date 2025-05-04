import express from "express";
import db from "../db.js";

const router = express.Router();

// ------------- Aircraft -------------

// Get all Aircrafts
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM Aircraft");
    res.json(rows);
  } catch (err) {
    console.error("Error retrieving aircraft:", err);
    res.status(500).send("Error retrieving aircraft");
  }
});

// Get one Aircraft
router.get("/:id", async (req, res) => {
  const aircraftID = req.params.id;
  try {
    const [rows] = await db.query("SELECT * FROM Aircraft WHERE AircraftID = ?", [aircraftID]);
    if (rows.length === 0) {
      return res.status(404).send("Aircraft not found");
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Error retrieving aircraft:", err);
    res.status(500).send("Error retrieving aircraft");
  }
});

// Create new Aircraft
router.post("/", async (req, res) => {
  try {
    const { model, capacity, airlineID, registrationNumber, aircraftStatus } = req.body;

    const allowedStatuses = ["Available", "Not Available"];
    if (!allowedStatuses.includes(aircraftStatus)) {
      return res.status(400).send("Invalid status value");
    }

    const query = `
      INSERT INTO Aircraft (Model, Capacity, AirlineID, RegistrationNumber, Status)
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [model, capacity, airlineID, registrationNumber, aircraftStatus];
    const [results] = await db.query(query, values);

    res.status(201).json({ message: "Aircraft created", aircraftID: results.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating aircraft");
  }
});

// Update Aircraft
router.put("/:id", async (req, res) => {
  try {
    const aircraftID = req.params.id;
    const { model, capacity, airlineID, registrationNumber, aircraftStatus } = req.body;

    const allowedStatuses = ["Available", "Not Available"];
    if (!allowedStatuses.includes(aircraftStatus)) {
      return res.status(400).send("Invalid status value");
    }

    const query = `
      UPDATE Aircraft
      SET Model = ?, Capacity = ?, AirlineID = ?, RegistrationNumber = ?, Status = ?
      WHERE AircraftID = ?
    `;
    const values = [model, capacity, airlineID, registrationNumber, aircraftStatus, aircraftID];
    const [results] = await db.query(query, values);

    if (results.affectedRows === 0) {
      return res.status(404).send("Aircraft not found");
    }

    res.json({ message: "Aircraft updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating aircraft");
  }
});

export default router;