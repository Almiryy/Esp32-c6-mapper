import React from "react";
import { View, Text, Pressable } from "react-native";
import { WeatherData } from "../types/weather";
import { getWindDirectionLabel } from "../services/weather";

interface WeatherCardProps {
  weather: WeatherData | null;
  loading?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}

export default function WeatherCard({
  weather,
  loading,
  expanded,
  onToggle,
}: WeatherCardProps) {
  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.loadingText}>Loading weather...</Text>
      </View>
    );
  }

  if (!weather) return null;

  return (
    <Pressable onPress={onToggle} style={styles.card}>
      {/* Compact header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.temp}>{Math.round(weather.temperature)}°C</Text>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: weather.isGoodForFlying ? "#16A34A" : "#DC2626" },
            ]}
          />
          <Text style={styles.statusText}>
            {weather.isGoodForFlying ? "Good for flying" : "Not ideal"}
          </Text>
        </View>
        <Text style={styles.windCompact}>
          {weather.windSpeed.toFixed(1)} m/s {getWindDirectionLabel(weather.windDirection)}
        </Text>
      </View>

      {/* Warnings */}
      {weather.warnings.length > 0 && (
        <View style={styles.warningsRow}>
          {weather.warnings.map((w, i) => (
            <Text key={i} style={styles.warningText}>
              ⚠ {w}
            </Text>
          ))}
        </View>
      )}

      {/* Expanded details */}
      {expanded && (
        <View style={styles.details}>
          <WeatherRow label="Wind Speed" value={`${weather.windSpeed.toFixed(1)} m/s`} />
          <WeatherRow label="Wind Gusts" value={`${weather.windGusts.toFixed(1)} m/s`} />
          <WeatherRow
            label="Wind Direction"
            value={`${weather.windDirection}° (${getWindDirectionLabel(weather.windDirection)})`}
          />
          <WeatherRow
            label="Visibility"
            value={`${(weather.visibility / 1000).toFixed(1)} km`}
          />
          <WeatherRow label="Precipitation" value={`${weather.precipitation.toFixed(1)} mm/h`} />
          <WeatherRow label="Cloud Cover" value={`${weather.cloudCover}%`} />
          <WeatherRow label="Humidity" value={`${weather.humidity}%`} />
        </View>
      )}
    </Pressable>
  );
}

function WeatherRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = {
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
  } as const,
  loadingText: {
    color: "#94A3B8",
    textAlign: "center" as const,
    fontSize: 14,
  },
  header: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  headerLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  temp: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700" as const,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: "#94A3B8",
    fontSize: 13,
  },
  windCompact: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "500" as const,
  },
  warningsRow: {
    marginTop: 8,
  },
  warningText: {
    color: "#FBBF24",
    fontSize: 12,
    marginTop: 2,
  },
  details: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingTop: 8,
  },
  row: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    paddingVertical: 4,
  },
  rowLabel: {
    color: "#94A3B8",
    fontSize: 13,
  },
  rowValue: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "500" as const,
  },
};
