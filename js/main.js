/**
 * SIGNAL v9.7 THE SYNTHESIZER (KINETIC BOOST)
 * Violent Audio-Reactivity & Extended Resolution Range
 */

class SignalApp {
    constructor() {
        this.video = document.getElementById('v-input');
        this.outputCanvas = document.getElementById('ascii-output');
        this.fpsLabel = document.getElementById('fps-counter');
        this.logicLog = document.getElementById('logic-log');
        this.synthDrawer = document.getElementById('synth-dashboard');
        
        this.cpuEngine = new window.AsciiEngine();
        this.audio = new window.AudioProcessor();
        this.exporter = new window.ExportSystem();
        this.settings = new window.SettingsManager();
        
        this.synth = { rgbShift: 0, trails: 0, kaleidoscope: 1, glitch: 0.2, audioGain: 1.5 }; // Boosted default gain
        this.worker = null;
        this.isStreaming = false;
        this.useWorker = false;
        this.workerInitialized = false;
        this.mode = 'chroma'; 
        this.filterMode = 0;
        this.resolution = window.innerWidth < 768 ? 60 : 120;
        this.lastTime = 0; this.frameCount = 0; this.hasIgnited = false;
        this.charAspect = 0.6; this.offsetX = 0; this.offsetY = 0; this.gridWidth = 120; this.gridHeight = 60;

        this.init();
        this.applySavedSettings();
        this.handleResize();
        
        console.log("FACECODE_V1_DEFINITIVE_IGNITION");
    }

    logStatus(status) { if (this.logicLog) this.logicLog.innerText = status.toUpperCase(); }

