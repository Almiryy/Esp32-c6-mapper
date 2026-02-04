# FPV Drone Game — Development Plan

## 1. Vision

A **first-person-view (FPV) drone flying game** with **procedurally generated voxel worlds** (Minecraft-style infinite terrain). The player flies through the world using real FPV drone controllers (or on-screen touch controls as fallback). Runs on **Android/iOS phones** with a focus on performance and battery efficiency.

---

## 2. Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| **Engine** | **Godot 4.3+** (GDScript + GDExtension/C++ for hot paths) | Open-source, lightweight (~40 MB export), first-class mobile support, built-in Vulkan & OpenGL ES 3.0 renderers, active community |
| **Language** | GDScript (gameplay) + C++ via GDExtension (terrain gen, meshing, physics) | GDScript for fast iteration; C++ for performance-critical voxel operations |
| **Noise library** | FastNoiseLite (bundled in Godot) | Zero-dependency procedural noise for terrain |
| **Input** | Godot Input system + custom FPV controller mapping | Supports Bluetooth/USB gamepads natively; ELRS controllers via USB joystick mode |
| **Target platforms** | Android (primary), iOS (secondary) | Godot exports to both from one codebase |

### Why Godot over Unity/Unreal

- **Export size**: ~40 MB vs 100+ MB — critical for mobile
- **No licensing fees or runtime splash screens**
- **Vulkan + OpenGL ES 3.0 fallback** — works on low-end phones
- **GDExtension** allows C++ performance without engine forks
- **Open source** — can patch engine bugs directly

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   Game Scene                     │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  Drone   │  │  World   │  │   UI / HUD    │  │
│  │ Control  │  │ Manager  │  │               │  │
│  └────┬─────┘  └────┬─────┘  └───────────────┘  │
│       │              │                           │
│       ▼              ▼                           │
│  ┌──────────┐  ┌──────────────┐                  │
│  │  Physics  │  │ Chunk System │                  │
│  │  (Rigid   │  │  (C++ Ext)   │                  │
│  │   Body)   │  │              │                  │
│  └──────────┘  ├──────────────┤                  │
│                │ Terrain Gen  │                  │
│                │ Mesher       │                  │
│                │ LOD Manager  │                  │
│                └──────────────┘                  │
└─────────────────────────────────────────────────┘
```

---

## 4. Core Systems — Detailed Breakdown

### 4.1 Procedural World Generation

#### Chunk System
- **Chunk size**: 16×16×16 voxels (sweet spot for mobile memory/draw calls)
- **Render distance**: 8–12 chunks horizontal, 4 chunks vertical (adjustable in settings)
- **Storage**: Flat `PackedByteArray` per chunk (4096 bytes for 16³) — cache-friendly
- **Chunk states**: `Unloaded → Generating → Meshing → Ready → Queued for Unload`

#### Terrain Generation Pipeline
```
1. Player position → determine needed chunks
2. Priority queue (closest chunks first)
3. Generate voxel data (worker thread)
   - Base heightmap: 2D Simplex noise (octaves: 4, lacunarity: 2.0)
   - Caves: 3D Simplex worm noise (threshold carving)
   - Biomes: Voronoi cells → temperature/moisture → block palette
   - Structures: Trees, rocks placed via seeded RNG after terrain pass
4. Build mesh (worker thread)
   - Greedy meshing algorithm (reduces triangles by 80-90%)
   - Generate collision trimesh for nearby chunks only
5. Upload mesh to main thread → add to scene
```

#### Biome System
| Biome | Noise Range | Block Types | Features |
|---|---|---|---|
| Plains | temp > 0.3, moist < 0.5 | Grass, Dirt, Stone | Tall grass, flowers |
| Forest | temp > 0.3, moist > 0.5 | Grass, Dirt, Wood, Leaves | Dense trees |
| Desert | temp > 0.7, moist < 0.3 | Sand, Sandstone | Cacti, dead bushes |
| Mountains | height > 80 | Stone, Snow, Gravel | Cliff faces, peaks |
| Caves | 3D noise > threshold | Stone, Ores, Air | Stalactites, crystals |

#### Chunk Data Format (C++ GDExtension)
```cpp
struct Chunk {
    int32_t x, z, y;              // chunk coordinates
    uint8_t voxels[16*16*16];     // block type per voxel
    uint8_t light[16*16*16];      // light levels (4-bit sun + 4-bit block)
    bool dirty = true;            // needs remesh
    MeshInstance3D* mesh = nullptr;
};
```

### 4.2 Greedy Meshing (Critical for Mobile Performance)

Standard naive meshing: **~24 triangles per visible voxel** → unusable on mobile.
Greedy meshing: **merges adjacent same-type faces into quads** → 80-90% fewer triangles.

```
Algorithm (per chunk, per face direction):
1. For each slice perpendicular to face direction:
2.   Build 2D mask of visible faces (face exists & neighbor is air/transparent)
3.   Sweep mask with greedy rectangles:
      - Find first unvisited face
      - Extend width while same block type
      - Extend height while entire row matches
      - Emit one quad for the rectangle
      - Mark rectangle cells as visited
