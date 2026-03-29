import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChecklistItem } from "../types/flight";
import { DEFAULT_CHECKLIST, CATEGORY_LABELS } from "../constants/checklist";

const STORAGE_KEY = "preflight_checklist";

export default function ChecklistScreen() {
  const [items, setItems] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);

  // Load saved state
  useEffect(() => {
    loadChecklist();
  }, []);

  async function loadChecklist() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const savedItems: ChecklistItem[] = JSON.parse(stored);
        // Merge saved state with default items (in case new items were added)
        const merged = DEFAULT_CHECKLIST.map((defaultItem) => {
          const saved = savedItems.find((s) => s.id === defaultItem.id);
          return saved ? { ...defaultItem, checked: saved.checked } : defaultItem;
        });
        setItems(merged);
      }
    } catch {
      // Use defaults
    }
  }

  async function toggleItem(id: string) {
    const updated = items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setItems(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  async function resetChecklist() {
    Alert.alert("Reset Checklist", "Uncheck all items?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: async () => {
          const reset = items.map((item) => ({ ...item, checked: false }));
          setItems(reset);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
        },
      },
    ]);
  }

  const totalItems = items.length;
  const checkedItems = items.filter((i) => i.checked).length;
  const allChecked = checkedItems === totalItems;

  // Group items by category
  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <View style={{ flex: 1, backgroundColor: "#0F172A" }}>
      {/* Progress header */}
      <View style={{ padding: 16, backgroundColor: "#1a1a2e" }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
            {checkedItems}/{totalItems} completed
          </Text>
          <Pressable onPress={resetChecklist}>
            <Text style={{ color: "#60A5FA", fontSize: 14 }}>Reset</Text>
          </Pressable>
        </View>
        {/* Progress bar */}
        <View
          style={{
            height: 6,
            backgroundColor: "#334155",
            borderRadius: 3,
            marginTop: 10,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${(checkedItems / totalItems) * 100}%`,
              backgroundColor: allChecked ? "#16A34A" : "#60A5FA",
              borderRadius: 3,
            }}
          />
        </View>
        {allChecked && (
          <Text
            style={{
              color: "#16A34A",
              fontSize: 14,
              fontWeight: "600",
              marginTop: 8,
              textAlign: "center",
            }}
          >
            All checks passed! Ready for flight.
          </Text>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
        {categories.map((category) => (
          <View key={category} style={{ marginTop: 16 }}>
            <Text
              style={{
                color: "#94A3B8",
                fontSize: 12,
                fontWeight: "700",
                letterSpacing: 1,
                textTransform: "uppercase",
                paddingHorizontal: 16,
                marginBottom: 8,
              }}
            >
              {CATEGORY_LABELS[category] || category}
            </Text>
            {items
              .filter((item) => item.category === category)
              .map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => toggleItem(item.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: item.checked ? "#0F2A1A" : "#1E293B",
                    borderBottomWidth: 1,
                    borderBottomColor: "#0F172A",
                  }}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: item.checked ? "#16A34A" : "#475569",
                      backgroundColor: item.checked ? "#16A34A" : "transparent",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                    }}
                  >
                    {item.checked && (
                      <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700" }}>
                        ✓
                      </Text>
                    )}
                  </View>
                  <Text
                    style={{
                      color: item.checked ? "#86EFAC" : "#E2E8F0",
                      fontSize: 14,
                      flex: 1,
                      textDecorationLine: item.checked ? "line-through" : "none",
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
