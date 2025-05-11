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
      INSERT INTO Aircraft (Model, Capacity, AirlineID, RegistrationNumber, AircraftStatus)
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
      SET Model = ?, Capacity = ?, AirlineID = ?, RegistrationNumber = ?, AircraftStatus = ?
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

// Delete Aircraft (only if no active flights using it)
router.delete("/:id", async (req, res) => {
  const aircraftID = req.params.id;

  try {
    // Check if there are any flights using this aircraft that are not completed.
    const [flights] = await db.query(
      `
      SELECT * FROM Flight
      WHERE AircraftID = ? AND Status != 'Completed'
      `,
      [aircraftID]
    );

    if (flights.length > 0) {
      return res.status(400).json({
        error: "Cannot delete aircraft. It is currently used in active or incomplete flights.",
        flightsUsingAircraft: flights,
      });
    }

    // If there are no flights that use this aircraft that are not-completed, you can delete them.
    const [result] = await db.query(
      `DELETE FROM Aircraft WHERE AircraftID = ?`,
      [aircraftID]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Aircraft not found." });
    }

    res.json({ message: "Aircraft deleted successfully." });
  } catch (err) {
    console.error("Error deleting aircraft:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});


export default router;