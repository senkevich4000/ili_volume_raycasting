precision highp float;
precision mediump sampler3D;

uniform vec3 u_size;
uniform int u_renderstyle;
uniform float u_renderthreshold;
uniform vec2 u_clim;
uniform float u_min_intensity;
uniform float u_max_intensity;

uniform sampler3D u_data;
uniform sampler2D u_cmdata;

varying vec3 v_position;
varying vec4 v_nearpos;
varying vec4 v_farpos;

// The maximum distance through our rendering volume is sqrt(3).
const int MAX_STEPS = 887;      // 887 for 512^3, 1774 for 1024^3
const int REFINEMENT_STEPS = 4;

const float relative_step_size = 1.3;
const vec4 ambient_color = vec4(0.2, 0.4, 0.2, 1.0);
const vec4 diffuse_color = vec4(0.8, 0.2, 0.2, 1.0);
const vec4 specular_color = vec4(1.0, 1.0, 1.0, 1.0);
const float shininess = 80.0;

const float uniformal_opacity = 0.3;
const float uniformal_step_opacity = 1.0;

const bool complex_distance_calculation = true;
const bool debug_mode = false;

void raycast(vec3 start_loc, vec3 step, int nsteps, vec3 view_ray);

float sample1(vec3 texcoords);
float calculate_distance(vec3 nearpos, vec3 farpos, vec3 view_ray);
void debug_steps(int nsteps, float range);
void discard_transparent();

vec4 apply_colormap(float val);
vec3 calculate_normal_vector_from_gradient(vec3 loc, float val, vec3 step);
vec4 add_lighting(vec4 color, vec3 normal_vector, vec3 view_ray);
float normalized_intensity(float intensity);

vec4 inverseBlend(vec4 base, vec4 blend);
vec4 blend(vec4 base, vec4 blend);

void main() {
    // Normalize clipping plane info
    vec3 farpos = v_farpos.xyz / v_farpos.w;
    vec3 nearpos = v_nearpos.xyz / v_nearpos.w;

    // Calculate unit vector pointing in the view direction through this fragment.
    vec3 view_ray = normalize(nearpos.xyz - farpos.xyz);

    float distance = calculate_distance(nearpos, farpos, view_ray);

    // Now we have the starting position on the front surface
    vec3 front = v_position + view_ray * distance;

    // Decide how many steps to take
    int nsteps = int((-distance / relative_step_size) + 0.5);
    if ( nsteps < 1 )
    {
        if(debug_mode)
        {
            gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
            return;
        }
        else
        {
            discard;
        }
    }

    // Get starting location and step vector in texture coordinates
    vec3 step = ((v_position - front) / u_size) / float(nsteps);
    vec3 start_loc = front / u_size;

    if (u_renderstyle == 0)
    {
        raycast(start_loc, step, nsteps, view_ray);
    }
    if (u_renderstyle == 1)
    {
        debug_steps(nsteps, u_size.x);
    }

    discard_transparent();
}

float sample1(vec3 texcoords) {
    // Sample float value from a 3D texture. Assumes intensity data.
    return texture(u_data, texcoords.xyz).r;
}

float calculate_distance(vec3 nearpos, vec3 farpos, vec3 view_ray) {
    // Compute the (negative) distance to the front surface or near clipping plane.
    // v_position is the back face of the cuboid, so the initial distance calculated in the dot
    // product below is the distance from near clip plane to the back of the cuboid
    float distance = dot(nearpos - v_position, view_ray);
    if (complex_distance_calculation)
    {
        distance = max(
            distance,
            min((-0.5 - v_position.x) / view_ray.x,
                (u_size.x - 0.5 - v_position.x) / view_ray.x));
        distance = max(
            distance,
            min((-0.5 - v_position.y) / view_ray.y,
                (u_size.y - 0.5 - v_position.y) / view_ray.y));
        distance = max(
            distance,
            min((-0.5 - v_position.z) / view_ray.z,
                (u_size.z - 0.5 - v_position.z) / view_ray.z));
    }
    return distance;
}

vec4 apply_colormap(float val) {
    val = (val - u_clim[0]) / (u_clim[1] - u_clim[0]);
    return texture2D(u_cmdata, vec2(val, 0.5));
}

