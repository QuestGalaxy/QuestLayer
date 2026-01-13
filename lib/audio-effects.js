/**
 * Web Audio API Button Sound Effects
 * Provides synthesized sounds for UI interactions without external assets.
 */

let audioCtx = null;

/**
 * Initializes the AudioContext and resumes it if suspended (browser autoplay policy).
 */
const initAudio = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
};

/**
 * Synthesizes a sound using a Sine Wave oscillator.
 * @param {number} frequency - Frequency in Hz
 * @param {number} duration - Duration in seconds
 * @param {number} volume - Volume (0 to 1)
 */
const playSynthesizedSound = (frequency, duration, volume = 0.05) => {
    const ctx = initAudio();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Fade out to avoid clicks
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
};

/**
 * Unlock AudioContext on first user interaction.
 */
const unlockAudio = () => {
    initAudio();
    // Remove unlock listeners once initialized
    document.removeEventListener('click', unlockAudio);
    document.removeEventListener('touchstart', unlockAudio);
    document.removeEventListener('keydown', unlockAudio);
};

/**
 * Attach global event listeners using event delegation.
 * @param {Document|ShadowRoot} root - The root element to attach listeners to (default is document).
 */
const setupAudioListeners = (root = document) => {
    // Selectors for interactive elements
    const selectors = 'button, a, .btn, .nav__link, .ql-video-patrol, [role="button"]';

    // Click sound: 800Hz, 0.1s
    root.addEventListener('click', (e) => {
        // Handle shadow DOM by checking composedPath
        const target = e.composedPath ? e.composedPath().find(el => el.matches && el.matches(selectors)) : e.target.closest(selectors);
        
        if (target) {
            playSynthesizedSound(800, 0.1, 0.08);
        }
    }, { capture: true, passive: true });

    // Hover sound (using mouseover for better delegation support)
    root.addEventListener('mouseover', (e) => {
        const target = e.composedPath ? e.composedPath().find(el => el.matches && el.matches(selectors)) : e.target.closest(selectors);
        
        // Only play if we are entering the element from outside
        if (target && !target.contains(e.relatedTarget)) {
            playSynthesizedSound(1200, 0.05, 0.04);
        }
    }, { capture: true, passive: true });
};

// Add unlock listeners
document.addEventListener('click', unlockAudio);
document.addEventListener('touchstart', unlockAudio);
document.addEventListener('keydown', unlockAudio);

// Initialize listeners when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setupAudioListeners(document));
} else {
    setupAudioListeners(document);
}

export { playSynthesizedSound, initAudio, setupAudioListeners };
