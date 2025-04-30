import express from "express";
import db from "../db.js";

const router = express.Router();

// ------------- Reservation -------------

// Get all Reservations
router.get("/", (req, res) => {
    const query = "SELECT * FROM Reservation";
  
    db.query(query, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error retrieving reservations");
      }
      res.json(results);
    });
});

// Get a single Reservation by ID
router.get("/:id", (req, res) => {
    const reservationID = req.params.id;
    const query = "SELECT * FROM Reservation WHERE ReservationID = ?";
  
    db.query(query, [reservationID], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error retrieving reservation");
      }
      if (result.length === 0) {
        return res.status(404).send("Reservation not found");
      }
      res.json(result[0]);
    });
  });

// Create a new Reservation
router.post("/", (req, res) => {
    const {
      userID,        // INTEGER: 1234
      flightID,      // INTEGER: 1234
      seatNumber,    // STRING: 'A2'
      status,        // ENUM('Pending', 'Confirmed', 'Cancelled')
      bookingDate    // DATETIME: '2025-05-15 08:00'
    } = req.body;
  
    if (!userID || !flightID || !seatNumber || !status || !bookingDate) {
      return res.status(400).send("Missing required reservation fields");
    }
  
    // Check if user exists
    const userQuery = "SELECT * FROM User WHERE UserID = ?";
    db.query(userQuery, [userID], (err, userResult) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Database error checking user");
      }
      if (userResult.length === 0) {
        return res.status(404).send("User not found");
      }
  
      // Find SeatID from SeatNumber + FlightID
      const seatQuery = `
        SELECT SeatID FROM Seat 
        WHERE SeatNumber = ? AND FlightID = ? AND Availability = 'Yes'
      `;
      db.query(seatQuery, [seatNumber, flightID], (err, seatResult) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Database error finding seat");
        }
        if (seatResult.length === 0) {
          return res.status(400).send("Seat not available or not found for this flight");
        }
  
        const seatID = seatResult[0].SeatID;
  
        // Insert Reservation
        const insertQuery = `
          INSERT INTO Reservation (UserID, FlightID, SeatID, Status, BookingDate)
          VALUES (?, ?, ?, ?, ?)
        `;
        const values = [userID, flightID, seatID, status, bookingDate];
        db.query(insertQuery, values, (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).send("Database error creating reservation");
          }
  
          // Update Seat to 'No' (not available)
          const updateSeatQuery = `
            UPDATE Seat SET Availability = 'No' WHERE SeatID = ? AND FlightID = ?
          `;
          db.query(updateSeatQuery, [seatID, flightID], (err) => {
            if (err) {
              console.error(err);
              return res.status(500).send("Reservation created but failed to update seat availability");
            }
  
            res.status(201).json({
              message: "Reservation created successfully",
              reservationID: result.insertId,
              seatID: seatID,
              seatNumber: seatNumber
            });
          });
        });
      });
    });
  });

// Delete a Reservation
router.delete("/:id", (req, res) => {
    const reservationID = req.params.id;
    const query = "DELETE FROM Reservation WHERE ReservationID = ?";
  
    db.query(query, [reservationID], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Reservation deleting flight");
      }
      if (results.affectedRows === 0) {
        return res.status(404).send("Reservation not found");
      }
      res.json({ message: "Reservation deleted successfully" });
    });
  });

// Update a Reservation
router.put("/:id", (req, res) => {
    const reservationID = req.params.id;
    const {
      userID,
      flightID,
      seatNumber,
      status,
      bookingDate
    } = req.body;
  
    if (!userID || !flightID || !seatNumber || !status || !bookingDate) {
      return res.status(400).send("Missing required reservation fields");
    }
  
    // Check if User exists
    const userQuery = "SELECT * FROM User WHERE UserID = ?";
    db.query(userQuery, [userID], (err, userResult) => {
      if (err) return res.status(500).send("Error checking user");
      if (userResult.length === 0) return res.status(404).send("User not found");
  
      // Find new SeatID from SeatNumber + FlightID
      const seatQuery = `
        SELECT SeatID FROM Seat 
        WHERE SeatNumber = ? AND FlightID = ? AND Availability = 'Yes'
      `;
      db.query(seatQuery, [seatNumber, flightID], (err, seatResult) => {
        if (err) return res.status(500).send("Error finding new seat");
        if (seatResult.length === 0) {
          return res.status(400).send("Seat not available or doesn't exist");
        }
  
        const newSeatID = seatResult[0].SeatID;
  
        // Get the old SeatID to update availability
        const oldSeatQuery = "SELECT SeatID FROM Reservation WHERE ReservationID = ?";
        db.query(oldSeatQuery, [reservationID], (err, oldResult) => {
          if (err) return res.status(500).send("Error retrieving old reservation");
          if (oldResult.length === 0) return res.status(404).send("Reservation not found");
  
          const oldSeatID = oldResult[0].SeatID;
  
          // Update Reservation
          const updateQuery = `
            UPDATE Reservation
            SET UserID = ?, FlightID = ?, SeatID = ?, Status = ?, BookingDate = ?
            WHERE ReservationID = ?
          `;
          const values = [userID, flightID, newSeatID, status, bookingDate, reservationID];
          db.query(updateQuery, values, (err) => {
            if (err) return res.status(500).send("Error updating reservation");
  
            // Mark new seat as unavailable
            const updateNewSeat = "UPDATE Seat SET Availability = 'No' WHERE SeatID = ?";
            db.query(updateNewSeat, [newSeatID], (err) => {
              if (err) console.warn("Failed to mark new seat as unavailable");
  
              // Mark old seat as available
              const updateOldSeat = "UPDATE Seat SET Availability = 'Yes' WHERE SeatID = ?";
              db.query(updateOldSeat, [oldSeatID], (err) => {
                if (err) console.warn("Failed to free old seat");
                res.json({ message: "Reservation updated successfully" });
              });
            });
          });
        });
      });
    });
  });
  
export default router;