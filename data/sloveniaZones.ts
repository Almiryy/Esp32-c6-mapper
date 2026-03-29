import { DroneZone } from "../types/zones";

/**
 * Fallback drone zone data for Slovenia.
 * Based on publicly known restricted areas from CAA Slovenia.
 * This is used when ArcGIS FeatureServer data cannot be fetched.
 *
 * Zone data includes major airports, Triglav National Park, and nuclear facility.
 * For the most accurate data, the app fetches live data from CAA's ArcGIS service.
 */
export const FALLBACK_ZONES: DroneZone[] = [
  // Ljubljana Joze Pucnik Airport (LJLJ) - CTR
  {
    id: "ljlj-ctr",
    name: "Ljubljana Airport CTR",
    type: "CTR",
    description: "Control zone around Ljubljana Joze Pucnik Airport. ATC authorization required.",
    maxAltitude: 0,
    center: { latitude: 46.2237, longitude: 14.4576 },
    coordinates: [
      { latitude: 46.3037, longitude: 14.3276 },
      { latitude: 46.3037, longitude: 14.5876 },
      { latitude: 46.1437, longitude: 14.5876 },
      { latitude: 46.1437, longitude: 14.3276 },
    ],
  },
  // Ljubljana Airport - inner no-fly zone (5km radius approx)
  {
    id: "ljlj-nfz",
    name: "Ljubljana Airport No-Fly Zone",
    type: "NO_FLY",
    description: "No drone flights within immediate airport vicinity.",
    maxAltitude: 0,
    center: { latitude: 46.2237, longitude: 14.4576 },
    radius: 2500,
    coordinates: generateCircle(46.2237, 14.4576, 2500),
  },
  // Maribor Airport (LJMB) - CTR
  {
    id: "ljmb-ctr",
    name: "Maribor Airport CTR",
    type: "CTR",
    description: "Control zone around Maribor Edvard Rusjan Airport.",
    maxAltitude: 0,
    center: { latitude: 46.4799, longitude: 15.6861 },
    coordinates: [
      { latitude: 46.5499, longitude: 15.5861 },
      { latitude: 46.5499, longitude: 15.7861 },
      { latitude: 46.4099, longitude: 15.7861 },
      { latitude: 46.4099, longitude: 15.5861 },
    ],
  },
  // Maribor Airport - inner no-fly zone
  {
    id: "ljmb-nfz",
    name: "Maribor Airport No-Fly Zone",
    type: "NO_FLY",
    description: "No drone flights within immediate airport vicinity.",
    maxAltitude: 0,
    center: { latitude: 46.4799, longitude: 15.6861 },
    radius: 2500,
    coordinates: generateCircle(46.4799, 15.6861, 2500),
  },
  // Portoroz Airport (LJPZ)
  {
    id: "ljpz-ctr",
    name: "Portoroz Airport CTR",
    type: "CTR",
    description: "Control zone around Portoroz Airport.",
    maxAltitude: 0,
    center: { latitude: 45.4734, longitude: 13.6150 },
    coordinates: [
      { latitude: 45.5234, longitude: 13.5450 },
      { latitude: 45.5234, longitude: 13.6850 },
      { latitude: 45.4234, longitude: 13.6850 },
      { latitude: 45.4234, longitude: 13.5450 },
    ],
  },
  // Triglav National Park
  {
    id: "tnp",
    name: "Triglav National Park",
    type: "NATIONAL_PARK",
    description: "Triglav National Park. Authorization from park authority required for drone flights.",
    center: { latitude: 46.3782, longitude: 13.8369 },
    coordinates: [
      { latitude: 46.4600, longitude: 13.6500 },
      { latitude: 46.4800, longitude: 13.7500 },
      { latitude: 46.4700, longitude: 13.8500 },
      { latitude: 46.4400, longitude: 13.9500 },
      { latitude: 46.4000, longitude: 14.0200 },
      { latitude: 46.3500, longitude: 14.0500 },
      { latitude: 46.3000, longitude: 14.0200 },
      { latitude: 46.2800, longitude: 13.9500 },
      { latitude: 46.2900, longitude: 13.8500 },
      { latitude: 46.3000, longitude: 13.7500 },
      { latitude: 46.3200, longitude: 13.6800 },
      { latitude: 46.3800, longitude: 13.6200 },
      { latitude: 46.4200, longitude: 13.6300 },
    ],
  },
  // Krsko Nuclear Power Plant
  {
    id: "nek",
    name: "Krsko Nuclear Power Plant",
    type: "NO_FLY",
    description: "No-fly zone around Krsko Nuclear Power Plant.",
    maxAltitude: 0,
    center: { latitude: 45.9392, longitude: 15.5164 },
    radius: 3000,
    coordinates: generateCircle(45.9392, 15.5164, 3000),
  },
  // Ljubljana city center - populated area restriction
  {
    id: "lj-city",
    name: "Ljubljana City Center",
    type: "RESTRICTED",
    description: "Populated area. Open category flights over people not permitted.",
    maxAltitude: 50,
    center: { latitude: 46.0569, longitude: 14.5058 },
    radius: 3000,
    coordinates: generateCircle(46.0569, 14.5058, 3000),
  },
  // Maribor city center
  {
    id: "mb-city",
    name: "Maribor City Center",
    type: "RESTRICTED",
    description: "Populated area. Open category flights over people not permitted.",
    maxAltitude: 50,
    center: { latitude: 46.5547, longitude: 15.6459 },
    radius: 2000,
    coordinates: generateCircle(46.5547, 15.6459, 2000),
  },
  // Ljubljana Airport altitude restriction zone (5-10km)
  {
    id: "ljlj-alt",
    name: "Ljubljana Airport Altitude Restriction",
    type: "ALTITUDE_LIMIT",
    description: "Reduced maximum altitude of 50m AGL in airport vicinity.",
    maxAltitude: 50,
    center: { latitude: 46.2237, longitude: 14.4576 },
    radius: 5000,
    coordinates: generateCircle(46.2237, 14.4576, 5000),
  },
];

/**
 * Generate approximate circle coordinates for a given center and radius.
 */
function generateCircle(
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
  numPoints: number = 36
): { latitude: number; longitude: number }[] {
  const coords: { latitude: number; longitude: number }[] = [];
  const earthRadius = 6371000; // meters

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const dLat = (radiusMeters * Math.cos(angle)) / earthRadius;
    const dLng =
      (radiusMeters * Math.sin(angle)) /
      (earthRadius * Math.cos((centerLat * Math.PI) / 180));

    coords.push({
      latitude: centerLat + (dLat * 180) / Math.PI,
      longitude: centerLng + (dLng * 180) / Math.PI,
    });
  }

  return coords;
}
