class_name DroneCamera
extends Camera3D
## FPV camera attached to the drone with configurable tilt.

@export var cam_tilt_deg: float = Constants.FPV_TILT

func _ready() -> void:
	fov = Constants.FPV_FOV
	rotation_degrees.x = -cam_tilt_deg
	current = true
	# Near clip tight to avoid clipping through terrain
	near = 0.05
	far = 200.0
