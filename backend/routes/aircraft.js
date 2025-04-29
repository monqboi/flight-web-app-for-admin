import express from "express";
import db from "../db.js";

const router = express.Router();

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

// Get a single Aircraft by ID
router.get("/:id", (req, res) => {
    const aircraftId = req.params.id;
    const query = "SELECT * FROM Aircraft WHERE AircraftID = ?";
  
    db.query(query, [aircraftId], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error retrieving aircraft");
      }
      if (result.length === 0) {
        return res.status(404).send("Aircraft not found");
      }
      res.json(result[0]);
    });
});

// Update Aircraft status ('Available', 'Not Available')
router.put("/aircraft/:id/status", (req, res) => {
    const aircraftID = req.params.id;
    const { status } = req.body;
  
    // Ensure status sent is correct as the system supports.
    //const allowedStatuses = ['Available', 'Not Available'];
    //if (!allowedStatuses.includes(status)) {
    //  return res.status(400).send("Invalid status value.");
    //}
  
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