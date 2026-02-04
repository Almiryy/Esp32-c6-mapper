class_name DroneAudio
extends AudioStreamPlayer3D
## Procedural motor sound synthesis based on throttle and RPM.

var _playback: AudioStreamGeneratorPlayback
var _phase := 0.0
var _target_freq := 0.0
var _current_freq := 100.0
var _target_volume := -20.0
const BASE_FREQ := 80.0
const MAX_FREQ := 800.0
const SAMPLE_RATE := 22050.0  # lower sample rate for mobile


func _ready() -> void:
	var generator := AudioStreamGenerator.new()
	generator.mix_rate = SAMPLE_RATE
	generator.buffer_length = 0.05  # 50ms buffer
	stream = generator
	volume_db = -20.0
	play()
	_playback = get_stream_playback() as AudioStreamGeneratorPlayback


func update_from_drone(throttle: float, speed: float, is_armed: bool) -> void:
	if not is_armed:
		_target_freq = 0.0
		_target_volume = -40.0
		return

	# Motor frequency based on throttle
	_target_freq = BASE_FREQ + throttle * (MAX_FREQ - BASE_FREQ)
	# Add slight variation based on speed (wind effect)
	_target_freq += speed * 2.0

	# Volume based on throttle
	_target_volume = lerpf(-25.0, -8.0, throttle)


func _process(_delta: float) -> void:
	if not _playback:
		return

	# Smooth frequency transitions
	_current_freq = lerpf(_current_freq, _target_freq, 0.1)
	volume_db = lerpf(volume_db, _target_volume, 0.1)

	# Fill audio buffer with motor tone
	var frames_available := _playback.get_frames_available()
	if frames_available <= 0:
		return

	var increment := _current_freq / SAMPLE_RATE
	for _i in frames_available:
		_phase = fmod(_phase + increment, 1.0)
		# Mix fundamental + harmonics for richer motor sound
		var sample := 0.0
		sample += sin(_phase * TAU) * 0.5           # fundamental
		sample += sin(_phase * TAU * 2.0) * 0.25    # 2nd harmonic
		sample += sin(_phase * TAU * 3.0) * 0.12    # 3rd harmonic
		# Add some noise for prop wash
		sample += (randf() - 0.5) * 0.08
		_playback.push_frame(Vector2(sample, sample))
