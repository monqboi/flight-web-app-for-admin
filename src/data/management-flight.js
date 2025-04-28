const PENDING = "pending";
const COMPLETED = "completed";
const DELAYED = "delayed";
const CANCELED = "canceled";

export const flightData = [
  {
    flightID: 1,
    airlineID: "SG1234",
    isSeatAvailable: true,
    status: "pending",
    departure: {
      airport: "BKK",
      time: "18:00",
      date: "2024-03-09",
    },
    destination: {
      time: "07:00",
      airport: "SG",
      date: "2024-03-09",
    },
    duration: {
      time: "11",
      stop: "1",
    },
    aircraftID: "BOE001",
    flightStatus: PENDING,
  },
  {
    flightID: 2,
    airlineID: "SG1234",
    isSeatAvailable: false,
    departure: {
      airport: "BKK",
      time: "18:00",
      date: "2024-03-09",
    },
    destination: {
      time: "09:00",
      airport: "SG",
      date: "2024-03-09",
    },
    duration: {
      time: "11",
      stop: "1",
    },
    aircraftID: "ABA001",
    flightStatus: COMPLETED,
  },
  {
    flightID: 3,
    isSeatAvailable: true,
    airlineID: "SG1234",
    departure: {
      airport: "BKK",
      time: "18:00",
      date: "2024-03-09",
    },
    destination: {
      time: "13:00",
      airport: "SG",
      date: "2024-03-09",
    },
    duration: {
      time: "11",
      stop: "1",
    },
    aircraftID: "BOE001",
    flightStatus: PENDING,
  },
  {
    flightID: 4,
    isSeatAvailable: false,
    airlineID: "SG1234",
    departure: {
      airport: "BKK",
      time: "18:00",
      date: "2024-03-09",
    },
    destination: {
      time: "14:00",
      airport: "SG",
      date: "2024-03-09",
    },
    duration: {
      time: "11",
      stop: "1",
    },
    aircraftID: "ABA001",
    flightStatus: DELAYED,
  },
  {
    flightID: 5,
    isSeatAvailable: false,
    airlineID: "TH5678",
    departure: {
      airport: "BKK",
      time: "18:00",
      date: "2024-03-09",
    },
    destination: {
      time: "07:00",
      airport: "CNX",
      date: "2024-03-09",
    },
    duration: {
      time: "11",
      stop: "1",
    },
    aircraftID: "BOE003",
    flightStatus: CANCELED,
  },
  {
    flightID: 6,
    isSeatAvailable: false,
    airlineID: "TH5678",
    departure: {
      airport: "BKK",
      time: "18:00",
      date: "2024-03-09",
    },
    destination: {
      time: "07:00",
      airport: "CNX",
      date: "2024-03-09",
    },
    duration: {
      time: "11",
      stop: "1",
    },
    aircraftID: "ABA002",
    flightStatus: CANCELED,
  },
  {
    flightID: 7,
    isSeatAvailable: true,
    airlineID: "TH5678",
    departure: {
      airport: "BKK",
      time: "18:00",
      date: "2024-03-09",
    },
    destination: {
      time: "07:00",
      airport: "CNX",
      date: "2024-03-09",
    },
    duration: {
      time: "11",
      stop: "1",
    },
    aircraftID: "ABA002",
    flightStatus: PENDING,
  },
  {
    flightID: 8,
    isSeatAvailable: false,
    airlineID: "TH5678",
    departure: {
      airport: "BKK",
      time: "18:00",
      date: "2024-03-09",
    },
    destination: {
      time: "07:00",
      airport: "CNX",
      date: "2024-03-09",
    },
    duration: {
      time: "11",
      stop: "1",
    },
    aircraftID: "BOE003",
    flightStatus: COMPLETED,
  },
  {
    flightID: 9,
    isSeatAvailable: true,
    airlineID: "JL9012",
    departure: {
      airport: "DMK",
      time: "10:00",
      date: "2024-03-09",
    },
    destination: {
      time: "15:00",
      airport: "JPN",
      date: "2024-03-09",
    },
    duration: {
      time: "2",
      stop: "5",
    },
    aircraftID: "BOE004",
    flightStatus: PENDING,
  },
  {
    flightID: 10,
    isSeatAvailable: false,
    airlineID: "JL9012",
    departure: {
      airport: "DMK",
      time: "14:00",
      date: "2024-03-09",
    },
    destination: {
      time: "16:00",
      airport: "JPN",
      date: "2024-03-09",
    },
    duration: {
      time: "2",
      stop: "8",
    },
    aircraftID: "BOE004",
    flightStatus: COMPLETED,
  },
  {
    flightID: 11,
    isSeatAvailable: true,
    airlineID: "KE3456",
    departure: {
      airport: "CNX",
      time: "08:00",
      date: "2024-03-09",
    },
    destination: {
      time: "10:00",
      airport: "KR",
      date: "2024-03-09",
    },
    duration: {
      time: "2",
      stop: "7",
    },
    aircraftID: "BOE002",
    flightStatus: PENDING,
  },
  {
    flightID: 12,
    isSeatAvailable: false,
    airlineID: "KE3456",
    departure: {
      airport: "CNX",
      time: "12:00",
      date: "2024-03-09",
    },
    destination: {
      time: "14:00",
      airport: "KR",
      date: "2024-03-09",
    },
    duration: {
      time: "2",
      stop: "5",
    },
    aircraftID: "BOE002",
    flightStatus: COMPLETED,
  },
];
