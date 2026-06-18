// Pakistan cities used for complaint city selection and the crime heat map.
// `x`/`y` are positions on the stylized SVG map (viewBox 0 0 100 120),
// roughly matching each city's real geographic placement (north → south).
export const PAKISTAN_CITIES = [
  { name: "Islamabad", province: "Islamabad Capital Territory", x: 52, y: 32 },
  { name: "Rawalpindi", province: "Punjab", x: 52, y: 36 },
  { name: "Lahore", province: "Punjab", x: 63, y: 46 },
  { name: "Faisalabad", province: "Punjab", x: 55, y: 51 },
  { name: "Gujranwala", province: "Punjab", x: 61, y: 43 },
  { name: "Sialkot", province: "Punjab", x: 65, y: 41 },
  { name: "Multan", province: "Punjab", x: 48, y: 62 },
  { name: "Bahawalpur", province: "Punjab", x: 50, y: 68 },
  { name: "Peshawar", province: "Khyber Pakhtunkhwa", x: 33, y: 33 },
  { name: "Mardan", province: "Khyber Pakhtunkhwa", x: 37, y: 30 },
  { name: "Quetta", province: "Balochistan", x: 27, y: 66 },
  { name: "Gwadar", province: "Balochistan", x: 16, y: 96 },
  { name: "Karachi", province: "Sindh", x: 34, y: 101 },
  { name: "Hyderabad", province: "Sindh", x: 42, y: 96 },
  { name: "Sukkur", province: "Sindh", x: 43, y: 79 },
  { name: "Gilgit", province: "Gilgit-Baltistan", x: 58, y: 18 },
  { name: "Muzaffarabad", province: "Azad Jammu & Kashmir", x: 57, y: 27 },
  { name: "Other", province: "Other / Not listed", x: 50, y: 112 },
];

// City names only — convenient for <select> options.
export const CITY_NAMES = PAKISTAN_CITIES.map((c) => c.name);

// Simplified, recognizable Pakistan silhouette for the heat-map backdrop
// (decorative; not a precise boundary). viewBox 0 0 100 120.
export const PAKISTAN_OUTLINE =
  "M55 8 L66 14 L62 22 L70 26 L66 33 L74 38 L70 45 L72 52 L64 55 L58 64 L57 72 L50 74 L46 84 L48 92 L40 99 L36 108 L28 104 L31 95 L24 90 L28 80 L22 72 L26 64 L20 58 L24 48 L34 44 L30 36 L36 30 L33 22 L43 20 L46 12 Z";

export const PROVINCES = [
  "Islamabad Capital Territory",
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Gilgit-Baltistan",
  "Azad Jammu & Kashmir",
];
