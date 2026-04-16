/**
 * SIGNAL v6.0 CHROMA ENGINE
 * High-Definition Legibility with Adaptive Sharpening
 */

window.AsciiEngine = class AsciiEngine {
    constructor() {
        this.charSets = {
            standard: "@#S%?*+;:,. ",
            neon: "█▓▒░ ",
            solid: "■□▣▢ "
        };
        this.mode = 'neon';
        this.bayerMatrix = new Uint8Array([
             0, 32,  8, 40,  2, 34, 10, 42,
            48, 16, 56, 24, 50, 18, 58, 26,
            12, 44,  4, 36, 14, 46,  6, 38,
            60, 28, 52, 20, 62, 30, 54, 22,
             3, 35, 11, 43,  1, 33,  9, 41,
            51, 19, 59, 27, 49, 17, 57, 25,
            15, 47,  7, 39, 13, 45,  5, 37,
            63, 31, 55, 23, 61, 29, 53, 21
        ]);
    }

    setMode(mode) {
        this.mode = mode;
    }

    // V6.0 Adaptive Legibility: Sharpening Kernel
    applySharpen(pixels, w, h) {
        const out = new Uint8ClampedArray(pixels); // Copy all pixels first (fixes border pixels)
        const k = [-1,-1,-1, -1, 9, -1, -1,-1,-1];
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const i = (y * w + x) * 4;
                for (let c = 0; c < 3; c++) {
                    let val = 0;
                    for (let ky = -1; ky <= 1; ky++) {
                        for (let kx = -1; kx <= 1; kx++) {
                            val += pixels[((y + ky) * w + (x + kx)) * 4 + c] * k[(ky + 1) * 3 + (kx + 1)];
                        }
                    }
                    out[i + c] = val; // Uint8ClampedArray automatically clamps to 0-255
                }
            }
        }
        return out;
    }

    process(data, width, height, audioFactor = 0, isRetro = false) {
        const af = Math.min(audioFactor, 1.0); // Clamp — audio.js can return > 1
        const sharpened = this.applySharpen(data, width, height);
        
        const charSet = this.charSets[this.mode] || this.charSets.standard;
        const charLen = charSet.length;
        let ascii = "";

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                let brightness = (sharpened[i] + sharpened[i + 1] + sharpened[i + 2]) / 3;

                // Modest audio drive (capped so it doesn't wash out)
                brightness *= (1 + af * 0.8);

                // Bayer dithering for Retro mode
                if (isRetro) {
                    const threshold = this.bayerMatrix[(y % 8) * 8 + (x % 8)] * 4;
                    brightness = brightness < threshold ? 0 : brightness;
                }

                const charIndex = Math.floor(Math.min(1, brightness / 255) * (charLen - 1));
                ascii += charSet[charLen - 1 - charIndex] || " ";
            }
            ascii += "\n";
        }
        return ascii;
    }
}
