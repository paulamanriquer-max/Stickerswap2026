type AudioWindow = typeof window & { webkitAudioContext?: typeof AudioContext };

let sharedAudioContext: AudioContext | null = null;

const getAudioContext = () => {
  const AudioContextClass = window.AudioContext || (window as AudioWindow).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioContextClass();
  }
  return sharedAudioContext;
};

export const installNotificationFeedbackUnlock = () => {
  const unlock = () => {
    try {
      void getAudioContext()?.resume();
    } catch {
      // Sound unlock is best effort and varies by browser.
    }
  };

  window.addEventListener('pointerdown', unlock, { once: true, passive: true });
  window.addEventListener('touchstart', unlock, { once: true, passive: true });

  return () => {
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('touchstart', unlock);
  };
};

export const playNotificationFeedback = () => {
  try {
    navigator.vibrate?.([80, 40, 80]);
  } catch {
    // Vibration support varies by browser and device.
  }

  try {
    const audioContext = getAudioContext();
    if (!audioContext) return;
    void audioContext.resume().catch(() => {});
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.18);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch {
    // Mobile browsers may block sound until the user has interacted with the page.
  }
};

export const showDeviceNotification = (title: string, body: string) => {
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  } catch {
    // Browser permission can exist even when the current device blocks notification UI.
  }
  playNotificationFeedback();
};
