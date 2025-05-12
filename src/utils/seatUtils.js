const getSeatById = (seats, seatId) => {
  return seats.find((seat) => seat.seatID === seatId);
};

export const getSeatStatus = (seats, seatId) => {
  const seat = getSeatById(seats, seatId);
  if (!seat) return "seat-unknown";

  return seat.availability === "available"
    ? "seat-available"
    : "seat-unavailable";
};

export const isSeatAvailable = (seats, seatId) => {
  const seat = getSeatById(seats, seatId);
  return seat && seat.availability === "available";
};

export const getSeatInfo = (seats, seatId) => {
  const seat = getSeatById(seats, seatId);
  if (!seat) return "Unknown Seat";

  return `${seat.seatID} - (${seat.availability}) - ${seat.seatClass}`;
};

export const getUniqueRows = (seats) => {
  return [...new Set(seats.map((seat) => seat.seatRow))].sort((a, b) => a - b);
};

export const formatSeatId = (rowNum, col) => {
  return col + rowNum.toString().padStart(2, "0");
};

