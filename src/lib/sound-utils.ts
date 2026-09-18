// Notifyy Audio & Alarm Engine with Web Audio API & Device Vibration

let sharedAudioCtx: AudioContext | null = null;
let activeAlarmInterval: NodeJS.Timeout | null = null;
let activeVibrationInterval: NodeJS.Timeout | null = null;
let isAlarmRinging = false;

// Audio Context Singleton & User Gesture Auto-Unlocker
export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch (err) {
    console.warn("Failed to initialize AudioContext:", err);
    return null;
  }
}

// Automatically warm up AudioContext on first interaction
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    // Remove listeners once unlocked
    ["click", "touchstart", "keydown"].forEach((evt) => {
      window.removeEventListener(evt, unlockAudio);
    });
  };

  ["click", "touchstart", "keydown"].forEach((evt) => {
    window.addEventListener(evt, unlockAudio, { passive: true, once: true });
  });
}

// Single Melodic Chime / Short Alert
export function playNotificationSound(type: "chime" | "alert" | "success" = "chime") {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (type === "chime" || type === "success") {
      // Melodic 4-note chime
      const notes = [659.25, 830.61, 987.77, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.25, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } else if (type === "alert") {
      // Crisp 2-ping alert
      [880, 1174.66].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.001, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.3, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.4);
      });
    }
  } catch (err) {
    console.warn("Audio chime playback error:", err);
  }
}

// Continuous Alarm Ring Tone (Pulsing Loud Digital Alarm Pattern)
function playAlarmBurst(ctx: AudioContext) {
  try {
    const now = ctx.currentTime;
    // 3 rapid dual-tone beeps per burst (e.g. 1046.5Hz C6 + 1318.5Hz E6)
    const pulses = [0, 0.18, 0.36];

    pulses.forEach((offset) => {
      // High frequency oscillator 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(1046.5, now + offset);

      gain1.gain.setValueAtTime(0.001, now + offset);
      gain1.gain.exponentialRampToValueAtTime(0.35, now + offset + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.14);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now + offset);
      osc1.stop(now + offset + 0.15);

      // Harmonized oscillator 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(1318.5, now + offset);

      gain2.gain.setValueAtTime(0.001, now + offset);
      gain2.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.14);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + offset);
      osc2.stop(now + offset + 0.15);
    });
  } catch (err) {
    console.warn("Alarm burst play error:", err);
  }
}

// Start continuous looping alarm
export function startAlarmRing(durationSeconds: number = 45) {
  if (isAlarmRinging) return;
  isAlarmRinging = true;

  const ctx = getAudioContext();
  if (ctx) {
    // Play initial burst immediately
    playAlarmBurst(ctx);

    // Repeat alarm burst every 1.1 seconds
    activeAlarmInterval = setInterval(() => {
      if (ctx.state === "suspended") ctx.resume();
      playAlarmBurst(ctx);
    }, 1100);
  }

  // Intense repeating vibration pattern for phones
  triggerDeviceVibration([400, 200, 400, 200, 400]);
  activeVibrationInterval = setInterval(() => {
    triggerDeviceVibration([400, 200, 400, 200, 400]);
  }, 1800);

  // Auto silence after max duration (safety timeout)
  setTimeout(() => {
    stopAlarmRing();
  }, durationSeconds * 1000);
}

// Stop alarm ringing immediately
export function stopAlarmRing() {
  isAlarmRinging = false;
  if (activeAlarmInterval) {
    clearInterval(activeAlarmInterval);
    activeAlarmInterval = null;
  }
  if (activeVibrationInterval) {
    clearInterval(activeVibrationInterval);
    activeVibrationInterval = null;
  }
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(0); // Cancel ongoing vibration
    } catch (_) {}
  }
}

export function getIsAlarmRinging(): boolean {
  return isAlarmRinging;
}

export function triggerDeviceVibration(pattern: number[] = [150, 80, 150]) {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors
    }
  }
}