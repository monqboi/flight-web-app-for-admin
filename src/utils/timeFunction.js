// For Flight
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

// For Dashboard
export function getFlightDurationHrs(flight) {
  try {
    if (!flight?.departure?.date || !flight?.departure?.time || !flight?.destination?.date || !flight?.destination?.time) {
      throw new Error("Missing date/time fields");
    }

    const dep = new Date(`${flight.departure.date}T${flight.departure.time}`);
    const arr = new Date(`${flight.destination.date}T${flight.destination.time}`);

    if (isNaN(dep.getTime()) || isNaN(arr.getTime())) {
      throw new Error("Invalid date format");
    }

    const diffMs = arr - dep;
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours.toFixed(1);
  } catch (err) {
    console.warn("getFlightDurationHours error:", err.message);
    return "?";
  }
}

export function minutesToHours(minutes) {
    if (!minutes || isNaN(minutes)) return "0 hrs";
    const hours = (minutes / 60).toFixed(1);
    return `${hours} hrs`;
}

export function formatDateTime(isoString) {
  if (!isoString) return "-";
  try {
    const date = new Date(isoString);
    return date.toLocaleString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (err) {
    return "-";
  }
}