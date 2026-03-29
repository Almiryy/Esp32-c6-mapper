export type ZoneType =
  | "NO_FLY"
  | "RESTRICTED"
  | "NATIONAL_PARK"
  | "ALTITUDE_LIMIT"
  | "CTR"
  | "DANGER"
  | "MILITARY";

export type FlyStatus = "CLEAR" | "RESTRICTED" | "NO_FLY";

export interface DroneZone {
  id: string;
  name: string;
  type: ZoneType;
  description: string;
  maxAltitude?: number; // meters AGL
  coordinates: { latitude: number; longitude: number }[];
  center: { latitude: number; longitude: number };
  radius?: number; // meters, for circular zones
}

export interface ZoneCheckResult {
  status: FlyStatus;
  zones: DroneZone[];
  maxAltitude: number;
  message: string;
}

export interface GeoJSONFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}
