import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { FlightLog, FavoriteLocation } from "../types/flight";
import {
  getFlightLogs,
  addFlightLog,
  deleteFlightLog,
  getFavoriteLocations,
  addFavoriteLocation,
  deleteFavoriteLocation,
} from "../services/database";
import { getCurrentLocation } from "../services/location";

type Tab = "flights" | "favorites";

export default function LogScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("flights");
  const [flights, setFlights] = useState<FlightLog[]>([]);
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newDuration, setNewDuration] = useState("");

  const loadData = useCallback(async () => {
    const [f, fav] = await Promise.all([getFlightLogs(), getFavoriteLocations()]);
    setFlights(f);
    setFavorites(fav);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAddFlight() {
    const location = await getCurrentLocation();
    if (!location) {
      Alert.alert("Error", "Could not get current location.");
      return;
    }

    await addFlightLog({
      date: new Date().toISOString(),
      latitude: location.latitude,
      longitude: location.longitude,
      locationName: newName || "Unknown Location",
      durationMinutes: parseInt(newDuration, 10) || 0,
      notes: newNotes,
    });

    setNewName("");
    setNewNotes("");
    setNewDuration("");
    setShowAddModal(false);
    loadData();
  }

  async function handleAddFavorite() {
    const location = await getCurrentLocation();
    if (!location) {
      Alert.alert("Error", "Could not get current location.");
      return;
    }

    await addFavoriteLocation({
      name: newName || "Favorite Spot",
      latitude: location.latitude,
      longitude: location.longitude,
      notes: newNotes,
      createdAt: new Date().toISOString(),
    });

    setNewName("");
    setNewNotes("");
    setShowAddModal(false);
    loadData();
  }

  function handleDeleteFlight(id: number) {
    Alert.alert("Delete Flight", "Remove this flight from your log?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteFlightLog(id);
          loadData();
        },
      },
    ]);
  }

  function handleDeleteFavorite(id: number) {
    Alert.alert("Delete Favorite", "Remove this location from favorites?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteFavoriteLocation(id);
          loadData();
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
      {/* Tab selector */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#1a1a2e",
          paddingHorizontal: 16,
          paddingTop: 8,
        }}
      >
        <TabButton
          label="Flights"
          active={activeTab === "flights"}
          onPress={() => setActiveTab("flights")}
        />
        <TabButton
          label="Favorites"
          active={activeTab === "favorites"}
          onPress={() => setActiveTab("favorites")}
        />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {activeTab === "flights" ? (
          flights.length === 0 ? (
            <EmptyState message="No flights logged yet. Tap + to log your first flight." />
          ) : (
            flights.map((flight) => (
              <Pressable
                key={flight.id}
                onLongPress={() => handleDeleteFlight(flight.id)}
                style={cardStyle}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "600" }}>
                    {flight.locationName}
                  </Text>
                  <Text style={{ color: "#64748B", fontSize: 12 }}>
                    {new Date(flight.date).toLocaleDateString()}
                  </Text>
                </View>
                {flight.durationMinutes > 0 && (
                  <Text style={{ color: "#94A3B8", fontSize: 13, marginTop: 4 }}>
                    Duration: {flight.durationMinutes} min
                  </Text>
                )}
                {flight.notes ? (
                  <Text style={{ color: "#94A3B8", fontSize: 13, marginTop: 2 }}>
                    {flight.notes}
                  </Text>
                ) : null}
                <Text style={{ color: "#475569", fontSize: 11, marginTop: 4 }}>
                  {flight.latitude.toFixed(5)}, {flight.longitude.toFixed(5)}
                </Text>
              </Pressable>
            ))
          )
        ) : favorites.length === 0 ? (
          <EmptyState message="No favorite locations saved. Tap + to save your current spot." />
        ) : (
          favorites.map((fav) => (
            <Pressable
              key={fav.id}
              onLongPress={() => handleDeleteFavorite(fav.id)}
              style={cardStyle}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "600" }}>
                {fav.name}
              </Text>
              {fav.notes ? (
                <Text style={{ color: "#94A3B8", fontSize: 13, marginTop: 2 }}>
                  {fav.notes}
                </Text>
              ) : null}
              <Text style={{ color: "#475569", fontSize: 11, marginTop: 4 }}>
                {fav.latitude.toFixed(5)}, {fav.longitude.toFixed(5)}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Add button */}
      <Pressable
        onPress={() => setShowAddModal(true)}
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#3B82F6",
          justifyContent: "center",
          alignItems: "center",
          elevation: 6,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
        }}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 28, fontWeight: "300" }}>+</Text>
      </Pressable>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: "#1E293B",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 24,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700", marginBottom: 16 }}>
              {activeTab === "flights" ? "Log Flight" : "Save Favorite"}
            </Text>

            <Text style={{ color: "#94A3B8", fontSize: 13, marginBottom: 4 }}>
              {activeTab === "flights" ? "Location Name" : "Name"}
            </Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder={activeTab === "flights" ? "e.g. Lake Bled" : "e.g. My Favorite Spot"}
              placeholderTextColor="#475569"
              style={inputStyle}
            />

            {activeTab === "flights" && (
              <>
                <Text style={{ color: "#94A3B8", fontSize: 13, marginBottom: 4, marginTop: 12 }}>
                  Duration (minutes)
                </Text>
                <TextInput
                  value={newDuration}
                  onChangeText={setNewDuration}
                  placeholder="e.g. 15"
                  placeholderTextColor="#475569"
                  keyboardType="numeric"
                  style={inputStyle}
                />
              </>
            )}

            <Text style={{ color: "#94A3B8", fontSize: 13, marginBottom: 4, marginTop: 12 }}>
              Notes
            </Text>
            <TextInput
              value={newNotes}
              onChangeText={setNewNotes}
              placeholder="Optional notes..."
              placeholderTextColor="#475569"
              multiline
              style={[inputStyle, { height: 80, textAlignVertical: "top" }]}
            />

            <Text style={{ color: "#64748B", fontSize: 12, marginTop: 8 }}>
              Current GPS location will be used automatically.
            </Text>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
              <Pressable
                onPress={() => {
                  setShowAddModal(false);
                  setNewName("");
                  setNewNotes("");
                  setNewDuration("");
                }}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 10,
                  backgroundColor: "#334155",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#CBD5E1", fontSize: 15, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={activeTab === "flights" ? handleAddFlight : handleAddFavorite}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 10,
                  backgroundColor: "#3B82F6",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "600" }}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderBottomWidth: 2,
        borderBottomColor: active ? "#60A5FA" : "transparent",
        marginRight: 8,
      }}
    >
      <Text
        style={{
          color: active ? "#60A5FA" : "#64748B",
          fontSize: 14,
          fontWeight: active ? "700" : "500",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View style={{ alignItems: "center", marginTop: 60 }}>
      <Text style={{ color: "#475569", fontSize: 14, textAlign: "center" }}>{message}</Text>
    </View>
  );
}

const cardStyle = {
  backgroundColor: "#1E293B",
  borderRadius: 10,
  padding: 14,
  marginBottom: 10,
} as const;

const inputStyle = {
  backgroundColor: "#0F172A",
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  color: "#FFFFFF",
  fontSize: 14,
  borderWidth: 1,
  borderColor: "#334155",
} as const;
