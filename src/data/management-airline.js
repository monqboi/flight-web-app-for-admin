const OPEN = "open";
const TEMPORARILY_CLOSED = "temporarily-closed";

export const airlineData = [
  {
    airlineID: "SG1234",
    name: "Piyanit Airlines",
    name_short: "SIA",
    code: "SQ",
    contactPrefix: "+65",
    contactNumber: "6223 8888",
    country: "Singapore",
    headquarters: "Changi Airport, Singapore",
    airlineStatus: OPEN,
    airlineColor: "#FFB042",
    airlineImage:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyukcRufO5WMk1BDKXcRVwKUWPprVD3wiKBA&s",
  },
  {
    airlineID: "TH5678",
    name: "Jaturon Airways",
    name_short: "THAI",
    code: "TG",
    contactPrefix: "+66",
    contactNumber: "2356 1111",
    country: "Thailand",
    headquarters: "Suvarnabhumi Airport, Thailand",
    airlineStatus: OPEN,
    airlineColor: "#FB8B01",
    airlineImage:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZCWFMUEpgIymhbG8Tm1O8zCfDmiUb_x38XQ&s",
  },
  {
    airlineID: "JL9012",
    name: "Japan Airlines",
    name_short: "JAL",
    code: "JL",
    contactPrefix: "+81",
    contactNumber: "3460 3311",
    country: "Japan",
    headquarters: "Tokyo, Japan",
    airlineStatus: TEMPORARILY_CLOSED,
    airlineColor: "#97BBD2",
    airlineImage:
      "https://seeklogo.com/images/J/japan-airlines-logo-E3857AE760-seeklogo.com.png",
  },
  {
    airlineID: "KE3456",
    name: "Korean Air",
    name_short: "KAL",
    code: "KE",
    contactPrefix: "+82",
    contactNumber: "2656 2000",
    country: "South Korea",
    headquarters: "Seoul, South Korea",
    airlineStatus: OPEN,
    airlineColor: "#397499",
    airlineImage:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxkdT4bGelSzZCzKQ4ika7oDt3wS4FYls3Kg&s",
  },
];
