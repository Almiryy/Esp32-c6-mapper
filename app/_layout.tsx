import React from "react";
import { Text } from "react-native";
import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: "#1a1a2e" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "700" },
          tabBarStyle: {
            backgroundColor: "#1a1a2e",
            borderTopColor: "#16213e",
            paddingBottom: 4,
            height: 56,
          },
          tabBarActiveTintColor: "#60A5FA",
          tabBarInactiveTintColor: "#64748B",
          tabBarLabelStyle: { fontSize: 11 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "SkyCheck Slovenia",
            tabBarLabel: "Map",
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size, color }}>🗺️</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="checklist"
          options={{
            title: "Pre-Flight Checklist",
            tabBarLabel: "Checklist",
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size, color }}>✅</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="log"
          options={{
            title: "Flight Log",
            tabBarLabel: "Log",
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size, color }}>📋</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="zones"
          options={{
            title: "Zone Guide",
            tabBarLabel: "Zones",
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size, color }}>ℹ️</Text>
            ),
          }}
        />
      </Tabs>
    </>
  );
}
