const rows = 6;
const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

let output = '';

for (let row = 1; row <= rows; row++) {
  const rowSeats = columns.map(col => `${col}${row.toString().padStart(2, '0')}`);
  output += rowSeats.join(' ') + '\n';
}

console.log(output);
