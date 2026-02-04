class_name Chunk
extends MeshInstance3D
## A single 16x16x16 voxel chunk with greedy meshing.

var chunk_x: int
var chunk_y: int
var chunk_z: int
var voxels := PackedByteArray()
var is_dirty := true
var _collision_body: StaticBody3D
var _collision_shape: CollisionShape3D

# Face directions: +X, -X, +Y, -Y, +Z, -Z
const FACE_NORMALS := [
	Vector3i(1, 0, 0), Vector3i(-1, 0, 0),
	Vector3i(0, 1, 0), Vector3i(0, -1, 0),
	Vector3i(0, 0, 1), Vector3i(0, 0, -1),
]

# Vertices for each face direction (as quads)
const FACE_VERTICES := [
	# +X
	[Vector3(1,0,0), Vector3(1,1,0), Vector3(1,1,1), Vector3(1,0,1)],
	# -X
	[Vector3(0,0,1), Vector3(0,1,1), Vector3(0,1,0), Vector3(0,0,0)],
	# +Y
	[Vector3(0,1,1), Vector3(1,1,1), Vector3(1,1,0), Vector3(0,1,0)],
	# -Y
	[Vector3(0,0,0), Vector3(1,0,0), Vector3(1,0,1), Vector3(0,0,1)],
	# +Z
	[Vector3(1,0,1), Vector3(1,1,1), Vector3(0,1,1), Vector3(0,0,1)],
	# -Z
	[Vector3(0,0,0), Vector3(0,1,0), Vector3(1,1,0), Vector3(1,0,0)],
]


func _init() -> void:
	voxels.resize(Constants.CHUNK_VOLUME)
	voxels.fill(Constants.Block.AIR)


func set_voxel(x: int, y: int, z: int, block: int) -> void:
	if x < 0 or x >= Constants.CHUNK_SIZE: return
	if y < 0 or y >= Constants.CHUNK_SIZE: return
	if z < 0 or z >= Constants.CHUNK_SIZE: return
	voxels[x + y * Constants.CHUNK_SIZE + z * Constants.CHUNK_SIZE * Constants.CHUNK_SIZE] = block
	is_dirty = true


func get_voxel(x: int, y: int, z: int) -> int:
	if x < 0 or x >= Constants.CHUNK_SIZE: return Constants.Block.AIR
	if y < 0 or y >= Constants.CHUNK_SIZE: return Constants.Block.AIR
	if z < 0 or z >= Constants.CHUNK_SIZE: return Constants.Block.AIR
	return voxels[x + y * Constants.CHUNK_SIZE + z * Constants.CHUNK_SIZE * Constants.CHUNK_SIZE]


func is_block_solid(x: int, y: int, z: int) -> bool:
	var block := get_voxel(x, y, z)
	return block != Constants.Block.AIR and block != Constants.Block.WATER


