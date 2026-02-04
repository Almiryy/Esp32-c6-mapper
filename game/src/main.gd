extends Node3D
## Main game entry point. Sets up world, drone, UI, and game loop.

var _world: WorldManager
var _drone: DroneController
var _camera: DroneCamera
var _audio: DroneAudio
var _osd: DroneOSD
var _touch: TouchControls
var _ui_layer: CanvasLayer
var _environment: WorldEnvironment
var _sun: DirectionalLight3D
var _paused := false


func _ready() -> void:
	_setup_environment()
	_setup_world()
	_setup_drone()
	_setup_ui()

	# Initial spawn after a short delay (let chunks generate)
	await get_tree().create_timer(0.1).timeout
	_spawn_drone()


func _setup_environment() -> void:
	# Sky
	var sky_material := ShaderMaterial.new()
	sky_material.shader = preload("res://assets/shaders/sky.gdshader")

	var sky := Sky.new()
	sky.sky_material = sky_material

	var env := Environment.new()
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_sky_contribution = 0.5
	env.ambient_light_energy = 0.8
	env.tonemap_mode = Environment.TONE_MAP_ACES
	# Fog matches sky horizon
	env.fog_enabled = true
	env.fog_light_color = Constants.FOG_COLOR
	env.fog_density = 0.003
	env.fog_sky_affect = 0.5

	_environment = WorldEnvironment.new()
	_environment.environment = env
	add_child(_environment)

	# Sun
	_sun = DirectionalLight3D.new()
	_sun.rotation_degrees = Vector3(-45, 30, 0)
	_sun.light_energy = 1.2
	_sun.shadow_enabled = false  # disabled for mobile performance
	add_child(_sun)


func _setup_world() -> void:
	_world = WorldManager.new()
	_world.world_seed = randi()  # random seed each run
	add_child(_world)


func _setup_drone() -> void:
	_drone = DroneController.new()
	_drone.add_to_group("drone")

	# Collision shape (small box for the drone)
	var collision := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(0.3, 0.1, 0.3)
	collision.shape = box
	_drone.add_child(collision)

	# FPV Camera
	_camera = DroneCamera.new()
	_drone.add_child(_camera)

	# Audio
	_audio = DroneAudio.new()
	_drone.add_child(_audio)

	# Simple visual mesh for the drone body
	var drone_mesh := MeshInstance3D.new()
	var box_mesh := BoxMesh.new()
	box_mesh.size = Vector3(0.3, 0.06, 0.3)
	drone_mesh.mesh = box_mesh
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.15, 0.15, 0.15)
	drone_mesh.material_override = mat
	_drone.add_child(drone_mesh)

	# Prop visuals (4 small cylinders)
	var prop_positions := [
		Vector3(0.12, 0.04, 0.12),
		Vector3(-0.12, 0.04, 0.12),
		Vector3(0.12, 0.04, -0.12),
		Vector3(-0.12, 0.04, -0.12),
	]
	for pos in prop_positions:
		var prop := MeshInstance3D.new()
		var cyl := CylinderMesh.new()
		cyl.top_radius = 0.06
		cyl.bottom_radius = 0.06
		cyl.height = 0.01
		prop.mesh = cyl
		prop.position = pos
		var prop_mat := StandardMaterial3D.new()
		prop_mat.albedo_color = Color(0.3, 0.3, 0.3)
		prop.material_override = prop_mat
		_drone.add_child(prop)

	add_child(_drone)

	# Connect signals
	_drone.crashed.connect(_on_drone_crashed)


func _setup_ui() -> void:
	_ui_layer = CanvasLayer.new()
	add_child(_ui_layer)

	# OSD (heads-up display)
	_osd = DroneOSD.new()
	_osd.set_drone(_drone)
	_ui_layer.add_child(_osd)

	# Touch controls
	_touch = TouchControls.new()
	_ui_layer.add_child(_touch)


func _spawn_drone() -> void:
	var spawn_x := 0.0
	var spawn_z := 0.0
	var height := _world.get_height_at(spawn_x, spawn_z)
	_drone.spawn_at(Vector3(spawn_x, height + 5.0, spawn_z))


func _process(_delta: float) -> void:
	# Feed input to drone
	_drone.throttle_input = InputManager.throttle
	_drone.yaw_input = InputManager.yaw
	_drone.pitch_input = InputManager.pitch
	_drone.roll_input = InputManager.roll

	# Update world chunks around drone
	_world.update_around(_drone.global_position)

	# Update audio
	_audio.update_from_drone(
		InputManager.throttle,
		_drone.speed,
		_drone.is_armed
	)


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("fly_arm"):
		_drone.toggle_arm()
	elif event.is_action_pressed("fly_mode_switch"):
		_drone.cycle_flight_mode()
	elif event.is_action_pressed("pause"):
		_toggle_pause()


func _toggle_pause() -> void:
	_paused = not _paused
	get_tree().paused = _paused


func _on_drone_crashed() -> void:
	# Could show crash screen or effect
	pass
