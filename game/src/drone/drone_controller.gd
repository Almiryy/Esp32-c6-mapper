class_name DroneController
extends RigidBody3D
## FPV drone flight physics with acro/angle/horizon modes.

signal mode_changed(mode: Constants.FlightMode)
signal crashed()
signal armed_changed(is_armed: bool)

var flight_mode: Constants.FlightMode = Constants.FlightMode.ANGLE
var is_armed := false
var throttle_input := 0.0
var yaw_input := 0.0
var pitch_input := 0.0
var roll_input := 0.0

# Telemetry (read by OSD)
var speed := 0.0
var altitude := 0.0
var throttle_percent := 0.0
var flight_time := 0.0
var battery_voltage := 16.8  # simulated 4S LiPo

var _spawn_pos := Vector3.ZERO
var _crash_cooldown := 0.0


func _ready() -> void:
	mass = Constants.DRONE_MASS
	gravity_scale = 1.0
	linear_damp = 0.0
	angular_damp = Constants.ANGULAR_DRAG
	continuous_cd = true
	contact_monitor = true
	max_contacts_reported = 1

	body_entered.connect(_on_body_entered)


func spawn_at(pos: Vector3) -> void:
	_spawn_pos = pos
	global_position = pos
	linear_velocity = Vector3.ZERO
	angular_velocity = Vector3.ZERO
	global_rotation = Vector3.ZERO
	is_armed = false
	battery_voltage = 16.8
	flight_time = 0.0


func _physics_process(delta: float) -> void:
	if _crash_cooldown > 0.0:
		_crash_cooldown -= delta
		return

	# Update telemetry
	speed = linear_velocity.length()
	altitude = global_position.y
	throttle_percent = throttle_input * 100.0

	if is_armed:
		flight_time += delta
		battery_voltage = maxf(12.0, 16.8 - flight_time * 0.01)  # slow drain

	if not is_armed:
		return

	# --- Thrust ---
	var thrust_force := basis.y * throttle_input * Constants.MAX_THRUST
	apply_central_force(thrust_force)

	# --- Drag ---
	var vel := linear_velocity
	var speed_sq := vel.length_squared()
	if speed_sq > 0.01:
		var drag := -vel.normalized() * Constants.DRAG_COEFFICIENT * speed_sq * 0.01
		apply_central_force(drag)

	# --- Angular control ---
	match flight_mode:
		Constants.FlightMode.ACRO:
			_apply_acro(delta)
		Constants.FlightMode.ANGLE:
			_apply_angle(delta)
		Constants.FlightMode.HORIZON:
			_apply_horizon(delta)


func _apply_acro(_delta: float) -> void:
	# Rate mode: stick controls rotation rate directly
	var target_angular := Vector3(
		deg_to_rad(-pitch_input * Constants.MAX_PITCH_RATE),
		deg_to_rad(-yaw_input * Constants.MAX_YAW_RATE),
		deg_to_rad(-roll_input * Constants.MAX_ROLL_RATE),
	)
	# Apply as torque proportional to error from target rate
	var rate_error := target_angular - angular_velocity
	apply_torque(rate_error * mass * 5.0)


func _apply_angle(_delta: float) -> void:
	# Angle mode: stick controls target tilt angle, self-levels
	var max_tilt := deg_to_rad(Constants.ANGLE_MODE_MAX_TILT)
	var target_pitch := -pitch_input * max_tilt
	var target_roll := -roll_input * max_tilt

	# Current angles
	var current_euler := global_rotation
	var pitch_error := target_pitch - current_euler.x
	var roll_error := target_roll - current_euler.z

	# PD controller for leveling
	var p_gain := 8.0
	var d_gain := 3.0
	apply_torque(Vector3(
		(pitch_error * p_gain - angular_velocity.x * d_gain) * mass,
		deg_to_rad(-yaw_input * Constants.MAX_YAW_RATE - angular_velocity.y) * mass * 3.0,
		(roll_error * p_gain - angular_velocity.z * d_gain) * mass,
	))


func _apply_horizon(_delta: float) -> void:
	# Hybrid: behaves like angle at center stick, acro at edges
	var stick_mag := maxf(absf(pitch_input), absf(roll_input))
	var threshold := Constants.HORIZON_TRANSITION

	if stick_mag < threshold:
		_apply_angle(_delta)
	else:
		_apply_acro(_delta)


func toggle_arm() -> void:
	is_armed = not is_armed
	if is_armed:
		flight_time = 0.0
	armed_changed.emit(is_armed)


func cycle_flight_mode() -> void:
	match flight_mode:
		Constants.FlightMode.ACRO:
			flight_mode = Constants.FlightMode.ANGLE
		Constants.FlightMode.ANGLE:
			flight_mode = Constants.FlightMode.HORIZON
		Constants.FlightMode.HORIZON:
			flight_mode = Constants.FlightMode.ACRO
	mode_changed.emit(flight_mode)


func _on_body_entered(_body: Node) -> void:
	if not is_armed:
		return
	if speed > 5.0:
		# Crash
		is_armed = false
		armed_changed.emit(false)
		crashed.emit()
		_crash_cooldown = 1.0
		# Respawn after delay
		var tween := create_tween()
		tween.tween_interval(2.0)
		tween.tween_callback(func() -> void:
			spawn_at(_spawn_pos)
		)