```

**Implementation**: C++ GDExtension — this runs on worker threads and is the single most performance-critical function.

### 4.3 Drone Flight Physics

#### Physics Model
```
Forces acting on drone:
  Gravity:    F_g = mass * 9.81 * down
  Thrust:     F_t = throttle * max_thrust * drone_up_vector
  Drag:       F_d = -0.5 * drag_coeff * velocity² * velocity_normalized
  Angular:    Torque from roll/pitch/yaw inputs
```

#### Flight Modes
| Mode | Description | Target Audience |
|---|---|---|
| **Acro** | Full manual, rate-based control (real FPV) | Experienced pilots |
| **Angle** | Self-leveling, angle-limited | Beginners |
| **Horizon** | Hybrid: self-levels at center, acro at extremes | Intermediate |

#### Drone Node Structure
```
DroneRoot (RigidBody3D)
├── CollisionShape3D (box)
├── Camera3D (tilted forward, FPV view)
├── AudioStreamPlayer3D (motor sounds)
├── GPUParticles3D (propwash / dust)
├── 4x PropellerMesh (visual spin)
└── OSD_Viewport (on-screen display overlay)
```

#### Camera
- **FOV**: 120° (authentic FPV wide-angle)
- **Tilt**: 0°–45° adjustable (typical FPV cam tilt)
- **Post-processing**: Optional barrel distortion shader for realism

### 4.4 FPV Controller Input

#### Supported Controllers
1. **Bluetooth gamepads** — Direct Android/iOS pairing (Xbox, PS, generic)
2. **USB OTG gamepads** — Android wired connection
3. **FPV Radio as gamepad** — RadioMaster/TBS/ELRS controllers in joystick mode over USB
4. **Touch controls** (fallback) — On-screen dual sticks

#### Stick Mapping (Mode 2 — FPV Standard)
```
Left Stick:                Right Stick:
  ↑ Throttle                 ↑ Pitch (forward)
  ↓ Throttle down            ↓ Pitch (back)
  ← Yaw left                 ← Roll left
  → Yaw right                → Roll right
```

#### Input Processing
```gdscript
# Deadzone, expo curve, and rate applied to raw stick input
func process_stick(raw: float, deadzone: float, expo: float, rate: float) -> float:
    var input = sign(raw) * max(0.0, abs(raw) - deadzone) / (1.0 - deadzone)
    var curved = input * (1.0 - expo + expo * input * input)  # expo curve
    return curved * rate
```

### 4.5 Rendering & Mobile Optimization

#### Rendering Pipeline
- **Vulkan** on capable devices, **OpenGL ES 3.0** fallback
- **Chunk LOD**: Full mesh (< 4 chunks), simplified mesh (4-8), billboard impostor (8-12)
- **Frustum culling**: Only render chunks in camera view (Godot built-in)
- **Occlusion culling**: Skip chunks fully behind terrain (GPU-based when available)

#### Performance Budgets
| Metric | Target | Strategy |
|---|---|---|
| **FPS** | 60 fps (30 fps floor on low-end) | LOD, greedy meshing, chunk budget |
| **Draw calls** | < 100 per frame | Greedy meshing, material atlas |
| **Triangles** | < 200K per frame | LOD, render distance scaling |
| **RAM** | < 300 MB | Chunk pool recycling, compressed voxel data |
| **APK size** | < 80 MB | Texture atlas, procedural content |
| **Battery** | > 2 hours play time | Frame pacing, sleep idle threads |

#### Texture Atlas
- Single 256×256 or 512×512 texture atlas for all block types
- 16×16 pixel tiles per block face
- **One material for all terrain** → 1 draw call per chunk
- Nearest-neighbor filtering (pixel art style, zero blurring)

#### Shader Optimizations
```glsl
// Simple fog shader — hides chunk pop-in, cheap on GPU
void fragment() {
    float dist = length(VERTEX);
    float fog = smoothstep(fog_start, fog_end, dist);
    ALBEDO = mix(ALBEDO, fog_color, fog);
}
```

### 4.6 Threading Model

```
Main Thread:
  - Scene tree updates
  - Input polling
  - Mesh uploads to GPU
  - UI rendering

