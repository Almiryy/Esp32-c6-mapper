import SunCalc from "suncalc";

export interface SunTimesData {
  sunrise: Date;
  sunset: Date;
  goldenHourStart: Date; // evening golden hour start
  goldenHourEnd: Date; // evening golden hour end (sunset)
  morningGoldenStart: Date; // morning golden hour start (sunrise)
  morningGoldenEnd: Date; // morning golden hour end
  blueHourStart: Date; // evening blue hour
  blueHourEnd: Date;
  solarNoon: Date;
  isDaylight: boolean;
  isGoldenHour: boolean;
}

/**
 * Calculate sun times for a given location and date.
 */
export function getSunTimes(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): SunTimesData {
  const times = SunCalc.getTimes(date, latitude, longitude);
  const now = date;

  // Golden hour is roughly the hour after sunrise and before sunset
  const morningGoldenStart = times.sunrise;
  const morningGoldenEnd = new Date(times.sunrise.getTime() + 60 * 60 * 1000);
  const goldenHourStart = new Date(times.sunset.getTime() - 60 * 60 * 1000);
  const goldenHourEnd = times.sunset;

  // Blue hour is roughly 20-40 minutes before sunrise and after sunset
  const blueHourStart = times.sunset;
  const blueHourEnd = new Date(times.sunset.getTime() + 30 * 60 * 1000);

  const isDaylight = now >= times.sunrise && now <= times.sunset;
  const isGoldenHour =
    (now >= morningGoldenStart && now <= morningGoldenEnd) ||
    (now >= goldenHourStart && now <= goldenHourEnd);

  return {
    sunrise: times.sunrise,
    sunset: times.sunset,
    goldenHourStart,
    goldenHourEnd,
    morningGoldenStart,
    morningGoldenEnd,
    blueHourStart,
    blueHourEnd,
    solarNoon: times.solarNoon,
    isDaylight,
    isGoldenHour,
  };
}

/**
 * Format a Date object to a time string (HH:MM).
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