    initWorker() {
        try {
            this.worker = new Worker('js/renderer-worker.js', { type: 'module' });
            if (this.outputCanvas.transferControlToOffscreen) {
                this.offscreen = this.outputCanvas.transferControlToOffscreen();
            } else { throw new Error("GPU_LOCK"); }
            this.worker.onmessage = (e) => {
                if (e.data.type === 'worker-ready') { this.useWorker = true; this.handleResize(); }
                else if (e.data.type === 'worker-fail') { this.useWorker = false; }
            };
            setTimeout(() => { if (!this.useWorker && this.isStreaming) this.useWorker = false; }, 1000);
            this.handleResize();
        } catch (e) { this.useWorker = false; this.logStatus("facecode_resilient_active"); }
    }

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => this.handleResize(), 150);
        });
        this.handleResize();
    }

    handleResize() {
        const w = window.innerWidth; const h = window.innerHeight;
        try { if (!(this.useWorker && this.workerInitialized)) { const cv = this.offscreen || this.outputCanvas; cv.width = w; cv.height = h; } } catch(e) {}
        this.gridWidth = Math.floor(this.resolution);
        const vAspect = (this.video.videoWidth > 0) ? (this.video.videoWidth / this.video.videoHeight) : (16 / 9);
        this.gridHeight = Math.floor(this.gridWidth / (vAspect / this.charAspect));
        const cW = w / this.gridWidth; const cH = cW / this.charAspect;
        this.offsetX = w / 2; this.offsetY = (h - (this.gridHeight * cH)) / 2;
        if (this.useWorker) this.worker.postMessage({ type: 'resize', data: { width: w, height: h, offsetX: this.offsetX, offsetY: this.offsetY, gridWidth: this.gridWidth, gridHeight: this.gridHeight, charAspect: this.charAspect } });
    }

    applySavedSettings() {
        const saved = this.settings.load();
        if (saved) {
            this.mode = saved.mode || 'chroma'; this.filterMode = saved.filterMode || 0;
            this.resolution = saved.resolution || (window.innerWidth < 768 ? 60 : 120);
            if (saved.synth) this.synth = { ...this.synth, ...saved.synth };
            this.syncUI(); this.handleResize();
        }
    }

    persist() { this.settings.save({ mode: this.mode, filterMode: this.filterMode, resolution: this.resolution, synth: this.synth }); }

    init() {
        document.getElementById('btn-camera').addEventListener('click', () => this.toggleCamera());
        const menuBtn = document.getElementById('btn-menu');
        menuBtn.addEventListener('click', (e) => { e.stopPropagation(); this.synthDrawer.classList.toggle('active'); });
        document.getElementById('btn-close-menu').addEventListener('click', () => { this.synthDrawer.classList.remove('active'); });
        document.addEventListener('click', (e) => { if (!this.synthDrawer.contains(e.target) && e.target !== menuBtn) this.synthDrawer.classList.remove('active'); });

        document.getElementById('btn-export').addEventListener('click', async () => {
            document.getElementById('btn-export').innerText = "SNAP...";
            await this.exporter.takeSnapshot(this.outputCanvas);
            document.getElementById('btn-export').innerText = "SNAPSHOT";
        });

        const recBtn = document.getElementById('btn-record');
        recBtn.addEventListener('click', () => {
             const state = this.exporter.toggleRecording(this.outputCanvas);
             recBtn.innerText = state === "STOP_RECORD" ? "[REC] STOP" : "RECORD";
             recBtn.classList.toggle('rec-active', state === "STOP_RECORD");
        });

        const binders = [
            { id: 'slider-shift', prop: 'rgbShift', label: 'val-shift' },
            { id: 'slider-trails', prop: 'trails', label: 'val-trails' },
            { id: 'slider-kaleido', prop: 'kaleidoscope', label: 'val-kaleido' },
            { id: 'slider-glitch', prop: 'glitch', label: 'val-glitch' },
            { id: 'slider-audio', prop: 'audioGain', label: 'val-audio' }
        ];

        binders.forEach(b => {
            const el = document.getElementById(b.id);
            el.addEventListener('input', (e) => {
                this.synth[b.prop] = parseFloat(e.target.value);
                this.syncUI(); this.persist();
            });
        });

        document.querySelectorAll('.btn-mode').forEach(btn => {
            btn.addEventListener('click', (e) => { this.mode = e.target.dataset.mode; this.syncUI(); this.persist(); });
        });

        document.querySelectorAll('.btn-filter').forEach(btn => {
            btn.addEventListener('click', (e) => { this.filterMode = parseFloat(e.target.dataset.filter); this.syncUI(); this.persist(); });
        });

        // RESOLUTION SLIDER TRIGGER (v9.7 FIXED)
        document.getElementById('res-slider').addEventListener('input', (e) => { 
            this.resolution = parseInt(e.target.value); 
            this.handleResize(); // Immediate Resize
            this.persist(); 
        });
    }

    syncUI() {
        document.querySelectorAll('.btn-mode').forEach(btn => btn.classList.toggle('active', btn.dataset.mode === this.mode));
        document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.toggle('active', parseFloat(btn.dataset.filter) === this.filterMode));
        
        document.getElementById('slider-shift').value = this.synth.rgbShift;
        document.getElementById('slider-trails').value = this.synth.trails;
        document.getElementById('slider-kaleido').value = this.synth.kaleidoscope;
        document.getElementById('slider-glitch').value = this.synth.glitch;
        document.getElementById('slider-audio').value = this.synth.audioGain;
        document.getElementById('res-slider').value = this.resolution;

        document.getElementById('val-shift').innerText = this.synth.rgbShift.toFixed(2);
        document.getElementById('val-trails').innerText = this.synth.trails.toFixed(2);
        document.getElementById('val-kaleido').innerText = this.synth.kaleidoscope.toFixed(0);
        document.getElementById('val-glitch').innerText = this.synth.glitch.toFixed(2);
        document.getElementById('val-audio').innerText = this.synth.audioGain.toFixed(2);
    }

    async toggleCamera() {
        try { this.audio.resume(); } catch(e) {}
        if (this.isStreaming) {
            this.isStreaming = false;
            if (this.video.srcObject) this.video.srcObject.getTracks().forEach(t => t.stop());
            document.getElementById('btn-camera').innerText = "START_CAMERA";
            this.logStatus("standby"); this.hasIgnited = false;
            if (this.ignitionCheck) clearInterval(this.ignitionCheck);
            if (this.probeCheck) clearInterval(this.probeCheck);
            if (this.forceDeadline) clearTimeout(this.forceDeadline);
        } else { await this.startCamera(); }
    }

    async startCamera() {
        try {
            document.getElementById('btn-camera').innerText = "IGNITING...";
            let s; try { s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true }); }
            catch (e) { s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }); }
            this.video.srcObject = s; try { this.video.play(); } catch(e) {}
            this.forceDeadline = setTimeout(() => { if (!this.isStreaming) this.igniteEngine(s); }, 1200);
            this.probeCheck = setInterval(() => { if (this.video.readyState >= 1 || this.video.videoWidth > 0) this.igniteEngine(s); }, 50);
        } catch (e) { document.getElementById('btn-camera').innerText = "ERR"; }
    }

    async igniteEngine(s) {
        if (this.isStreaming) return; this.isStreaming = true;
        document.getElementById('btn-camera').innerText = "STOP_CAMERA";
        if (this.probeCheck) clearInterval(this.probeCheck); if (this.forceDeadline) clearTimeout(this.forceDeadline);
        try { await this.video.play(); } catch(e) {} this.handleResize();
        if (this.useWorker && !this.workerInitialized) {
            this.worker.postMessage({ type: 'init', data: { canvas: this.offscreen, width: window.innerWidth, height: window.innerHeight, offsetX: this.offsetX, offsetY: this.offsetY } }, [this.offscreen]);
            this.workerInitialized = true;
        } else if (this.useWorker) this.worker.postMessage({ type: 'resize', data: { width: window.innerWidth, height: window.innerHeight, offsetX: this.offsetX, offsetY: this.offsetY, gridWidth: this.gridWidth, gridHeight: this.gridHeight, charAspect: this.charAspect } });
        (async () => { try { await this.audio.init(s); } catch(e) {} })();
        this.ignitionCheck = setInterval(() => { if (this.video.paused && this.isStreaming) this.video.play(); }, 1000);
        requestAnimationFrame((t) => this.render(t));
    }

    async render(time = 0) {
        if (!this.isStreaming) return;
        if (time - this.lastTime > 1000) { this.fpsLabel.innerText = this.frameCount + (this.useWorker ? "" : " (CPU)"); this.frameCount = 0; this.lastTime = time; }
        this.frameCount++;
        if (this.useWorker) { try { const b = await createImageBitmap(this.video); this.worker.postMessage({ type: 'frame', data: { bitmap: b, audioFactor: this.audio.getVolume() || 0, time, filterMode: this.filterMode, mode: this.mode, synth: this.synth } }, [b]); } catch (e) {} }
        else { await this.renderCPU(time); }
        requestAnimationFrame((t) => this.render(t));
    }

    async renderCPU(t) {
        const af = (this.audio.getVolume() || 0) * this.synth.audioGain;
        // KINETIC SCALE LOGIC (v9.7 FIXED)
        const pulse = 1.0 + (af * 0.4); 
        
        const cv = this.offscreen || this.outputCanvas; const ctx = cv.getContext('2d');
        const W = cv.width; const H = cv.height;
        if (this.synth.trails > 0) { ctx.fillStyle = `rgba(0,0,0,${1-this.synth.trails})`; ctx.fillRect(0,0,W,H); }
        else { ctx.fillStyle = '#000'; ctx.fillRect(0,0,W,H); }
        const buf = document.getElementById('c-buffer'); const bCtx = buf.getContext('2d');
        buf.width = this.gridWidth; buf.height = this.gridHeight;
        try { bCtx.drawImage(this.video, 0, 0, buf.width, buf.height); } catch(e) { return; }
        const iD = bCtx.getImageData(0,0,buf.width,buf.height); const px = iD.data;
        const ascii = this.cpuEngine.process(px, buf.width, buf.height, af, this.filterMode === 1);
        const lines = ascii.split('\n'); const cW = W / buf.width; const cH = cW / this.charAspect;
        
        ctx.save();
        // PULSE JUMP (v9.7 FIXED)
        ctx.translate(W/2, H/2);
        ctx.scale(pulse, pulse);
        ctx.translate(-W/2, -H/2);
        
        ctx.font = `bold ${cW/this.charAspect}px "JetBrains Mono", monospace`; ctx.textAlign = 'center';
        const shift = this.synth.rgbShift;
        for (let r=0; r<lines.length; r++) {
            const l = lines[r]; if (!l) continue;
            for (let c=0; c<l.length; c++) {
                const char = l[c]; if (char === ' ') continue;
                const i = (r*buf.width+c)*4;
                let rC = px[i], gC = px[i+1], bC = px[i+2];
                // KINETIC BRIGHTNESS JUMP (v9.7 RESTORED)
                const boost = 1.0 + af * 1.5;
                if (this.mode === 'neon') { rC = 0; gC = 255; bC = 0; }
                else if (this.mode === 'ascii') { const lum = (rC+gC+bC)/3; rC=lum; gC=lum; bC=lum; }
                else if (this.mode === 'audio') { rC = 50; gC = 100 + af * 155; bC = 255; }
                ctx.fillStyle = `rgb(${rC*boost|0},${gC*boost|0},${bC*boost|0})`;
                ctx.fillText(char, (this.offsetX - (buf.width*cW/2) + c*cW) + (c%2===0?shift:-shift), this.offsetY + r*cH);
            }
        }
        ctx.restore();
    }
}
window.addEventListener('load', () => new SignalApp());
