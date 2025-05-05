export function getFlightDurationHours(flight) {
    try {
      const dep = new Date(`${flight.departure.date}T${flight.departure.time}`);
      const arr = new Date(`${flight.destination.date}T${flight.destination.time}`);
      const diffMs = arr - dep;
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours.toFixed(1); // Ex. "2.5"
    } catch (err) {
      return "?";
    }
  }