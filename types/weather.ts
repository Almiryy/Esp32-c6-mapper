export interface WeatherData {
  temperature: number;
  windSpeed: number;
  windGusts: number;
  windDirection: number;
  visibility: number; // meters
  precipitation: number; // mm
  cloudCover: number; // percentage
  humidity: number;
  isGoodForFlying: boolean;
  warnings: string[];
}

export interface WeatherForecastHour {
  time: string;
  temperature: number;
  windSpeed: number;
  windGusts: number;
  precipitation: number;
  cloudCover: number;
  visibility: number;
}
