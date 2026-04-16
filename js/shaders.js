/**
 * SIGNAL v9.0 VISUAL SYNTHESIZER (ULTRA)
 * Psychedelic Shaders & Multi-Axis Mirroring
 */

export const ASCII_VERT = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
        gl_Position = vec4(a_position, 0, 1);
        v_uv = (a_position + 1.0) / 2.0;
        v_uv.y = 1.0 - v_uv.y;
    }
`;

export const ASCII_FRAG = `
    precision highp float;
    varying vec2 v_uv;
    
    uniform sampler2D u_input;
    uniform sampler2D u_atlas;
    
    uniform vec2 u_resolution;
    uniform vec2 u_offset;
    uniform vec2 u_grid;
    
    uniform float u_audioFactor; 
    uniform float u_time;
    uniform float u_filterMode;
    uniform float u_mode; 
    uniform float u_charAspect;

    // v9.0 PSYCHEDELIC UNIFORMS
    uniform float u_rgbShift;
    uniform float u_kaleidoscope;
    uniform float u_glitch;

    void main() {
        float kineticPulse = u_audioFactor * 0.3;
        
        vec2 centeredUV = v_uv - 0.5;
        
        // KALEIDOSCOPE MODULE (V9.0)
        if (u_kaleidoscope > 1.0) {
            float angle = atan(centeredUV.y, centeredUV.x);
            float radius = length(centeredUV);
            float p = 6.28318 / u_kaleidoscope;
            angle = mod(angle, p);
            if (angle > p / 2.0) angle = p - angle;
            centeredUV = vec2(cos(angle), sin(angle)) * radius;
        }

        vec2 pulsedUV = (centeredUV / (1.0 + kineticPulse)) + 0.5;
        
        vec2 pixelPos = pulsedUV * u_resolution;
        vec2 gridPos = pixelPos - u_offset;
        
        float cellWidth = u_resolution.x / u_grid.x;
        float cellHeight = cellWidth / u_charAspect;
        
        vec2 cellUV = vec2(mod(gridPos.x, cellWidth) / cellWidth, 
                           mod(gridPos.y, cellHeight) / cellHeight);

        if (gridPos.x < 0.0 || gridPos.y < 0.0 || 
            gridPos.x > u_grid.x * cellWidth || 
            gridPos.y > u_grid.y * cellHeight) {
            gl_FragColor = vec4(0, 0, 0, 1);
            return;
        }

        vec2 sourceUV = gridPos / vec2(u_grid.x * cellWidth, u_grid.y * cellHeight);
        
        // CHROMATIC SHIFT (V9.0)
        float shift = u_rgbShift / u_resolution.x;
        vec4 colR = texture2D(u_input, sourceUV + vec2(shift, 0.0));
        vec4 colG = texture2D(u_input, sourceUV);
        vec4 colB = texture2D(u_input, sourceUV - vec2(shift, 0.0));
        
        vec4 sourceCol = vec4(colR.r, colG.g, colB.b, 1.0);

        // GLITCH OVERDRIVE
        if (u_glitch > 0.0) {
            float gFactor = step(1.0 - (u_glitch * u_audioFactor), fract(sin(u_time * 100.0) * 43758.5453));
            if (gFactor > 0.5) {
                sourceCol = texture2D(u_input, fract(sourceUV * 2.0 + u_time));
            }
        }

        float lum = (sourceCol.r + sourceCol.g + sourceCol.b) / 3.0;
        float brightness = pow(lum, 1.3) * 1.8;

        float charIndex = floor(clamp(brightness, 0.0, 1.0) * 11.0);
        vec2 atlasUV = vec2((charIndex + clamp(cellUV.x, 0.0, 0.9)) / 16.0, clamp(cellUV.y, 0.0, 0.9));
        vec4 charColor = texture2D(u_atlas, atlasUV);

        vec3 finalColor;
        if (u_mode == 1.0) {
            finalColor = vec3(0.0, 1.0, 0.2) * (brightness * 2.5) + vec3(0.0, 0.4, 0.0) * u_audioFactor;
        } else if (u_mode == 2.0) {
            finalColor = vec3(brightness);
        } else if (u_mode == 3.0) {
            finalColor = vec3(0.1, 0.5 + u_audioFactor * 0.5, 1.0) * 1.2;
        } else {
            finalColor = sourceCol.rgb * 1.8;
            if (u_audioFactor > 0.6) finalColor *= 1.5;
        }

        gl_FragColor = charColor * vec4(finalColor, 1.0);
    }
`;
