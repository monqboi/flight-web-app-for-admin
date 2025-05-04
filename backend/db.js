import mysql from 'mysql2';

const pool = mysql.createPool({
  host: '8.tcp.ngrok.io',
  port: 18371,
  user: 'noboyhereadmin1',
  password: 'noboyhere888@admin1',
  database: 'FlightReservationDBNew1',
  waitForConnections: true,
  connectionLimit: 10, 
  queueLimit: 0,
});

export default pool.promise();