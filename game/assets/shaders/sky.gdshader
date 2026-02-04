shader_type sky;

// Simple procedural sky with sun
uniform vec3 sky_top_color : source_color = vec3(0.25, 0.5, 0.95);
uniform vec3 sky_horizon_color : source_color = vec3(0.53, 0.81, 0.92);
uniform vec3 ground_color : source_color = vec3(0.35, 0.38, 0.3);
uniform vec3 sun_color : source_color = vec3(1.0, 0.95, 0.85);
uniform float sun_size = 0.02;

void sky() {
    vec3 dir = EYEDIR;
    float horizon = smoothstep(-0.05, 0.3, dir.y);

    // Sky gradient
    vec3 col = mix(sky_horizon_color, sky_top_color, horizon);

    // Ground below horizon
    if (dir.y < 0.0) {
        col = mix(sky_horizon_color, ground_color, smoothstep(0.0, -0.3, dir.y));
    }

    // Sun disc
    float sun_dot = dot(dir, LIGHT0_DIRECTION);
    float sun_disc = smoothstep(1.0 - sun_size, 1.0 - sun_size * 0.5, sun_dot);
    col += sun_color * sun_disc * 2.0;

    // Sun glow
    float sun_glow = pow(max(sun_dot, 0.0), 32.0);
    col += sun_color * sun_glow * 0.3;

    COLOR = col;
}
