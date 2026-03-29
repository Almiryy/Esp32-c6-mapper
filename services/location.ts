import * as Location from "expo-location";

export interface UserLocation {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
}

/**
 * Request location permissions from the user.
 * Returns true if permission was granted.
 */
export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

/**
 * Get the current user location.
 */
export async function getCurrentLocation(): Promise<UserLocation | null> {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude,
      accuracy: location.coords.accuracy,
      heading: location.coords.heading,
      speed: location.coords.speed,
    };
  } catch {
    return null;
  }
}

/**
 * Watch for location changes.
 * Returns a subscription object that can be used to stop watching.
 */
export async function watchLocation(
  callback: (location: UserLocation) => void,
  intervalMs: number = 3000
): Promise<Location.LocationSubscription> {
  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: intervalMs,
      distanceInterval: 5, // minimum 5 meters between updates
    },
    (location) => {
      callback({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        accuracy: location.coords.accuracy,
        heading: location.coords.heading,
        speed: location.coords.speed,
      });
    }
  );
}
