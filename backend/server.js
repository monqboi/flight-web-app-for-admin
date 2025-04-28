import express from 'express';
import cors from 'cors';
import db from "../db.js";

import flightRouter from "./routes/flight.js";
import airlineRouter from "./routes/airline.js";
import paymentRouter from "./routes/payment.js";

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.send('Flight Management API');
});

// Use routers
app.use("/flight", flightRouter);  
app.use("/airline", airlineRouter);  
app.use("/payment", paymentRouter);  


// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

