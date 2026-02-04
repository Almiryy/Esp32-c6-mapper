extends Node
## Global input manager — handles any controller (ELRS, Xbox, PS, generic)
## and touch fallback. Auto-detects connected gamepads.

signal controller_connected(device_name: String)
signal controller_disconnected()

# Processed stick values (after deadzone + expo)
var throttle := 0.0
var yaw := 0.0
var pitch := 0.0
var roll := 0.0

# Touch input override (set by TouchControls node)
var touch_throttle := 0.0
var touch_yaw := 0.0
var touch_pitch := 0.0
var touch_roll := 0.0
var using_touch := false

# Configurable per-axis settings
@export var deadzone := 0.08
@export var expo := 0.3       # 0 = linear, 1 = full cubic
@export var rate := 1.0       # multiplier

# Stick mapping mode — Mode 2 is FPV standard
# Mode 2: Left=Throttle/Yaw, Right=Pitch/Roll
# Can be changed in settings for Mode 1 pilots
@export var stick_mode := 2

var _has_gamepad := false
var _gamepad_name := ""


func _ready() -> void:
	Input.joy_connection_changed.connect(_on_joy_connection_changed)
	# Check for already-connected gamepads
	for device_id in Input.get_connected_joypads():
		_on_joy_connection_changed(device_id, true)


func _process(_delta: float) -> void:
	if _has_gamepad:
		_read_gamepad()
		using_touch = false
	elif using_touch:
		throttle = _apply_curve(touch_throttle)
		yaw = _apply_curve(touch_yaw)
		pitch = _apply_curve(touch_pitch)
		roll = _apply_curve(touch_roll)
	else:
		# Keyboard fallback
		_read_keyboard()


func _read_gamepad() -> void:
	# Read raw axes — Godot maps any gamepad uniformly.
	# ELRS controllers in USB joystick mode show up as standard HID gamepad.
	# Left stick: axes 0 (X) and 1 (Y)
	# Right stick: axes 2 (X) and 3 (Y)

	var raw_left_x := Input.get_joy_axis(0, JOY_AXIS_LEFT_X)
	var raw_left_y := Input.get_joy_axis(0, JOY_AXIS_LEFT_Y)
	var raw_right_x := Input.get_joy_axis(0, JOY_AXIS_RIGHT_X)
	var raw_right_y := Input.get_joy_axis(0, JOY_AXIS_RIGHT_Y)

	match stick_mode:
		2:  # Mode 2 (FPV standard)
			throttle = _apply_curve(-raw_left_y)   # up = positive
			yaw = _apply_curve(raw_left_x)
			pitch = _apply_curve(-raw_right_y)      # up = forward
			roll = _apply_curve(raw_right_x)
		1:  # Mode 1
			throttle = _apply_curve(-raw_right_y)
			yaw = _apply_curve(raw_right_x)
			pitch = _apply_curve(-raw_left_y)
			roll = _apply_curve(raw_left_x)

	# Throttle: remap from -1..1 to 0..1
	throttle = (throttle + 1.0) * 0.5


func _read_keyboard() -> void:
	var t_up := Input.get_action_strength("fly_throttle_up")
	var t_down := Input.get_action_strength("fly_throttle_down")
	var y_left := Input.get_action_strength("fly_yaw_left")
	var y_right := Input.get_action_strength("fly_yaw_right")
	var p_fwd := Input.get_action_strength("fly_pitch_forward")
	var p_back := Input.get_action_strength("fly_pitch_back")
	var r_left := Input.get_action_strength("fly_roll_left")
	var r_right := Input.get_action_strength("fly_roll_right")

	throttle = clampf(t_up - t_down, 0.0, 1.0)
	yaw = clampf(y_right - y_left, -1.0, 1.0)
	pitch = clampf(p_fwd - p_back, -1.0, 1.0)
	roll = clampf(r_right - r_left, -1.0, 1.0)


## Apply deadzone + expo curve to a raw axis value.
func _apply_curve(raw: float) -> float:
	var sign_val := signf(raw)
	var abs_val := absf(raw)

	# Deadzone
	if abs_val < deadzone:
		return 0.0
	var normalized := (abs_val - deadzone) / (1.0 - deadzone)

	# Expo curve: mix linear and cubic
	var curved := normalized * (1.0 - expo) + (normalized * normalized * normalized) * expo

	return sign_val * curved * rate


func _on_joy_connection_changed(device: int, connected: bool) -> void:
	if connected:
		_has_gamepad = true
		_gamepad_name = Input.get_joy_name(device)
		controller_connected.emit(_gamepad_name)
		print("Controller connected: ", _gamepad_name)
	else:
		if Input.get_connected_joypads().is_empty():
			_has_gamepad = false
			_gamepad_name = ""
			controller_disconnected.emit()
			print("Controller disconnected")
