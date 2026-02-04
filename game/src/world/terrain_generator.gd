class_name TerrainGenerator
extends RefCounted
## Generates voxel terrain using layered noise.

var _height_noise: FastNoiseLite
var _cave_noise: FastNoiseLite
var _biome_temp_noise: FastNoiseLite
var _biome_moist_noise: FastNoiseLite
var _tree_rng: RandomNumberGenerator
var _world_seed: int


func _init(seed_value: int = 0) -> void:
	_world_seed = seed_value

	# Base heightmap noise
	_height_noise = FastNoiseLite.new()
	_height_noise.seed = seed_value
	_height_noise.noise_type = FastNoiseLite.TYPE_SIMPLEX
	_height_noise.fractal_type = FastNoiseLite.FRACTAL_FBM
	_height_noise.fractal_octaves = 4
	_height_noise.fractal_lacunarity = 2.0
	_height_noise.fractal_gain = 0.5
	_height_noise.frequency = 0.008

	# 3D cave noise
	_cave_noise = FastNoiseLite.new()
	_cave_noise.seed = seed_value + 1000
	_cave_noise.noise_type = FastNoiseLite.TYPE_SIMPLEX
	_cave_noise.fractal_type = FastNoiseLite.FRACTAL_FBM
	_cave_noise.fractal_octaves = 3
	_cave_noise.frequency = 0.03

	# Biome temperature
	_biome_temp_noise = FastNoiseLite.new()
	_biome_temp_noise.seed = seed_value + 2000
	_biome_temp_noise.noise_type = FastNoiseLite.TYPE_SIMPLEX
	_biome_temp_noise.frequency = 0.003

	# Biome moisture
	_biome_moist_noise = FastNoiseLite.new()
	_biome_moist_noise.seed = seed_value + 3000
	_biome_moist_noise.noise_type = FastNoiseLite.TYPE_SIMPLEX
	_biome_moist_noise.frequency = 0.004

	# Tree placement RNG
	_tree_rng = RandomNumberGenerator.new()


## Fill a chunk's voxel data based on its world position.
func generate_chunk(chunk: Chunk) -> void:
	var cs := Constants.CHUNK_SIZE
	var world_x := chunk.chunk_x * cs
	var world_y := chunk.chunk_y * cs
	var world_z := chunk.chunk_z * cs

	for lz in cs:
		for lx in cs:
			var gx := world_x + lx
			var gz := world_z + lz

			# Sample terrain height (normalized 0..1 → world height)
			var h_raw := _height_noise.get_noise_2d(gx, gz)
			var height := int((h_raw + 1.0) * 0.5 * Constants.WORLD_HEIGHT * 0.7) + 8

			# Sample biome
			var temp := (_biome_temp_noise.get_noise_2d(gx, gz) + 1.0) * 0.5
			var moist := (_biome_moist_noise.get_noise_2d(gx, gz) + 1.0) * 0.5

			for ly in cs:
				var gy := world_y + ly

				if gy > height:
					continue  # air

				# Cave carving
				if gy > 1 and gy < height - 3:
					var cave_val := _cave_noise.get_noise_3d(gx, gy, gz)
					if cave_val > 0.45:
						continue  # carved out

				# Determine block type based on depth and biome
				var block: int
				if gy == 0:
					block = Constants.Block.BEDROCK
				elif gy == height:
					block = _get_surface_block(temp, moist, height)
				elif gy >= height - 3:
					block = _get_subsurface_block(temp, moist)
				else:
					block = Constants.Block.STONE

				chunk.set_voxel(lx, ly, lz, block)

	# Place trees after terrain pass
	_place_trees(chunk, world_x, world_y, world_z)


func _get_surface_block(temp: float, moist: float, height: int) -> int:
	if height > Constants.WORLD_HEIGHT * 0.75:
		return Constants.Block.SNOW
	if temp > 0.65 and moist < 0.35:
		return Constants.Block.SAND
	return Constants.Block.GRASS


func _get_subsurface_block(temp: float, moist: float) -> int:
	if temp > 0.65 and moist < 0.35:
		return Constants.Block.SANDSTONE
	return Constants.Block.DIRT


func _place_trees(chunk: Chunk, world_x: int, world_y: int, world_z: int) -> void:
	var cs := Constants.CHUNK_SIZE

	# Seed RNG based on chunk position for deterministic placement
	_tree_rng.seed = _world_seed + chunk.chunk_x * 73856093 + chunk.chunk_z * 19349663

	var num_trees := _tree_rng.randi_range(0, 3)
	for _i in num_trees:
		var tx := _tree_rng.randi_range(2, cs - 3)
		var tz := _tree_rng.randi_range(2, cs - 3)

		var gx := world_x + tx
		var gz := world_z + tz
		var temp := (_biome_temp_noise.get_noise_2d(gx, gz) + 1.0) * 0.5
		var moist := (_biome_moist_noise.get_noise_2d(gx, gz) + 1.0) * 0.5

		# Only place trees in grassy biomes
		if temp > 0.65 and moist < 0.35:
			continue

		# Find surface height within this chunk
		var surface_y := -1
		for ly in range(cs - 1, -1, -1):
			if chunk.get_voxel(tx, ly, tz) == Constants.Block.GRASS:
				surface_y = ly
				break

		if surface_y < 0 or surface_y + 6 >= cs:
			continue  # no surface found or tree won't fit

		# Trunk (4-5 blocks tall)
		var trunk_h := _tree_rng.randi_range(4, 5)
		for dy in range(1, trunk_h + 1):
			chunk.set_voxel(tx, surface_y + dy, tz, Constants.Block.WOOD)

		# Leaves (sphere around top of trunk)
		var leaf_y := surface_y + trunk_h
		for dy in range(-1, 3):
			var radius := 2 if dy < 2 else 1
			for dx in range(-radius, radius + 1):
				for dz in range(-radius, radius + 1):
					if dx == 0 and dz == 0 and dy < 2:
						continue  # trunk space
					var lx := tx + dx
					var ly := leaf_y + dy
					var lz := tz + dz
					if lx >= 0 and lx < cs and ly >= 0 and ly < cs and lz >= 0 and lz < cs:
						if chunk.get_voxel(lx, ly, lz) == Constants.Block.AIR:
							chunk.set_voxel(lx, ly, lz, Constants.Block.LEAVES)
