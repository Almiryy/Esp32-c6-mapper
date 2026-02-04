class_name DroneOSD
extends Control
## On-screen display overlay showing flight telemetry (FPV style).

var _drone: DroneController

var _battery_label: Label
var _speed_label: Label
var _altitude_label: Label
var _throttle_label: Label
var _timer_label: Label
var _mode_label: Label
var _armed_label: Label
var _controller_label: Label
var _crosshair: Label


func _ready() -> void:
	set_anchors_preset(PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE

	var font_size := 16

	# Top-left: battery + mode
	_battery_label = _make_label(Vector2(10, 10), font_size)
	_mode_label = _make_label(Vector2(10, 30), font_size)
	_armed_label = _make_label(Vector2(10, 50), font_size)

	# Top-right: timer
	_timer_label = _make_label(Vector2(-120, 10), font_size)
	_timer_label.set_anchors_preset(PRESET_TOP_RIGHT)

	# Bottom-left: altitude + speed
	_altitude_label = _make_label(Vector2(10, -50), font_size)
	_altitude_label.set_anchors_preset(PRESET_BOTTOM_LEFT)
	_speed_label = _make_label(Vector2(10, -30), font_size)
	_speed_label.set_anchors_preset(PRESET_BOTTOM_LEFT)

	# Bottom-right: throttle
	_throttle_label = _make_label(Vector2(-120, -30), font_size)
	_throttle_label.set_anchors_preset(PRESET_BOTTOM_RIGHT)

	# Center: crosshair
	_crosshair = _make_label(Vector2(-5, -10), font_size)
	_crosshair.set_anchors_preset(PRESET_CENTER)
	_crosshair.text = "+"

	# Controller status (top center)
	_controller_label = _make_label(Vector2(-100, 10), 12)
	_controller_label.set_anchors_preset(PRESET_CENTER_TOP)
	_controller_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_controller_label.custom_minimum_size.x = 200

	# Listen for controller events
	InputManager.controller_connected.connect(func(name: String) -> void:
		_controller_label.text = name
		var tween := create_tween()
		tween.tween_property(_controller_label, "modulate:a", 0.0, 3.0).set_delay(2.0)
	)


func set_drone(drone: DroneController) -> void:
	_drone = drone
	drone.mode_changed.connect(func(_m: Constants.FlightMode) -> void: pass)
	drone.armed_changed.connect(func(_a: bool) -> void: pass)


func _process(_delta: float) -> void:
	if not _drone:
		return

	# Battery (color changes with voltage)
	var batt := _drone.battery_voltage
	var batt_color := Color.GREEN
	if batt < 14.0:
		batt_color = Color.YELLOW
	if batt < 13.0:
		batt_color = Color.RED
	_battery_label.text = "%.1fV" % batt
	_battery_label.add_theme_color_override("font_color", batt_color)

	# Flight mode
	var mode_names := ["ACRO", "ANGLE", "HORIZON"]
	_mode_label.text = mode_names[_drone.flight_mode]

	# Armed status
	if _drone.is_armed:
		_armed_label.text = "ARMED"
		_armed_label.add_theme_color_override("font_color", Color.GREEN)
	else:
		_armed_label.text = "DISARMED"
		_armed_label.add_theme_color_override("font_color", Color.RED)

	# Timer
	var t := _drone.flight_time
	var mins := int(t) / 60
	var secs := int(t) % 60
	var ms := int(fmod(t, 1.0) * 100)
	_timer_label.text = "%02d:%02d.%02d" % [mins, secs, ms]

	# Speed & altitude
	_speed_label.text = "SPD %.0f m/s" % _drone.speed
	_altitude_label.text = "ALT %.0f m" % _drone.altitude

	# Throttle
	_throttle_label.text = "THR %d%%" % int(_drone.throttle_percent)


func _make_label(pos: Vector2, font_size: int) -> Label:
	var label := Label.new()
	label.position = pos
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", Color.WHITE)
	label.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.7))
	label.add_theme_constant_override("shadow_offset_x", 1)
	label.add_theme_constant_override("shadow_offset_y", 1)
	add_child(label)
	return label
