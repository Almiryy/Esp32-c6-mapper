import { DroneZone, GeoJSONFeature, GeoJSONFeatureCollection, ZoneType } from "../types/zones";
import { ARCGIS_CONFIG } from "../constants/zones";
import { FALLBACK_ZONES } from "../data/sloveniaZones";

const CACHE_KEY = "arcgis_zones_cache";
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedData {
  zones: DroneZone[];
  timestamp: number;
}

let memoryCache: CachedData | null = null;

/**
 * Attempt to discover ArcGIS FeatureServer endpoints from the web app configuration.
 */
async function discoverFeatureServices(): Promise<string[]> {
  const endpoints: string[] = [];

  for (const appId of ARCGIS_CONFIG.webAppIds) {
    try {
      const configUrl = `${ARCGIS_CONFIG.baseUrl}/sharing/rest/content/items/${appId}/data?f=json`;
      const response = await fetch(configUrl, { signal: AbortSignal.timeout(10000) });

      if (!response.ok) continue;

      const data = await response.json();
      // ArcGIS web app configs typically store layer URLs in operationalLayers
      const layers = data?.map?.operationalLayers || data?.operationalLayers || [];

      for (const layer of layers) {
        if (layer.url && layer.url.includes("FeatureServer")) {
          endpoints.push(layer.url);
        }
        // Also check itemId based URLs
        if (layer.itemId) {
          endpoints.push(
            `${ARCGIS_CONFIG.baseUrl}/sharing/rest/content/items/${layer.itemId}/data?f=json`
          );
        }
      }
    } catch {
      // Continue trying other app IDs
    }
  }

  return [...new Set(endpoints)]; // deduplicate
}

/**
 * Query an ArcGIS FeatureServer endpoint for zone polygon data as GeoJSON.
 */
async function queryFeatureServer(endpoint: string): Promise<GeoJSONFeatureCollection | null> {
  try {
    // Ensure we're querying the right endpoint
    const queryUrl = endpoint.includes("/query")
      ? endpoint
      : `${endpoint}/query?where=1=1&outFields=*&f=geojson&outSR=4326`;

    const response = await fetch(queryUrl, { signal: AbortSignal.timeout(15000) });

    if (!response.ok) return null;

    const data = await response.json();

    if (data.type === "FeatureCollection" && data.features) {
      return data as GeoJSONFeatureCollection;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Convert a GeoJSON feature to our DroneZone format.
 */
function featureToZone(feature: GeoJSONFeature, index: number): DroneZone | null {
  const props = feature.properties;
  const geom = feature.geometry;

  if (!geom || !geom.coordinates) return null;

  // Determine zone type from properties
  const type = inferZoneType(props);
  const name = String(
    props.name || props.NAME || props.naziv || props.NAZIV || props.label || `Zone ${index + 1}`
  );
  const description = String(
    props.description || props.DESCRIPTION || props.opis || props.OPIS || ""
  );

  // Extract coordinates based on geometry type
  let coordinates: { latitude: number; longitude: number }[] = [];

  if (geom.type === "Polygon") {
    const ring = geom.coordinates[0] as number[][];
    coordinates = ring.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
  } else if (geom.type === "MultiPolygon") {
    // Use the first polygon of the multi-polygon
    const ring = (geom.coordinates as number[][][][])[0][0];
    coordinates = ring.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
  }

  if (coordinates.length === 0) return null;

  // Calculate center
  const center = {
    latitude: coordinates.reduce((sum, c) => sum + c.latitude, 0) / coordinates.length,
    longitude: coordinates.reduce((sum, c) => sum + c.longitude, 0) / coordinates.length,
  };

  return {
    id: `arcgis-${index}`,
    name,
    type,
    description,
    maxAltitude: type === "ALTITUDE_LIMIT" ? 50 : type === "NO_FLY" || type === "CTR" ? 0 : undefined,
    coordinates,
    center,
  };
}

/**
 * Infer the zone type from ArcGIS feature properties.
 */
function inferZoneType(props: Record<string, unknown>): ZoneType {
  const allValues = Object.values(props).map((v) => String(v).toLowerCase());
  const combined = allValues.join(" ");

  if (combined.includes("ctr") || combined.includes("control zone")) return "CTR";
  if (combined.includes("military") || combined.includes("vojaski")) return "MILITARY";
  if (combined.includes("danger") || combined.includes("nevarno")) return "DANGER";
  if (combined.includes("national park") || combined.includes("narodni park")) return "NATIONAL_PARK";
  if (combined.includes("no fly") || combined.includes("prohibited") || combined.includes("prepovedano")) return "NO_FLY";
  if (combined.includes("altitude") || combined.includes("visina") || combined.includes("50m")) return "ALTITUDE_LIMIT";

  return "RESTRICTED";
}

/**
 * Fetch drone zones from CAA Slovenia ArcGIS service.
 * Falls back to bundled static data if the service is unavailable.
 */
export async function fetchDroneZones(): Promise<DroneZone[]> {
  // Check memory cache first
  if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_DURATION_MS) {
    return memoryCache.zones;
  }

  try {
    // Try to discover and query FeatureServer endpoints
    const endpoints = await discoverFeatureServices();

    const allZones: DroneZone[] = [];

    for (const endpoint of endpoints) {
      const geojson = await queryFeatureServer(endpoint);
      if (geojson) {
        for (let i = 0; i < geojson.features.length; i++) {
          const zone = featureToZone(geojson.features[i], allZones.length + i);
          if (zone) allZones.push(zone);
        }
      }
    }

    if (allZones.length > 0) {
      memoryCache = { zones: allZones, timestamp: Date.now() };
      return allZones;
    }
  } catch {
    // Fall through to fallback data
  }

  // Use fallback data
  memoryCache = { zones: FALLBACK_ZONES, timestamp: Date.now() };
  return FALLBACK_ZONES;
}

/**
 * Force refresh zone data (bypass cache).
 */
export async function refreshDroneZones(): Promise<DroneZone[]> {
  memoryCache = null;
  return fetchDroneZones();
}
