import React from "react";
import { View, Text } from "react-native";
import { SunTimesData, formatTime } from "../services/sunTimes";

interface SunTimesCardProps {
  sunTimes: SunTimesData | null;
}

export default function SunTimesCard({ sunTimes }: SunTimesCardProps) {
  if (!sunTimes) return null;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <SunItem label="Sunrise" time={formatTime(sunTimes.sunrise)} icon="↑" />
        <SunItem label="Solar Noon" time={formatTime(sunTimes.solarNoon)} icon="◉" />
        <SunItem label="Sunset" time={formatTime(sunTimes.sunset)} icon="↓" />
      </View>

      <View style={styles.goldenRow}>
        {sunTimes.isGoldenHour ? (
          <View style={styles.goldenActive}>
            <Text style={styles.goldenIcon}>✦</Text>
            <Text style={styles.goldenActiveText}>Golden hour now!</Text>
          </View>
        ) : (
          <>
            <Text style={styles.goldenLabel}>
              Golden hour: {formatTime(sunTimes.morningGoldenStart)}-
              {formatTime(sunTimes.morningGoldenEnd)} / {formatTime(sunTimes.goldenHourStart)}-
              {formatTime(sunTimes.goldenHourEnd)}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

function SunItem({ label, time, icon }: { label: string; time: string; icon: string }) {
  return (
    <View style={styles.item}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.time}>{time}</Text>
      <Text style={styles.label}>{label}</Text>
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
  row: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
  },
  item: {
    alignItems: "center" as const,
  },
  icon: {
    fontSize: 18,
    color: "#FBBF24",
  },
  time: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600" as const,
    marginTop: 2,
  },
  label: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 2,
  },
  goldenRow: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#334155",
    paddingTop: 8,
    alignItems: "center" as const,
  },
  goldenActive: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  goldenIcon: {
    color: "#FBBF24",
    fontSize: 16,
    marginRight: 6,
  },
  goldenActiveText: {
    color: "#FBBF24",
    fontSize: 13,
    fontWeight: "600" as const,
  },
  goldenLabel: {
    color: "#94A3B8",
    fontSize: 12,
  },
};
