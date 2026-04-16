/**
 * SIGNAL v9.0 RENDERER WORKER
 * Visual Synthesizer Handshake & Persistence Logic
 */

import { ASCII_VERT, ASCII_FRAG } from './shaders.js';

let gl, program, texture, atlas;
let width, height;
let offsetX = 0, offsetY = 0;
let gridWidth = 120, gridHeight = 60;
let charAspect = 0.6;

self.onmessage = async (e) => {
    const { type, data } = e.data;

    if (type === 'init') {
        initWebGL(data.canvas, data.width, data.height);
        offsetX = data.offsetX || 0;
        offsetY = data.offsetY || 0;
    } else if (type === 'resize') {
        width = data.width;
        height = data.height;
        offsetX = data.offsetX || 0;
        offsetY = data.offsetY || 0;
        gridWidth = data.gridWidth || 120;
        gridHeight = data.gridHeight || 60;
        charAspect = data.charAspect || 0.6;
        if (gl) gl.viewport(0, 0, width, height);
    } else if (type === 'frame') {
        drawFrame(data);
    }
};

function initWebGL(canvas, w, h) {
    width = w; height = h;
    try {
        gl = canvas.getContext('webgl', { preserveDrawingBuffer: true }) || 
             canvas.getContext('experimental-webgl', { preserveDrawingBuffer: true });
             
        if (!gl) {
            self.postMessage({ type: 'worker-fail', data: 'NO_WEBGL_CONTEXT' });
            return;
        }

        program = createProgram(gl, ASCII_VERT, ASCII_FRAG);
        gl.useProgram(program);

        atlas = createAtlas(gl);
        texture = gl.createTexture();
        
        gl.uniform1i(gl.getUniformLocation(program, 'u_atlas'), 0);

        // SYNERGY HANDSHAKE
        self.postMessage({ type: 'worker-ready' });
    } catch (e) {
        self.postMessage({ type: 'worker-fail', data: e.message });
    }
}

function drawFrame({ bitmap, audioFactor, gridSize, time, filterMode, mode, synth }) {
    if (!gl) return;

    // v9.0 PERSISTENCE (TRAILS)
    if (synth && synth.trails > 0) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        // We don't clear. Instead we draw a semi-transparent black quad in the shader later or here.
        // For simplicity in v9.0, we use a manual alpha wipe if persistence is low.
    } else {
        gl.disable(gl.BLEND);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.uniform1i(gl.getUniformLocation(program, 'u_input'), 1);
    gl.uniform1f(gl.getUniformLocation(program, 'u_audioFactor'), audioFactor * (synth ? synth.audioGain : 1.0));
    gl.uniform1f(gl.getUniformLocation(program, 'u_time'), time / 1000);
    gl.uniform1f(gl.getUniformLocation(program, 'u_filterMode'), filterMode);
    gl.uniform1f(gl.getUniformLocation(program, 'u_charAspect'), charAspect);
    
    gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), width, height);
    gl.uniform2f(gl.getUniformLocation(program, 'u_offset'), offsetX, offsetY);
    gl.uniform2f(gl.getUniformLocation(program, 'u_grid'), gridWidth, gridHeight);

    // BIND SYNTH UNIFORMS (V9.0)
    if (synth) {
        gl.uniform1f(gl.getUniformLocation(program, 'u_rgbShift'), synth.rgbShift);
        gl.uniform1f(gl.getUniformLocation(program, 'u_kaleidoscope'), synth.kaleidoscope);
        gl.uniform1f(gl.getUniformLocation(program, 'u_glitch'), synth.glitch);
    } else {
        gl.uniform1f(gl.getUniformLocation(program, 'u_rgbShift'), 0.0);
        gl.uniform1f(gl.getUniformLocation(program, 'u_kaleidoscope'), 1.0);
        gl.uniform1f(gl.getUniformLocation(program, 'u_glitch'), 0.2);
    }

    let modeVal = 0.0;
    if (mode === 'neon') modeVal = 1.0;
    else if (mode === 'ascii') modeVal = 2.0;
    else if (mode === 'audio') modeVal = 3.0;
    gl.uniform1f(gl.getUniformLocation(program, 'u_mode'), modeVal);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    bitmap.close();
}

function createProgram(gl, vs, fs) {
    const s1 = compileShader(gl, vs, gl.VERTEX_SHADER);
    const s2 = compileShader(gl, fs, gl.FRAGMENT_SHADER);
    const p = gl.createProgram();
    gl.attachShader(p, s1);
    gl.attachShader(p, s2);
    gl.linkProgram(p);
    return p;
}

function compileShader(gl, src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
}

function createAtlas(gl) {
    const canvas = new OffscreenCanvas(256, 16);
    const ctx = canvas.getContext('2d');
    const chars = "@#S%?*+;:,. ";
    ctx.fillStyle = 'white';
    ctx.font = '12px "JetBrains Mono", monospace';
    for (let i = 0; i < chars.length; i++) {
        ctx.fillText(chars[i], i * 16 + 4, 12);
    }
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return t;
}
