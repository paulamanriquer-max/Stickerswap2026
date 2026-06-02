export const playNotificationFeedback = () => {
  try {
    navigator.vibrate?.([80, 40, 80]);
  } catch {
    // Vibration support varies by browser and device.
  }

  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();
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
    window.setTimeout(() => {
      void audioContext.close().catch(() => {});
    }, 260);
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
