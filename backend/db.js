import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: '6.tcp.ngrok.io',
  port: 18573,
  user: 'noboyhereadmin1',
  password: 'noboyhere888@admin1',
  database: 'FlightReservationDBNew1', // For developing: 'FlightReservationDBNew1'
  waitForConnections: true,
  connectionLimit: 10, 
  queueLimit: 0,
});

export default pool;