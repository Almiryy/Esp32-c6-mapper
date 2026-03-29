import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, Pressable, Alert, ScrollView, Dimensions } from "react-native";
import MapView, { Region, PROVIDER_DEFAULT } from "react-native-maps";
import { SLOVENIA_CENTER } from "../constants/zones";
import { fetchDroneZones } from "../services/arcgis";
import { checkZoneStatus } from "../services/zoneCheck";
import { requestLocationPermission, watchLocation, UserLocation } from "../services/location";
import { fetchWeather } from "../services/weather";
import { getSunTimes, SunTimesData } from "../services/sunTimes";
import { DroneZone, ZoneCheckResult } from "../types/zones";
import { WeatherData } from "../types/weather";
import FlyStatusBanner from "../components/FlyStatusBanner";
import WeatherCard from "../components/WeatherCard";
import SunTimesCard from "../components/SunTimesCard";
import ZonePolygon from "../components/ZonePolygon";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);

  const [zones, setZones] = useState<DroneZone[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [zoneResult, setZoneResult] = useState<ZoneCheckResult | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [sunTimes, setSunTimes] = useState<SunTimesData | null>(null);
  const [selectedZone, setSelectedZone] = useState<DroneZone | null>(null);
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const [loadingZones, setLoadingZones] = useState(true);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [showInfoCards, setShowInfoCards] = useState(true);

  // Load zones on mount
  useEffect(() => {
    loadZones();
  }, []);

  // Start GPS tracking
  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    async function startTracking() {
      const granted = await requestLocationPermission();
      if (!granted) {
        Alert.alert(
          "Location Permission Required",
          "SkyCheck needs your location to check if you can fly a drone here. Please enable location in your device settings."
        );
        return;
      }

      subscription = await watchLocation((location) => {
        setUserLocation(location);
      });
    }

    startTracking();

    return () => {
      subscription?.remove();
    };
  }, []);

  // Update zone status and weather when location changes
  useEffect(() => {
    if (!userLocation || zones.length === 0) return;

    const result = checkZoneStatus(userLocation.latitude, userLocation.longitude, zones);
    setZoneResult(result);

    // Fetch weather and sun times
    loadWeather(userLocation.latitude, userLocation.longitude);
    const sun = getSunTimes(userLocation.latitude, userLocation.longitude);
    setSunTimes(sun);
  }, [userLocation, zones]);

  async function loadZones() {
    setLoadingZones(true);
    try {
      const data = await fetchDroneZones();
      setZones(data);
    } catch {
      Alert.alert("Error", "Failed to load drone zones. Using offline data.");
    } finally {
      setLoadingZones(false);
    }
  }

  async function loadWeather(lat: number, lng: number) {
    setLoadingWeather(true);
    try {
      const data = await fetchWeather(lat, lng);
      setWeather(data);
    } catch {
      // Weather is non-critical
    } finally {
      setLoadingWeather(false);
    }
  }

  const centerOnUser = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [userLocation]);

  const handleZonePress = useCallback((zone: DroneZone) => {
    setSelectedZone(zone);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_DEFAULT}
        initialRegion={SLOVENIA_CENTER}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
        mapType="terrain"
      >
        {zones.map((zone) => (
          <ZonePolygon
            key={zone.id}
            zone={zone}
            onPress={handleZonePress}
          />
        ))}
      </MapView>

      {/* Overlay UI */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: 8,
        }}
      >
        {/* Fly Status Banner */}
        <FlyStatusBanner
          result={zoneResult}
          loading={loadingZones}
          onPress={() => setShowInfoCards(!showInfoCards)}
        />

        {/* Info Cards (collapsible) */}
        {showInfoCards && (
          <ScrollView
            style={{ maxHeight: SCREEN_HEIGHT * 0.3 }}
            showsVerticalScrollIndicator={false}
          >
            <WeatherCard
              weather={weather}
              loading={loadingWeather}
              expanded={weatherExpanded}
              onToggle={() => setWeatherExpanded(!weatherExpanded)}
            />
            <SunTimesCard sunTimes={sunTimes} />

            {/* Selected zone info */}
            {selectedZone && (
              <View
                style={{
                  backgroundColor: "#1E293B",
                  borderRadius: 12,
                  padding: 12,
                  marginHorizontal: 16,
                  marginTop: 8,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700", flex: 1 }}>
                    {selectedZone.name}
                  </Text>
                  <Pressable onPress={() => setSelectedZone(null)}>
                    <Text style={{ color: "#64748B", fontSize: 18, paddingLeft: 8 }}>✕</Text>
                  </Pressable>
                </View>
                <Text style={{ color: "#94A3B8", fontSize: 13, marginTop: 4 }}>
                  {selectedZone.description}
                </Text>
                {selectedZone.maxAltitude !== undefined && (
                  <Text style={{ color: "#FBBF24", fontSize: 13, marginTop: 4 }}>
                    Max altitude: {selectedZone.maxAltitude}m AGL
                  </Text>
                )}
              </View>
            )}
            <View style={{ height: 8 }} />
          </ScrollView>
        )}
      </View>

      {/* Center on user button */}
      <Pressable
        onPress={centerOnUser}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          backgroundColor: "#1E293B",
          width: 44,
          height: 44,
          borderRadius: 22,
          justifyContent: "center",
          alignItems: "center",
          elevation: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        }}
      >
        <Text style={{ fontSize: 20 }}>📍</Text>
      </Pressable>

      {/* Refresh zones button */}
      <Pressable
        onPress={loadZones}
        style={{
          position: "absolute",
          top: 70,
          right: 16,
          backgroundColor: "#1E293B",
          width: 44,
          height: 44,
          borderRadius: 22,
          justifyContent: "center",
          alignItems: "center",
          elevation: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
        }}
      >
        <Text style={{ fontSize: 20 }}>🔄</Text>
      </Pressable>
    </View>
  );
}
