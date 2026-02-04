# FPV Voxel — Drone Flight Simulator

An FPV drone flying game with procedurally generated Minecraft-style voxel worlds. Built with Godot 4, runs on Android/iOS. Supports any gamepad controller (ELRS, Xbox, PS, generic) via USB or Bluetooth, plus on-screen touch controls.

## Quick Start

### What You Need

- **Godot 4.3+** — Download from https://godotengine.org/download
- **Android phone** (for mobile builds) — or test on desktop first
- **Any gamepad** (optional) — ELRS controller in USB joystick mode, Xbox, PS, etc.

### Run on Desktop (Testing)

1. Download and install [Godot 4.3+](https://godotengine.org/download) (standard version, not .NET)
2. Open Godot, click **Import** → navigate to `game/project.godot` → **Import & Edit**
3. Press **F5** (or the Play ▶ button) to run
4. Controls:
   - **W/S** — Throttle up/down
   - **A/D** — Yaw left/right
   - **Arrow keys** — Pitch and Roll
   - **Space** — Arm/Disarm motors
   - **M** — Switch flight mode (Acro/Angle/Horizon)
   - **Esc** — Pause
5. If you plug in a gamepad, it's automatically detected (see Controller Setup below)

### Get APK Without a PC (GitHub Actions)

The repo has a CI workflow that builds the APK automatically in the cloud:

1. Push any change to the `game/` folder (or click **Actions → Build Android APK → Run workflow** on GitHub)
2. Wait for the build to finish (green checkmark)
3. Go to the **Actions** tab → click the latest run → scroll to **Artifacts**
4. Download `fpv-voxel-android.zip` — it contains the APK
5. Transfer to your phone, install (enable "Install from unknown sources"), done

No PC, no SDK, no Godot install required — GitHub builds it for you.

### Build APK Locally (With a PC)

1. In Godot, go to **Editor → Manage Export Templates** → download the Android template
2. Install [Android SDK](https://developer.android.com/studio) (or just the command-line tools)
3. In Godot, go to **Editor → Editor Settings → Export → Android**:
   - Set the path to your Android SDK
   - Set the path to your Java JDK (bundled with Android Studio)
   - Generate or set a debug keystore
4. Go to **Project → Export → Add → Android**
5. Click **Export Project** → choose a filename like `fpv_voxel.apk`
6. Transfer the APK to your phone and install it (enable "Install from unknown sources")

Alternatively, click **Remote Debug** (one-click deploy) if your phone is connected via USB with developer mode enabled.

### Build for iOS

1. Requires a Mac with Xcode installed
2. In Godot: **Project → Export → Add → iOS**
3. Export generates an Xcode project you open and build/deploy from Xcode

## Controller Setup

### ELRS Controller (USB Joystick Mode)
Your ELRS radio (RadioMaster, BetaFPV, etc.) can connect directly to your phone:

1. Put your radio in **USB Joystick/Gamepad mode** (check your radio's manual — usually in the USB settings)
2. Connect to your Android phone via **USB OTG cable**
3. The game auto-detects it — you'll see the controller name flash on screen
4. Default mapping is **Mode 2** (left stick = throttle/yaw, right stick = pitch/roll)

### Bluetooth Controllers (Xbox, PS, Generic)
1. Pair the controller with your phone via Bluetooth settings
2. Launch the game — auto-detected

### Touch Controls
If no controller is connected, on-screen dual sticks appear automatically:
- **Left side** of screen — Throttle (up/down) + Yaw (left/right)
- **Right side** of screen — Pitch + Roll
- **ARM button** at bottom center

## Project Structure

```
game/
├── project.godot              # Godot project config
├── scenes/main.tscn           # Main game scene
├── src/
│   ├── main.gd                # Game entry point
│   ├── drone/
│   │   ├── drone_controller.gd   # Flight physics (acro/angle/horizon)
│   │   ├── drone_camera.gd       # FPV camera (110° FOV)
│   │   ├── drone_audio.gd        # Procedural motor sounds
│   │   └── drone_osd.gd          # HUD overlay (battery, speed, etc.)
│   ├── world/
│   │   ├── world_manager.gd      # Chunk loading around player
│   │   ├── chunk.gd              # Voxel chunk + greedy meshing
│   │   └── terrain_generator.gd  # Noise-based terrain + biomes
│   ├── input/
│   │   ├── input_manager.gd      # Universal controller support
│   │   └── touch_controls.gd     # On-screen dual sticks
│   └── util/
│       └── constants.gd          # Game constants & config
└── assets/
    └── shaders/
        ├── terrain.gdshader       # Block rendering + fog
        └── sky.gdshader           # Procedural sky + sun
```

## Features

- **Procedural voxel world** — Infinite terrain with biomes (plains, forest, desert, mountains, caves)
- **Greedy meshing** — 80-90% triangle reduction for mobile performance
- **3 flight modes** — Acro (rate mode), Angle (self-leveling), Horizon (hybrid)
- **Any controller** — ELRS/USB/Bluetooth gamepads auto-detected, touch fallback
- **FPV OSD** — Battery, speed, altitude, throttle, flight timer, armed status
- **Procedural audio** — Motor sounds react to throttle and speed
- **Mobile-first** — OpenGL ES 3.0 renderer, distance fog, vertex colors

## See Also

- [GAME_PLAN.md](GAME_PLAN.md) — Full development plan with architecture details

## License

Apache 2.0
