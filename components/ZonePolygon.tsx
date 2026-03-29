import React from "react";
import { Polygon, Marker } from "react-native-maps";
import { DroneZone } from "../types/zones";
import { ZONE_COLORS, ZONE_LABELS } from "../constants/zones";

interface ZonePolygonProps {
  zone: DroneZone;
  showLabel?: boolean;
  onPress?: (zone: DroneZone) => void;
}

export default function ZonePolygon({ zone, showLabel = false, onPress }: ZonePolygonProps) {
  const colors = ZONE_COLORS[zone.type];

  return (
    <>
      <Polygon
        coordinates={zone.coordinates}
        fillColor={colors.fill}
        strokeColor={colors.stroke}
        strokeWidth={2}
        tappable
        onPress={() => onPress?.(zone)}
      />
      {showLabel && (
        <Marker
          coordinate={zone.center}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          onPress={() => onPress?.(zone)}
        >
          <React.Fragment>
            {/* Intentionally empty - we only show polygon, not marker icon */}
          </React.Fragment>
        </Marker>
      )}
    </>
  );
}
