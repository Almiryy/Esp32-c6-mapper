import { WeatherData } from "../types/weather";

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";

// Drone flying thresholds
const MAX_SAFE_WIND_SPEED = 10; // m/s
const MAX_SAFE_WIND_GUSTS = 15; // m/s
const MIN_SAFE_VISIBILITY = 3000; // meters
const MAX_SAFE_PRECIPITATION = 0.5; // mm/h

/**
 * Fetch current weather data for a given GPS location using Open-Meteo API (free, no key required).
 */
export async function fetchWeather(
  latitude: number,
  longitude: number
): Promise<WeatherData | null> {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current: [
        "temperature_2m",
        "wind_speed_10m",
        "wind_gusts_10m",
        "wind_direction_10m",
        "precipitation",
        "cloud_cover",
        "visibility",
        "relative_humidity_2m",
      ].join(","),
      wind_speed_unit: "ms",
      timezone: "auto",
    });

    const response = await fetch(`${OPEN_METEO_BASE}?${params}`, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const current = data.current;

    if (!current) return null;

    const windSpeed = current.wind_speed_10m ?? 0;
    const windGusts = current.wind_gusts_10m ?? 0;
    const visibility = current.visibility ?? 10000;
    const precipitation = current.precipitation ?? 0;

    const warnings: string[] = [];

    if (windSpeed > MAX_SAFE_WIND_SPEED) {
      warnings.push(`High wind speed: ${windSpeed.toFixed(1)} m/s`);
    }
    if (windGusts > MAX_SAFE_WIND_GUSTS) {
      warnings.push(`Strong gusts: ${windGusts.toFixed(1)} m/s`);
    }
    if (visibility < MIN_SAFE_VISIBILITY) {
      warnings.push(`Low visibility: ${(visibility / 1000).toFixed(1)} km`);
    }
    if (precipitation > MAX_SAFE_PRECIPITATION) {
      warnings.push(`Precipitation: ${precipitation.toFixed(1)} mm/h`);
    }

    const isGoodForFlying =
      windSpeed <= MAX_SAFE_WIND_SPEED &&
      windGusts <= MAX_SAFE_WIND_GUSTS &&
      visibility >= MIN_SAFE_VISIBILITY &&
      precipitation <= MAX_SAFE_PRECIPITATION;

    return {
      temperature: current.temperature_2m ?? 0,
      windSpeed,
      windGusts,
      windDirection: current.wind_direction_10m ?? 0,
      visibility,
      precipitation,
      cloudCover: current.cloud_cover ?? 0,
      humidity: current.relative_humidity_2m ?? 0,
      isGoodForFlying,
      warnings,
    };
  } catch {
    return null;
  }
}

/**
 * Get a human-readable wind direction from degrees.
 */
export function getWindDirectionLabel(degrees: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}
