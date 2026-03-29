# SkyCheck Slovenia

A mobile app for drone pilots in Slovenia that instantly shows whether you can fly at your GPS location, using official zone data from the Civil Aviation Agency of Slovenia (CAA).

## Features

- **Live Fly/No-Fly Status** - GPS-based real-time check against CAA drone zones
- **Zone Map** - Color-coded map overlays showing all restricted areas (airports, national parks, military zones, populated areas)
- **Weather Integration** - Wind speed, gusts, visibility, precipitation from Open-Meteo (no API key needed)
- **Pre-Flight Checklist** - Interactive checklist covering legal, equipment, environment, and safety checks
- **Flight Log** - Log flights with location, duration, and notes (stored locally with SQLite)
- **Favorite Locations** - Save and manage your favorite flying spots
- **Sunrise/Sunset & Golden Hour** - Know the best times for aerial photography

## Tech Stack

- **React Native + Expo** (TypeScript)
- **react-native-maps** - Native map rendering with polygon overlays
- **expo-location** - GPS tracking
- **expo-router** - File-based navigation
- **expo-sqlite** - Local database for flight logs and favorites
- **@turf/boolean-point-in-polygon** - Point-in-polygon zone checking
- **suncalc** - Sun position calculations
- **Open-Meteo API** - Weather data (free, no key required)

## Data Source

Zone data comes from the CAA Slovenia ArcGIS service. The app attempts to fetch live zone data from the ArcGIS FeatureServer endpoints. If unavailable, it falls back to bundled zone data covering major airports (Ljubljana, Maribor, Portoroz), Triglav National Park, Krsko nuclear facility, and city centers.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios
```

## Zone Color Coding

| Color | Zone Type | Meaning |
|-------|-----------|---------|
| Red | No-Fly / CTR / Military / Danger | Flights prohibited |
| Orange | National Park | Authorization from park authority required |
| Yellow | Altitude Limited | Max altitude reduced to 50m AGL |
| Green status | Clear | OK to fly, max 120m AGL |

## Disclaimer

This app is for informational purposes only. Always verify airspace restrictions on the official CAA Slovenia map and check current NOTAMs before flying. The pilot is solely responsible for ensuring compliance with all applicable regulations.

## License

Apache License 2.0