void raycast(vec3 start_loc, vec3 step, int nsteps, vec3 view_ray) {
    gl_FragColor = vec4(0.0);
    vec4 final_color = vec4(0.0);
    vec3 loc = start_loc;

    // Enter the raycasting loop. In WebGL 1 the loop index cannot be compared with
    // non-constant expression. So we use a hard-coded max, and an additional condition
    // inside the loop.
    for (int iter=0; iter<MAX_STEPS; iter++) {
        if (iter >= nsteps)
            break;

        // Sample from the 3D texture
        float val = sample1(loc);
        vec4 current_color = apply_colormap(val);
        vec3 normal_vector = calculate_normal_vector_from_gradient(loc, val, step);
        current_color = add_lighting(current_color, normal_vector, view_ray);
        current_color.a *= uniformal_step_opacity;
        current_color.a *= normalized_intensity(val);
        final_color = inverseBlend(final_color, current_color);

        // Advance location deeper into the volume
        loc += step;
    }
    final_color.a *= uniformal_opacity;
    gl_FragColor = final_color;
}

vec4 inverseBlend(vec4 base, vec4 blend) {
    return base + (1.0 - base.a) * vec4(blend.rgb * blend.a, blend.a);
}

vec4 blend(vec4 base, vec4 blend) {
    float opacity = blend.a;
    return blend * opacity + base * (1.0 - opacity);
}

float normalized_intensity(float intensity) {
    return (intensity - u_min_intensity) / (u_max_intensity - u_min_intensity);
}

vec3 calculate_normal_vector_from_gradient(vec3 loc, float val, vec3 step) {
    vec3 N;
    float val1, val2;
    val1 = sample1(loc + vec3(-step[0], 0.0, 0.0));
    val2 = sample1(loc + vec3(+step[0], 0.0, 0.0));
    N[0] = val1 - val2;
    val = max(max(val1, val2), val);
    val1 = sample1(loc + vec3(0.0, -step[1], 0.0));
    val2 = sample1(loc + vec3(0.0, +step[1], 0.0));
    N[1] = val1 - val2;
    val = max(max(val1, val2), val);
    val1 = sample1(loc + vec3(0.0, 0.0, -step[2]));
    val2 = sample1(loc + vec3(0.0, 0.0, +step[2]));
    N[2] = val1 - val2;
    val = max(max(val1, val2), val);
    return N;
}

vec4 add_lighting(vec4 color, vec3 normal_vector, vec3 view_ray) {
    // Calculate color by incorporating lighting

    // View direction
    vec3 V = normalize(view_ray);

    vec3 N = normal_vector;

    float gm = length(N); // gradient magnitude
    N = normalize(N);

    // Flip normal so it points towards viewer
    float Nselect = float(dot(N, V) > 0.0);
    N = (2.0 * Nselect - 1.0) * N; // == Nselect * N - (1.0-Nselect)*N;

    // Init colors
    vec4 ambient_color = vec4(0.0, 0.0, 0.0, 0.0);
    vec4 diffuse_color = vec4(0.0, 0.0, 0.0, 0.0);
    vec4 specular_color = vec4(0.0, 0.0, 0.0, 0.0);

    // note: could allow multiple lights
    for (int i=0; i<1; i++) {
        // Get light direction (make sure to prevent zero devision)
        vec3 L = normalize(view_ray);   //lightDirs[i];
        float lightEnabled = float( length(L) > 0.0 );
        L = normalize(L + (1.0 - lightEnabled));

        // Calculate lighting properties
        float lambertTerm = clamp(dot(N, L), 0.0, 1.0);
        vec3 H = normalize(L+V); // Halfway vector
        float specularTerm = pow(max(dot(H, N), 0.0), shininess);

        // Calculate mask
        float mask1 = lightEnabled;

        // Calculate colors
        ambient_color += mask1 * ambient_color; // * gl_LightSource[i].ambient;
        diffuse_color += mask1 * lambertTerm;
        specular_color += mask1 * specularTerm * specular_color;
    }

    // Calculate final color by componing different components
    vec4 final_color = color * (ambient_color + diffuse_color) + specular_color;
    final_color.a = color.a;
    return final_color;
}

void debug_steps(int nsteps, float range) {
    // For testing: show the number of steps. This helps to establish
    // whether the rays are correctly oriented
    gl_FragColor = vec4(0.0, float(nsteps) / 1.0 / range, 0.0, 1.0);
}

void discard_transparent() {
    if (gl_FragColor.a < 0.05)
    {
        if(debug_mode)
        {
            gl_FragColor = vec4(0.9, 0.1, 0.1, 1.0);
        }
        else
        {
            discard;
        }
    }
}

