import React from "react";
import { View, Text, Pressable } from "react-native";
import { FlyStatus, ZoneCheckResult } from "../types/zones";

interface FlyStatusBannerProps {
  result: ZoneCheckResult | null;
  loading?: boolean;
  onPress?: () => void;
}

const STATUS_CONFIG: Record<
  FlyStatus,
  { bg: string; text: string; icon: string; label: string }
> = {
  CLEAR: {
    bg: "#16A34A",
    text: "#FFFFFF",
    icon: "✓",
    label: "CLEAR TO FLY",
  },
  RESTRICTED: {
    bg: "#F59E0B",
    text: "#000000",
    icon: "⚠",
    label: "RESTRICTED",
  },
  NO_FLY: {
    bg: "#DC2626",
    text: "#FFFFFF",
    icon: "✕",
    label: "NO FLY ZONE",
  },
};

export default function FlyStatusBanner({
  result,
  loading,
  onPress,
}: FlyStatusBannerProps) {
  if (loading) {
    return (
      <View
        style={{
          backgroundColor: "#374151",
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 12,
          marginHorizontal: 16,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
          Checking airspace...
        </Text>
      </View>
    );
  }

  if (!result) {
    return (
      <View
        style={{
          backgroundColor: "#374151",
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 12,
          marginHorizontal: 16,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
          Waiting for GPS location...
        </Text>
      </View>
    );
  }

  const config = STATUS_CONFIG[result.status];

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: config.bg,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginHorizontal: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 24, marginRight: 8 }}>{config.icon}</Text>
        <Text
          style={{
            color: config.text,
            fontSize: 20,
            fontWeight: "800",
            letterSpacing: 1,
          }}
        >
          {config.label}
        </Text>
      </View>
      <Text
        style={{
          color: config.text,
          fontSize: 13,
          textAlign: "center",
          marginTop: 4,
          opacity: 0.9,
        }}
        numberOfLines={2}
      >
        {result.message}
      </Text>
    </Pressable>
  );
}
