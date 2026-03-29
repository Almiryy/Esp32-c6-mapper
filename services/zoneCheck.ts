import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point, polygon } from "@turf/helpers";
import { DroneZone, FlyStatus, ZoneCheckResult } from "../types/zones";
import { DEFAULT_MAX_ALTITUDE } from "../constants/zones";

/**
 * Check if a given GPS position falls within any drone restriction zones.
 */
export function checkZoneStatus(
  latitude: number,
  longitude: number,
  zones: DroneZone[]
): ZoneCheckResult {
  const userPoint = point([longitude, latitude]);
  const matchedZones: DroneZone[] = [];

  for (const zone of zones) {
    if (zone.coordinates.length < 3) continue;

    try {
      const ring = zone.coordinates.map((c) => [c.longitude, c.latitude]);
      // Close the ring if not already closed
      if (
        ring[0][0] !== ring[ring.length - 1][0] ||
        ring[0][1] !== ring[ring.length - 1][1]
      ) {
        ring.push([...ring[0]]);
      }

      const poly = polygon([ring]);

      if (booleanPointInPolygon(userPoint, poly)) {
        matchedZones.push(zone);
      }
    } catch {
      // Skip invalid polygons
    }
  }

  if (matchedZones.length === 0) {
    return {
      status: "CLEAR",
      zones: [],
      maxAltitude: DEFAULT_MAX_ALTITUDE,
      message: "Clear to fly! Max altitude: 120m AGL",
    };
  }

  // Determine overall status (most restrictive wins)
  let overallStatus: FlyStatus = "CLEAR";
  let minAltitude = DEFAULT_MAX_ALTITUDE;

  for (const zone of matchedZones) {
    if (
      zone.type === "NO_FLY" ||
      zone.type === "CTR" ||
      zone.type === "MILITARY" ||
      zone.type === "DANGER"
    ) {
      overallStatus = "NO_FLY";
      minAltitude = 0;
    } else if (
      overallStatus !== "NO_FLY" &&
      (zone.type === "RESTRICTED" ||
        zone.type === "NATIONAL_PARK" ||
        zone.type === "ALTITUDE_LIMIT")
    ) {
      overallStatus = "RESTRICTED";
      if (zone.maxAltitude !== undefined && zone.maxAltitude < minAltitude) {
        minAltitude = zone.maxAltitude;
      }
    }
  }

  const zoneNames = matchedZones.map((z) => z.name).join(", ");

  let message: string;
  switch (overallStatus) {
    case "NO_FLY":
      message = `No-fly zone: ${zoneNames}`;
      break;
    case "RESTRICTED":
      message =
        minAltitude > 0
          ? `Restricted area: ${zoneNames}. Max altitude: ${minAltitude}m`
          : `Restricted area: ${zoneNames}. Authorization required.`;
      break;
    default:
      message = `Clear to fly. Max altitude: ${minAltitude}m AGL`;
  }

  return {
    status: overallStatus,
    zones: matchedZones,
    maxAltitude: minAltitude,
    message,
  };
}
