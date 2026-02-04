class_name WorldManager
extends Node3D
## Manages chunk loading, unloading, and generation around the player.

var _chunks: Dictionary = {}  # Vector3i → Chunk
var _terrain_gen: TerrainGenerator
var _generation_queue: Array[Vector3i] = []
var _player_chunk := Vector3i.ZERO
var _chunk_material: StandardMaterial3D

@export var world_seed: int = 42


func _ready() -> void:
	_terrain_gen = TerrainGenerator.new(world_seed)

	# Shared material for all chunks (vertex colors, no texture yet)
	_chunk_material = StandardMaterial3D.new()
	_chunk_material.vertex_color_use_as_albedo = true
	_chunk_material.shading_mode = BaseMaterial3D.SHADING_MODE_PER_VERTEX


## Called by main scene each frame with the player's world position.
func update_around(player_pos: Vector3) -> void:
	var cs := Constants.CHUNK_SIZE
	var new_chunk := Vector3i(
		floori(player_pos.x / cs),
		0,  # we handle Y separately
		floori(player_pos.z / cs)
	)

	if new_chunk != _player_chunk or _chunks.is_empty():
		_player_chunk = new_chunk
		_queue_needed_chunks()
		_unload_distant_chunks()

	_process_generation_queue()


func _queue_needed_chunks() -> void:
	var rd := Constants.RENDER_DISTANCE
	var vc := Constants.VERTICAL_CHUNKS

	var needed: Array[Vector3i] = []

	for cx in range(_player_chunk.x - rd, _player_chunk.x + rd + 1):
		for cz in range(_player_chunk.z - rd, _player_chunk.z + rd + 1):
			# Circular distance check
			var dx := cx - _player_chunk.x
			var dz := cz - _player_chunk.z
			if dx * dx + dz * dz > rd * rd:
				continue
			for cy in vc:
				var key := Vector3i(cx, cy, cz)
				if not _chunks.has(key) and key not in _generation_queue:
					needed.append(key)

	# Sort by distance to player (closest first)
	needed.sort_custom(func(a: Vector3i, b: Vector3i) -> bool:
		var da := (a - _player_chunk).length_squared()
		var db := (b - _player_chunk).length_squared()
		return da < db
	)

	_generation_queue.append_array(needed)


func _unload_distant_chunks() -> void:
	var rd := Constants.RENDER_DISTANCE + 2  # buffer
	var to_remove: Array[Vector3i] = []

	for key in _chunks:
		var dx := key.x - _player_chunk.x
		var dz := key.z - _player_chunk.z
		if dx * dx + dz * dz > rd * rd:
			to_remove.append(key)

	for key in to_remove:
		var chunk: Chunk = _chunks[key]
		chunk.queue_free()
		_chunks.erase(key)

	# Also remove from generation queue
	_generation_queue = _generation_queue.filter(func(key: Vector3i) -> bool:
		var dx := key.x - _player_chunk.x
		var dz := key.z - _player_chunk.z
		return dx * dx + dz * dz <= rd * rd
	)


func _process_generation_queue() -> void:
	var budget := Constants.CHUNKS_PER_FRAME

	for _i in budget:
		if _generation_queue.is_empty():
			break

		var key := _generation_queue.pop_front()
		if _chunks.has(key):
			continue

		var chunk := Chunk.new()
		chunk.chunk_x = key.x
		chunk.chunk_y = key.y
		chunk.chunk_z = key.z

		# Generate terrain
		_terrain_gen.generate_chunk(chunk)

		# Build mesh (collision only for nearby chunks)
		var dist_sq := (key - _player_chunk).length_squared()
		var generate_collision := dist_sq < 9  # within 3 chunks
		chunk.build_mesh(generate_collision)

		# Set material and position
		chunk.material_override = _chunk_material
		chunk.position = Vector3(
			key.x * Constants.CHUNK_SIZE,
			key.y * Constants.CHUNK_SIZE,
			key.z * Constants.CHUNK_SIZE
		)

		add_child(chunk)
		_chunks[key] = chunk


## Get the height of the terrain at a world XZ position (for spawn placement).
func get_height_at(world_x: float, world_z: float) -> float:
	var cs := Constants.CHUNK_SIZE
	var cx := floori(world_x / cs)
	var cz := floori(world_z / cs)

	# Search from top chunk downward
	for cy in range(Constants.VERTICAL_CHUNKS - 1, -1, -1):
		var key := Vector3i(cx, cy, cz)
		if not _chunks.has(key):
			continue
		var chunk: Chunk = _chunks[key]
		var lx := int(world_x) % cs
		var lz := int(world_z) % cs
		if lx < 0: lx += cs
		if lz < 0: lz += cs
		for ly in range(cs - 1, -1, -1):
			if chunk.get_voxel(lx, ly, lz) != Constants.Block.AIR:
				return float(cy * cs + ly + 1)

	return float(Constants.SEA_LEVEL)
