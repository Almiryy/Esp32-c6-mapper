import * as SQLite from "expo-sqlite";
import { FlightLog, FavoriteLocation } from "../types/flight";

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync("skycheck.db");
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS flight_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        location_name TEXT NOT NULL DEFAULT '',
        duration_minutes INTEGER NOT NULL DEFAULT 0,
        notes TEXT NOT NULL DEFAULT '',
        max_altitude REAL
      );
      CREATE TABLE IF NOT EXISTS favorite_locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      );
    `);
  }
  return db;
}

// Flight Log operations

export async function addFlightLog(
  log: Omit<FlightLog, "id">
): Promise<number> {
  const database = await getDb();
  const result = await database.runAsync(
    "INSERT INTO flight_logs (date, latitude, longitude, location_name, duration_minutes, notes, max_altitude) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [log.date, log.latitude, log.longitude, log.locationName, log.durationMinutes, log.notes, log.maxAltitude ?? null]
  );
  return result.lastInsertRowId;
}

export async function getFlightLogs(): Promise<FlightLog[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: number;
    date: string;
    latitude: number;
    longitude: number;
    location_name: string;
    duration_minutes: number;
    notes: string;
    max_altitude: number | null;
  }>("SELECT * FROM flight_logs ORDER BY date DESC");

  return rows.map((row) => ({
    id: row.id,
    date: row.date,
    latitude: row.latitude,
    longitude: row.longitude,
    locationName: row.location_name,
    durationMinutes: row.duration_minutes,
    notes: row.notes,
    maxAltitude: row.max_altitude ?? undefined,
  }));
}

export async function deleteFlightLog(id: number): Promise<void> {
  const database = await getDb();
  await database.runAsync("DELETE FROM flight_logs WHERE id = ?", [id]);
}

// Favorite Location operations

export async function addFavoriteLocation(
  fav: Omit<FavoriteLocation, "id">
): Promise<number> {
  const database = await getDb();
  const result = await database.runAsync(
    "INSERT INTO favorite_locations (name, latitude, longitude, notes, created_at) VALUES (?, ?, ?, ?, ?)",
    [fav.name, fav.latitude, fav.longitude, fav.notes, fav.createdAt]
  );
  return result.lastInsertRowId;
}

export async function getFavoriteLocations(): Promise<FavoriteLocation[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    notes: string;
    created_at: string;
  }>("SELECT * FROM favorite_locations ORDER BY created_at DESC");

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    notes: row.notes,
    createdAt: row.created_at,
  }));
}

export async function deleteFavoriteLocation(id: number): Promise<void> {
  const database = await getDb();
  await database.runAsync("DELETE FROM favorite_locations WHERE id = ?", [id]);
}
