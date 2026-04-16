/**
 * SIGNAL AUDIO ENGINE v1.0
 * Web Audio FFT Integration for Reactive Visuals
 */

window.AudioProcessor = class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.isInitialized = false;
    }

    async init(stream) {
        if (this.isInitialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            
            this.analyser.fftSize = 256;
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            source.connect(this.analyser);
            
            // Safari/WebKit Bridge: Force Context Ignition
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.isInitialized = true;
        } catch (err) {
            console.error("Audio initialization failed:", err);
        }
    }

    /**
     * returns normalized volume (0 - 1)
     */
    getVolume() {
        if (!this.isInitialized || !this.analyser) return 0;

        this.analyser.getByteFrequencyData(this.dataArray);

        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        const average = sum / this.dataArray.length;

        // Return normalized value (Boosted sensitivity for V7.2)
        return Math.min(1.0, (average / 80) * 1.5); 
    }

    suspend() {
        if (this.audioContext) this.audioContext.suspend();
    }

    resume() {
        if (this.audioContext) this.audioContext.resume();
    }
}