## Greedy meshing — merges adjacent coplanar faces of the same block type
## into larger quads. Reduces triangle count by 80-90%.
func build_mesh(generate_collision: bool) -> void:
	if not is_dirty:
		return

	var surface_tool := SurfaceTool.new()
	surface_tool.begin(Mesh.PRIMITIVE_TRIANGLES)

	var cs := Constants.CHUNK_SIZE

	# Process each of the 6 face directions
	for face_idx in 6:
		var normal := FACE_NORMALS[face_idx]
		var verts := FACE_VERTICES[face_idx]

		# Determine the axis we're slicing along and the two tangent axes
		var axis: int  # 0=X, 1=Y, 2=Z
		var u_axis: int
		var v_axis: int

		if normal.x != 0:
			axis = 0; u_axis = 2; v_axis = 1
		elif normal.y != 0:
			axis = 1; u_axis = 0; v_axis = 2
		else:
			axis = 2; u_axis = 0; v_axis = 1

		# For each slice along the axis
		for d in cs:
			# Build a 2D mask of visible faces for this slice
			var mask: Array[int] = []
			mask.resize(cs * cs)
			mask.fill(0)

			for v in cs:
				for u in cs:
					var pos := Vector3i.ZERO
					pos[axis] = d
					pos[u_axis] = u
					pos[v_axis] = v

					var block := get_voxel(pos.x, pos.y, pos.z)
					if block == Constants.Block.AIR:
						continue

					# Check if neighbor in face direction is air/transparent
					var nx := pos.x + normal.x
					var ny := pos.y + normal.y
					var nz := pos.z + normal.z

					var neighbor_solid := false
					if nx >= 0 and nx < cs and ny >= 0 and ny < cs and nz >= 0 and nz < cs:
						neighbor_solid = is_block_solid(nx, ny, nz)
					# If neighbor is outside chunk, treat as air (show face)

					if not neighbor_solid:
						mask[u + v * cs] = block

			# Greedy merge the mask into rectangles
			var visited: Array[bool] = []
			visited.resize(cs * cs)
			visited.fill(false)

			for v in cs:
				for u in cs:
					var idx := u + v * cs
					if visited[idx] or mask[idx] == 0:
						continue

					var block_type := mask[idx]

					# Extend width
					var w := 1
					while u + w < cs:
						var next_idx := (u + w) + v * cs
						if mask[next_idx] != block_type or visited[next_idx]:
							break
						w += 1

					# Extend height
					var h := 1
					var can_extend := true
					while v + h < cs and can_extend:
						for du in w:
							var check_idx := (u + du) + (v + h) * cs
							if mask[check_idx] != block_type or visited[check_idx]:
								can_extend = false
								break
						if can_extend:
							h += 1

					# Mark visited
					for dv in h:
						for du in w:
							visited[(u + du) + (v + dv) * cs] = true

					# Emit quad
					var color: Color = Constants.BLOCK_COLORS.get(block_type, Color.MAGENTA)
					surface_tool.set_color(color)

					var normal_vec := Vector3(normal.x, normal.y, normal.z)
					surface_tool.set_normal(normal_vec)

					# Calculate quad corners
					var base := Vector3i.ZERO
					base[axis] = d
					base[u_axis] = u
					base[v_axis] = v

					# Offset in face direction for positive faces
					var offset := Vector3.ZERO
					if normal[axis] > 0:
						offset[axis] = 1.0

					var du_vec := Vector3.ZERO
					du_vec[u_axis] = float(w)
					var dv_vec := Vector3.ZERO
					dv_vec[v_axis] = float(h)

					var origin := Vector3(base.x, base.y, base.z) + offset

					# Two triangles for the quad
					var v0 := origin
					var v1 := origin + dv_vec
					var v2 := origin + du_vec + dv_vec
					var v3 := origin + du_vec

					# Winding order depends on face direction
					if normal[axis] > 0:
						surface_tool.add_vertex(v0)
						surface_tool.add_vertex(v1)
						surface_tool.add_vertex(v2)
						surface_tool.add_vertex(v0)
						surface_tool.add_vertex(v2)
						surface_tool.add_vertex(v3)
					else:
						surface_tool.add_vertex(v0)
						surface_tool.add_vertex(v2)
						surface_tool.add_vertex(v1)
						surface_tool.add_vertex(v0)
						surface_tool.add_vertex(v3)
						surface_tool.add_vertex(v2)

	surface_tool.generate_normals()
	var new_mesh := surface_tool.commit()
	self.mesh = new_mesh

	# Collision for nearby chunks
	if generate_collision and new_mesh and new_mesh.get_surface_count() > 0:
		if _collision_body:
			_collision_body.queue_free()
		_collision_body = StaticBody3D.new()
		_collision_shape = CollisionShape3D.new()
		_collision_shape.shape = new_mesh.create_trimesh_shape()
		_collision_body.add_child(_collision_shape)
		add_child(_collision_body)
	elif _collision_body:
		_collision_body.queue_free()
		_collision_body = null

	is_dirty = false
