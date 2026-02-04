extends Node
## Global constants and settings for the game.

# --- Chunk ---
const CHUNK_SIZE := 16
const CHUNK_VOLUME := CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE

# --- World ---
const RENDER_DISTANCE := 8        # chunks horizontally
const VERTICAL_CHUNKS := 4        # chunks vertically
const WORLD_HEIGHT := CHUNK_SIZE * VERTICAL_CHUNKS  # 64 voxels tall
const SEA_LEVEL := 20
const CHUNKS_PER_FRAME := 2       # max chunks to mesh per frame

# --- Block types ---
enum Block {
	AIR = 0,
	GRASS = 1,
	DIRT = 2,
	STONE = 3,
	SAND = 4,
	WATER = 5,
	WOOD = 6,
	LEAVES = 7,
	SNOW = 8,
	GRAVEL = 9,
	SANDSTONE = 10,
	BEDROCK = 11,
}

# Block colors (used until we have a texture atlas)
const BLOCK_COLORS := {
	Block.GRASS: Color(0.36, 0.68, 0.25),
	Block.DIRT: Color(0.55, 0.37, 0.24),
	Block.STONE: Color(0.5, 0.5, 0.5),
	Block.SAND: Color(0.87, 0.82, 0.60),
	Block.WATER: Color(0.2, 0.4, 0.8, 0.7),
	Block.WOOD: Color(0.44, 0.30, 0.15),
	Block.LEAVES: Color(0.18, 0.55, 0.18),
	Block.SNOW: Color(0.95, 0.95, 0.97),
	Block.GRAVEL: Color(0.6, 0.58, 0.55),
	Block.SANDSTONE: Color(0.82, 0.75, 0.52),
	Block.BEDROCK: Color(0.2, 0.2, 0.2),
}

# Which blocks are transparent / non-solid
const TRANSPARENT_BLOCKS := [Block.AIR, Block.WATER]

# --- Drone physics ---
const DRONE_MASS := 0.5            # kg
const MAX_THRUST := 15.0           # Newtons (about 3:1 thrust ratio)
const DRAG_COEFFICIENT := 0.3
const ANGULAR_DRAG := 4.0
const MAX_ROLL_RATE := 600.0       # degrees/sec
const MAX_PITCH_RATE := 600.0
const MAX_YAW_RATE := 400.0

# --- Flight modes ---
enum FlightMode { ACRO, ANGLE, HORIZON }
const ANGLE_MODE_MAX_TILT := 45.0  # degrees
const HORIZON_TRANSITION := 0.7    # stick threshold for acro behavior

# --- Camera ---
const FPV_FOV := 110.0
const FPV_TILT := 25.0             # degrees forward tilt

# --- Rendering ---
const FOG_START := 80.0
const FOG_END := 120.0
const FOG_COLOR := Color(0.53, 0.81, 0.92)
