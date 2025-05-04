import express from 'express';
import cors from 'cors';
import db from "./db.js";
import airlineRouter from "./routes/airline.js";
import flightRouter from "./routes/flight.js";
import reservationRouter from "./routes/reservation.js";
import aircraftRouter from "./routes/aircraft.js";
import paymentRouter from "./routes/payment.js";
import passengerRoutes from "./routes/passenger.js";

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.send('Flight Management API');
});

// Use routers
app.use("/api/airline", airlineRouter);
app.use("/api/flight", flightRouter);
app.use("/api/aircraft", aircraftRouter);
app.use("/api/reservation", reservationRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/passenger", passengerRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});