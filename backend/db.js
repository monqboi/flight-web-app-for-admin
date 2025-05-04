import mysql from 'mysql2';

export default function getDBConnection() {
  return mysql.createConnection({
    host: '8.tcp.ngrok.io',
    port: 18371,
    user: 'noboyhereadmin1',
    password: 'noboyhere888@admin1',
    database: 'FlightReservationDBNew1',
  });
}
