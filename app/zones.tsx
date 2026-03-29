import React from "react";
import { View, Text, ScrollView, Linking, Pressable } from "react-native";
import { ZoneType } from "../types/zones";
import { ZONE_COLORS, ZONE_LABELS, ZONE_DESCRIPTIONS } from "../constants/zones";

const ZONE_ORDER: ZoneType[] = [
  "NO_FLY",
  "CTR",
  "MILITARY",
  "DANGER",
  "RESTRICTED",
  "NATIONAL_PARK",
  "ALTITUDE_LIMIT",
];

export default function ZonesScreen() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#0F172A" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      {/* Introduction */}
      <View style={sectionStyle}>
        <Text style={titleStyle}>Drone Zone Guide</Text>
        <Text style={bodyStyle}>
          Slovenia follows EU Regulation 2019/947 for unmanned aircraft operations.
          The map shows geographical restriction zones published by the Civil Aviation
          Agency of Slovenia (CAA).
        </Text>
      </View>

      {/* Zone Types */}
      <Text style={[sectionTitleStyle, { marginTop: 20 }]}>Zone Types</Text>
      {ZONE_ORDER.map((type) => {
        const colors = ZONE_COLORS[type];
        return (
          <View key={type} style={zoneCardStyle}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  backgroundColor: colors.stroke,
                  marginRight: 10,
                }}
              />
              <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "600" }}>
                {ZONE_LABELS[type]}
              </Text>
            </View>
            <Text style={{ color: "#94A3B8", fontSize: 13 }}>
              {ZONE_DESCRIPTIONS[type]}
            </Text>
          </View>
        );
      })}

      {/* Key Rules */}
      <Text style={[sectionTitleStyle, { marginTop: 24 }]}>Key Rules</Text>
      <View style={sectionStyle}>
        <RuleItem text="Maximum flight altitude: 120m AGL (50m near airports)" />
        <RuleItem text="Maintain Visual Line of Sight (VLOS) at all times" />
        <RuleItem text="Registration required for drones >250g or with camera" />
        <RuleItem text="Minimum insurance: 1,000,000 EUR coverage" />
        <RuleItem text="Do not fly over people or assemblies of people" />
        <RuleItem text="Give way to manned aircraft at all times" />
        <RuleItem text="National parks (Triglav) require authorization" />
        <RuleItem text="Night flights require special authorization" />
      </View>

      {/* Categories */}
      <Text style={[sectionTitleStyle, { marginTop: 24 }]}>EU Drone Categories</Text>
      <View style={sectionStyle}>
        <CategoryCard
          name="Open"
          description="Low-risk flights. No authorization needed, but must follow subcategory rules (A1/A2/A3). Max 120m, VLOS only."
        />
        <CategoryCard
          name="Specific"
          description="Medium-risk flights. Requires operational authorization from CAA or standard scenario declaration."
        />
        <CategoryCard
          name="Certified"
          description="High-risk flights. Full certification required, similar to manned aviation."
        />
      </View>

      {/* Links */}
      <Text style={[sectionTitleStyle, { marginTop: 24 }]}>Useful Links</Text>
      <View style={sectionStyle}>
        <LinkButton
          label="CAA Slovenia - UAS Info"
          url="https://www.caa.si/en/unmanned-aircraft-system.html"
        />
        <LinkButton
          label="CAA Drone Zone Map"
          url="https://caa-slovenia.maps.arcgis.com/apps/webappviewer/index.html?id=25ba69037c264c5faa5381174f76f861"
        />
        <LinkButton
          label="UAS Registration Portal"
          url="https://uas.caa.si/en/login/"
        />
        <LinkButton
          label="Geographical Restrictions"
          url="https://www.caa.si/en/geographical-restrictions-for-uas.html"
        />
      </View>

      <Text style={{ color: "#475569", fontSize: 11, textAlign: "center", marginTop: 24 }}>
        Data based on CAA Slovenia regulations. Always check the official CAA map
        and current NOTAMs before flying. This app is for informational purposes only.
      </Text>
    </ScrollView>
  );
}

function RuleItem({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 8 }}>
      <Text style={{ color: "#60A5FA", fontSize: 14, marginRight: 8 }}>•</Text>
      <Text style={{ color: "#CBD5E1", fontSize: 13, flex: 1 }}>{text}</Text>
    </View>
  );
}

function CategoryCard({ name, description }: { name: string; description: string }) {
  return (
    <View
      style={{
        backgroundColor: "#0F172A",
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
      }}
    >
      <Text style={{ color: "#60A5FA", fontSize: 14, fontWeight: "700" }}>{name}</Text>
      <Text style={{ color: "#94A3B8", fontSize: 12, marginTop: 4 }}>{description}</Text>
    </View>
  );
}

function LinkButton({ label, url }: { label: string; url: string }) {
  return (
    <Pressable
      onPress={() => Linking.openURL(url)}
      style={{
        backgroundColor: "#0F172A",
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 8,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#60A5FA", fontSize: 14 }}>{label}</Text>
      <Text style={{ color: "#475569", fontSize: 16 }}>→</Text>
    </Pressable>
  );
}

const sectionStyle = {
  backgroundColor: "#1E293B",
  borderRadius: 12,
  padding: 16,
} as const;

const titleStyle = {
  color: "#FFFFFF",
  fontSize: 18,
  fontWeight: "700" as const,
  marginBottom: 8,
};

const bodyStyle = {
  color: "#CBD5E1",
  fontSize: 13,
  lineHeight: 20,
};

const sectionTitleStyle = {
  color: "#94A3B8",
  fontSize: 12,
  fontWeight: "700" as const,
  letterSpacing: 1,
  textTransform: "uppercase" as const,
  marginBottom: 8,
};

const zoneCardStyle = {
  backgroundColor: "#1E293B",
  borderRadius: 10,
  padding: 14,
  marginBottom: 8,
} as const;
