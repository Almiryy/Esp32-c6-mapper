export interface FlightLog {
  id: number;
  date: string;
  latitude: number;
  longitude: number;
  locationName: string;
  durationMinutes: number;
  notes: string;
  maxAltitude?: number;
}

export interface FavoriteLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  notes: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  category: "legal" | "equipment" | "environment" | "safety";
}
