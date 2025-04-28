import mysql from 'mysql';

// Create connection to database
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password', 
  database: 'flight_management', 
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Database connection failed: ', err.stack);
    return;
  }
  console.log('Connected to MySQL database');
});

export default db;