Worker Thread Pool (2-4 threads):
  - Chunk terrain generation
  - Greedy meshing
  - Collision shape generation

Audio Thread (Godot managed):
  - Motor sound mixing
```

- Use Godot's `WorkerThreadPool` for chunk operations
- Max 1-2 chunks meshed per frame to avoid main thread stalls
- Priority: chunks closest to player are generated/meshed first

### 4.7 Audio

| Sound | Implementation |
|---|---|
| **Motor whine** | Procedural: base sine wave + harmonics, pitch = f(RPM) |
| **Wind** | Noise generator, volume = f(speed) |
| **Crash impact** | Preloaded samples, varied by impact force |
| **Propwash** | Filtered noise near surfaces |

- Use `AudioStreamGenerator` for real-time motor synthesis
- Spatial audio (3D) for environmental sounds
- Keep total audio streams < 8 for mobile performance

### 4.8 HUD / OSD (On-Screen Display)

Authentic FPV OSD overlay showing:
```
┌──────────────────────────────┐
│ 14.8V ▆▆▆▆▅   00:03:42  GPS │
│                              │
│         [ + ]                │
│                              │
│  ALT 47m    SPD 23m/s        │
│  THR 62%    RSSI ████▌       │
└──────────────────────────────┘
```

- Battery voltage / percentage
- Flight timer
- Altitude (from terrain)
- Speed
- Throttle percentage
- Signal strength (cosmetic or real if using ESP32 bridge)

---

## 5. Project Structure

```
Esp32-c6-mapper/
├── game/                          # Godot project root
│   ├── project.godot              # Godot project config
│   ├── export_presets.cfg         # Android/iOS export settings
│   │
│   ├── src/                       # GDScript source
│   │   ├── drone/
│   │   │   ├── drone_controller.gd    # Flight physics & input
│   │   │   ├── drone_camera.gd        # FPV camera control
│   │   │   ├── drone_audio.gd         # Motor sound synthesis
│   │   │   └── drone_osd.gd           # HUD overlay
│   │   │
│   │   ├── world/
│   │   │   ├── world_manager.gd       # Chunk loading orchestrator
│   │   │   ├── chunk_manager.gd       # Chunk lifecycle & pooling
│   │   │   └── biome_manager.gd       # Biome selection & config
│   │   │
│   │   ├── input/
│   │   │   ├── input_manager.gd       # Controller detection & mapping
│   │   │   ├── stick_processor.gd     # Deadzone, expo, rates
│   │   │   └── touch_controls.gd      # On-screen sticks fallback
│   │   │
│   │   ├── ui/
│   │   │   ├── main_menu.gd
│   │   │   ├── settings_menu.gd
│   │   │   └── pause_menu.gd
│   │   │
│   │   └── util/
│   │       ├── object_pool.gd         # Generic object pooling
│   │       └── constants.gd           # Game-wide constants
│   │
│   ├── native/                    # C++ GDExtension (performance)
│   │   ├── src/
│   │   │   ├── chunk_generator.cpp    # Noise-based terrain gen
│   │   │   ├── chunk_generator.h
│   │   │   ├── greedy_mesher.cpp      # Greedy meshing algorithm
│   │   │   ├── greedy_mesher.h
│   │   │   ├── chunk_data.cpp         # Voxel data container
│   │   │   ├── chunk_data.h
│   │   │   └── register_types.cpp     # GDExtension entry point
│   │   ├── SConstruct                 # Build config
│   │   └── fpv_voxel.gdextension      # Extension descriptor
│   │
│   ├── scenes/
│   │   ├── main.tscn                  # Root scene
│   │   ├── drone.tscn                 # Drone prefab
│   │   ├── chunk.tscn                 # Chunk prefab
│   │   └── ui/
│   │       ├── main_menu.tscn
│   │       ├── hud.tscn
│   │       └── touch_sticks.tscn
│   │
│   ├── assets/
│   │   ├── textures/
│   │   │   ├── block_atlas.png        # All block textures in one atlas
│   │   │   └── ui/
│   │   ├── audio/
│   │   │   └── sfx/
│   │   ├── shaders/
│   │   │   ├── terrain.gdshader       # Block rendering + fog
│   │   │   ├── sky.gdshader           # Procedural sky
│   │   │   └── fpv_lens.gdshader      # Optional barrel distortion
│   │   └── fonts/
│   │       └── osd_mono.ttf           # Monospace font for OSD
│   │
│   └── addons/                    # Third-party if needed
│
├── GAME_PLAN.md                   # This file
├── README.md
└── LICENSE
```

---

## 6. Development Phases

### Phase 1 — Core Foundation (MVP)
- [ ] Set up Godot 4.3 project with Android export
- [ ] Implement flat chunk generation (no noise yet, just flat grass)
- [ ] Greedy meshing in GDScript first (prototype)
- [ ] Basic drone with RigidBody3D + thrust/gravity
- [ ] Camera attached to drone (FPV view)
- [ ] Touch controls (on-screen sticks)
- [ ] Chunk loading/unloading around player

**Deliverable**: Fly a drone over a flat voxel world on Android

### Phase 2 — Terrain & Performance
- [ ] Port meshing + generation to C++ GDExtension
- [ ] Add noise-based terrain (heightmap + caves)
- [ ] Biome system (plains, forest, desert, mountains)
- [ ] Threaded chunk generation
- [ ] LOD system (3 levels)
- [ ] Texture atlas with block types
- [ ] Distance fog shader

**Deliverable**: Fly through interesting procedural terrain at 60 fps

### Phase 3 — Flight Polish
- [ ] Acro / Angle / Horizon flight modes
- [ ] Expo curves, rates, deadzone settings
- [ ] Bluetooth/USB gamepad support
- [ ] Motor sound synthesis
- [ ] OSD / HUD overlay
- [ ] Crash detection + respawn
- [ ] Propwash particle effects

**Deliverable**: Authentic FPV flying experience with controller support

### Phase 4 — Game Features & Polish
- [ ] Objectives: races (ring gates), exploration challenges
- [ ] Procedural race track generation
- [ ] Time trials with leaderboards (local)
- [ ] Day/night cycle with dynamic lighting
- [ ] Settings: render distance, graphics quality, controls
- [ ] Tutorial / first-time-user flow
- [ ] Save/load world seeds

**Deliverable**: Complete game ready for Play Store / TestFlight

---

## 7. Performance Best Practices

### Memory
- **Object pooling** for chunks — never allocate/free at runtime
- **Chunk data recycling** — reuse `PackedByteArray` buffers
- Limit loaded chunks to `render_distance² × vertical_chunks`
- Free collision shapes for distant chunks

### CPU
- **Greedy meshing in C++** — 10-50x faster than GDScript
- **Worker threads** — never block main thread for generation
- **Budget per frame**: max 1 chunk mesh upload, max 2ms generation work
- **Spatial hashing** for chunk lookups — O(1) instead of search

### GPU
- **Single texture atlas** — 1 draw call per chunk
- **LOD** — reduce triangle count with distance
- **Fog** — hide chunk loading boundary
- **Disable shadows** on mobile (or simple blob shadows)
- **Half-resolution particles** for effects

### Battery
- **Cap FPS** to 60 (no unlimited)
- **Reduce work when paused** — drop to 10 fps on pause menu
- **Adaptive quality** — detect thermal throttling, reduce render distance

---

## 8. Key Technical Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Greedy meshing too slow in GDScript | Unplayable FPS | Start GDScript, port to C++ GDExtension in Phase 2 |
| Too many draw calls on mobile | Low FPS, heat | Single atlas material, frustum culling, strict chunk budget |
| USB gamepad latency | Poor flight feel | Test with ELRS controllers in USB joystick mode, minimize input processing |
| Memory pressure on low-end phones | Crashes | Chunk pooling, adaptive render distance, test on 2GB RAM devices |
| Godot mobile export bugs | Broken builds | Use stable Godot release, test early & often on real devices |

---

## 9. Testing Strategy

- **Unit tests**: Noise output consistency, meshing correctness (GdUnit4)
- **Performance profiling**: Godot built-in profiler + Android GPU profiler
- **Device testing matrix**: Low-end (2GB RAM, Mali GPU), Mid-range, High-end
- **Input testing**: Touch, Bluetooth gamepad, USB gamepad (ELRS)
- **Automated builds**: GitHub Actions with Godot headless export

---

## 10. Dependencies & Tools

| Tool | Purpose |
|---|---|
| Godot 4.3+ | Game engine |
| SCons | C++ GDExtension build |
| Android SDK/NDK | Mobile export |
| GdUnit4 | GDScript unit testing |
| GitHub Actions | CI/CD pipeline |
| ADB | Android device debugging |
