shader_type spatial;
render_mode vertex_lighting, cull_back;

// Distance fog to hide chunk pop-in
uniform vec3 fog_color : source_color = vec3(0.53, 0.81, 0.92);
uniform float fog_start = 80.0;
uniform float fog_end = 120.0;

void fragment() {
    // Vertex colors come from greedy meshing
    ALBEDO = COLOR.rgb;

    // Simple distance fog
    float dist = length(VERTEX);
    float fog_factor = smoothstep(fog_start, fog_end, dist);
    ALBEDO = mix(ALBEDO, fog_color, fog_factor);

    // Slight ambient occlusion fake based on normal direction
    float ao = mix(0.7, 1.0, max(NORMAL.y * 0.5 + 0.5, 0.0));
    ALBEDO *= ao;
}
