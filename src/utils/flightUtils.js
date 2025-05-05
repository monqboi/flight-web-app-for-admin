import { useAircraftStore } from "@/stores/aircraftStore";

export const getAircraftModelPart = (aircraftID, index) => {
  const aircraftStore = useAircraftStore();
  const model = aircraftStore.getAircraftByID(aircraftID)?.model || "";
  const parts = model.split(" ");
  return parts[index] ?? "";
};

export const getAircraftStatusClass = (aircraftID) => {
  const aircraftStore = useAircraftStore();
  const status = aircraftStore.getAircraftByID(aircraftID)?.aircraftStatus;
  return status === "not-available"
    ? "status-AC-not-available"
    : "status-AC-available";
};

export const formatDate = (date) => {
  const options = { year: "numeric", month: "short", day: "numeric" };
  const validDate = new Date(date);
  return validDate.toLocaleDateString("en-US", options);
};

export const mapFlightStatus = (status) => {
  switch (status) {
    case "Pending":
      return "Pending";
    case "Completed":
      return "Completed";
    case "delayed":
      return "Delayed";
    case "Canceled":
      return "Canceled";
    default:
      return "Unknown Status";
  }
};
