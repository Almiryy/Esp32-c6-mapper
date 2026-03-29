import { ZoneType } from "../types/zones";

// Slovenia center coordinates
export const SLOVENIA_CENTER = {
  latitude: 46.1512,
  longitude: 14.9955,
  latitudeDelta: 2.5,
  longitudeDelta: 2.5,
};

// Default max altitude for open category in Slovenia (EU regulation)
export const DEFAULT_MAX_ALTITUDE = 120; // meters AGL

// Reduced altitude near airports
export const REDUCED_ALTITUDE = 50; // meters AGL

// Zone colors for map overlays
export const ZONE_COLORS: Record<ZoneType, { fill: string; stroke: string }> = {
  NO_FLY: { fill: "rgba(220, 38, 38, 0.3)", stroke: "#DC2626" },
  CTR: { fill: "rgba(220, 38, 38, 0.25)", stroke: "#B91C1C" },
  MILITARY: { fill: "rgba(220, 38, 38, 0.3)", stroke: "#991B1B" },
  DANGER: { fill: "rgba(220, 38, 38, 0.35)", stroke: "#7F1D1D" },
  RESTRICTED: { fill: "rgba(245, 158, 11, 0.3)", stroke: "#F59E0B" },
  NATIONAL_PARK: { fill: "rgba(251, 146, 60, 0.3)", stroke: "#FB923C" },
  ALTITUDE_LIMIT: { fill: "rgba(234, 179, 8, 0.2)", stroke: "#EAB308" },
};

export const ZONE_LABELS: Record<ZoneType, string> = {
  NO_FLY: "No-Fly Zone",
  CTR: "Control Zone (CTR)",
  MILITARY: "Military Zone",
  DANGER: "Danger Area",
  RESTRICTED: "Restricted Zone",
  NATIONAL_PARK: "National Park",
  ALTITUDE_LIMIT: "Altitude Limited",
};

export const ZONE_DESCRIPTIONS: Record<ZoneType, string> = {
  NO_FLY: "Drone flights are strictly prohibited in this area.",
  CTR: "Control zone around airports. Flights require ATC authorization.",
  MILITARY: "Military restricted area. No civilian drone flights permitted.",
  DANGER: "Danger area with active hazards. Drone flights prohibited.",
  RESTRICTED: "Restricted area. Special authorization may be required.",
  NATIONAL_PARK: "National park area. Authorization from park authority required.",
  ALTITUDE_LIMIT: "Maximum flight altitude is reduced to 50m AGL in this area.",
};

// CAA Slovenia ArcGIS endpoints
// These are the known ArcGIS web app IDs for CAA drone zone maps
export const ARCGIS_CONFIG = {
  baseUrl: "https://caa-slovenia.maps.arcgis.com",
  webAppIds: [
    "25ba69037c264c5faa5381174f76f861", // UAS GEO ZONES main map
    "e9f70da7f0d4455b8825a282ec0737c7", // Alternative map
    "2d42618566cc4f49a263a676a964ec90", // CAA Slovenia general
  ],
  // Common ArcGIS service patterns to try for discovering FeatureServer endpoints
  servicePatterns: [
    "/sharing/rest/content/items/{id}/data?f=json",
    "/sharing/rest/search?q=type:\"Feature Service\"&f=json&num=50",
  ],
};
