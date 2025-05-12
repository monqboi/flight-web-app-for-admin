import express from 'express';
import cors from 'cors';
import db from "./db.js";
import authRouter from "./routes/auth.js";
import adminRouter from './routes/admin.js';
import userRouter from "./routes/users.js";
import seatRouter from "./routes/seats.js";
import airlineRouter from "./routes/airline.js";
import flightRouter from "./routes/flight.js";
import reservationRouter from "./routes/reservation.js";
import aircraftRouter from "./routes/aircraft.js";
import paymentRouter from "./routes/payment.js";
import passengerRoutes from "./routes/passenger.js";
import dashboardRouter from './routes/dashboard.js';
import reportRouter from './routes/report.js';

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Basic route
app.get('/', (req, res) => {
  res.send('Flight Management API');
});

// Use routers
app.use("/api/auth", authRouter);
app.use('/api/admins', adminRouter);
app.use("/api/users", userRouter);
app.use("/api/seats", seatRouter);
app.use("/api/airline", airlineRouter);
app.use("/api/flight", flightRouter);
app.use("/api/aircraft", aircraftRouter);
app.use("/api/reservation", reservationRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/passenger", passengerRoutes);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/report', reportRouter);

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});