/**
 * FACECODE SETTINGS MANAGER v1.0
 * DNA-synchronized persistence for FaceCode V1
 */

window.SettingsManager = class SettingsManager {
    constructor() {
        this.STORAGE_KEY = 'facecode_v1_settings';
    }

    save(settings) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error("Settings preservation failed:", e);
        }
    }

    load() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }
}
