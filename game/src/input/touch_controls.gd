class_name TouchControls
extends Control
## On-screen dual-stick touch controls for mobile.
## Left stick: Throttle (Y) + Yaw (X)
## Right stick: Pitch (Y) + Roll (X)

const STICK_RADIUS := 80.0
const DEAD_ZONE_RADIUS := 10.0
const STICK_COLOR := Color(1, 1, 1, 0.25)
const KNOB_COLOR := Color(1, 1, 1, 0.5)
const KNOB_RADIUS := 30.0

var _left_touch_idx := -1
var _right_touch_idx := -1
var _left_center := Vector2.ZERO
var _right_center := Vector2.ZERO
var _left_offset := Vector2.ZERO
var _right_offset := Vector2.ZERO

# Arm button
var _arm_button: Button


func _ready() -> void:
	# Anchor full screen
	set_anchors_preset(PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_PASS

	# Add arm/disarm button at bottom center
	_arm_button = Button.new()
	_arm_button.text = "ARM"
	_arm_button.custom_minimum_size = Vector2(120, 50)
	_arm_button.position = Vector2(-60, -70)
	_arm_button.set_anchors_preset(PRESET_CENTER_BOTTOM)
	_arm_button.pressed.connect(func() -> void:
		# Simulate arm action
		Input.action_press("fly_arm")
		await get_tree().create_timer(0.1).timeout
		Input.action_release("fly_arm")
	)
	add_child(_arm_button)


func _input(event: InputEvent) -> void:
	if event is InputEventScreenTouch:
		_handle_touch(event as InputEventScreenTouch)
	elif event is InputEventScreenDrag:
		_handle_drag(event as InputEventScreenDrag)


func _handle_touch(event: InputEventScreenTouch) -> void:
	var screen_mid := get_viewport_rect().size.x * 0.5

	if event.pressed:
		if event.position.x < screen_mid and _left_touch_idx < 0:
			_left_touch_idx = event.index
			_left_center = event.position
			_left_offset = Vector2.ZERO
			InputManager.using_touch = true
		elif event.position.x >= screen_mid and _right_touch_idx < 0:
			_right_touch_idx = event.index
			_right_center = event.position
			_right_offset = Vector2.ZERO
			InputManager.using_touch = true
	else:
		if event.index == _left_touch_idx:
			_left_touch_idx = -1
			_left_offset = Vector2.ZERO
			InputManager.touch_throttle = 0.0
			InputManager.touch_yaw = 0.0
		elif event.index == _right_touch_idx:
			_right_touch_idx = -1
			_right_offset = Vector2.ZERO
			InputManager.touch_pitch = 0.0
			InputManager.touch_roll = 0.0


func _handle_drag(event: InputEventScreenDrag) -> void:
	if event.index == _left_touch_idx:
		_left_offset = (event.position - _left_center).limit_length(STICK_RADIUS)
		var normalized := _left_offset / STICK_RADIUS
		InputManager.touch_yaw = normalized.x
		InputManager.touch_throttle = -normalized.y  # up = positive
	elif event.index == _right_touch_idx:
		_right_offset = (event.position - _right_center).limit_length(STICK_RADIUS)
		var normalized := _right_offset / STICK_RADIUS
		InputManager.touch_roll = normalized.x
		InputManager.touch_pitch = -normalized.y  # up = forward


func _draw() -> void:
	# Left stick
	if _left_touch_idx >= 0:
		draw_circle(_left_center, STICK_RADIUS, STICK_COLOR)
		draw_circle(_left_center + _left_offset, KNOB_RADIUS, KNOB_COLOR)
	# Right stick
	if _right_touch_idx >= 0:
		draw_circle(_right_center, STICK_RADIUS, STICK_COLOR)
		draw_circle(_right_center + _right_offset, KNOB_RADIUS, KNOB_COLOR)


func _process(_delta: float) -> void:
	# Redraw sticks each frame when active
	if _left_touch_idx >= 0 or _right_touch_idx >= 0:
		queue_redraw()

	# Update arm button text
	if _arm_button:
		# Read arm state from drone if available
		var drone := get_tree().get_first_node_in_group("drone")
		if drone and drone is DroneController:
			_arm_button.text = "DISARM" if drone.is_armed else "ARM"
