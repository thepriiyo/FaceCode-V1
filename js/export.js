/**
 * SIGNAL EXPORT SYSTEM v1.2
 * Universal MP4/H.264 Encoder Bridge
 */

window.ExportSystem = class ExportSystem {
    constructor() {
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        
        // v9.5 UNIVERSAL FORMAT DETECTION
        this.mimeType = 'video/webm; codecs=vp9';
        if (MediaRecorder.isTypeSupported('video/mp4; codecs=avc1')) {
            this.mimeType = 'video/mp4; codecs=avc1';
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
            this.mimeType = 'video/mp4';
        }
    }

    async takeSnapshot(canvas) {
        try {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `signal-shot-${Date.now()}.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
            return true;
        } catch(e) { return false; }
    }

    toggleRecording(canvas) {
        if (this.isRecording) {
            this.stopRecording();
            return "RECORD";
        } else {
            this.startRecording(canvas);
            return "STOP_RECORD";
        }
    }

    startRecording(canvas) {
        this.recordedChunks = [];
        try {
            const stream = canvas.captureStream(30);
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: this.mimeType
            });

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.recordedChunks.push(e.data);
            };

            this.mediaRecorder.onstop = () => this.saveVideo();
            this.mediaRecorder.start();
            this.isRecording = true;
        } catch(e) {
            console.error("Recording failed. Falling back to default WebM.", e);
            try {
                const stream = canvas.captureStream(30);
                this.mediaRecorder = new MediaRecorder(stream);
                this.mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) this.recordedChunks.push(e.data); };
                this.mediaRecorder.onstop = () => this.saveVideo();
                this.mediaRecorder.start();
                this.isRecording = true;
            } catch(f) { alert("MEDIA_NOT_SUPPORTED"); }
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
        }
    }

    saveVideo() {
        if (this.recordedChunks.length === 0) return;
        
        const extension = this.mimeType.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(this.recordedChunks, { type: this.mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `signal-clip-${Date.now()}.${extension}`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    }
}
