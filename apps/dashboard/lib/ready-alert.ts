// Aviso de "pedido listo" para el mozo: campanita (Web Audio, sin archivos), vibración y notificación del sistema.

let audio: AudioContext | null = null;

/** Los navegadores solo dejan sonar audio y pedir permiso de notificaciones tras un toque del usuario. */
export async function enableReadyAlerts(): Promise<NotificationPermission | 'unsupported'> {
  try { audio ??= new AudioContext(); await audio.resume(); } catch { /* sin audio: queda la vibración y el aviso */ }
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission === 'default' ? Notification.requestPermission() : Notification.permission;
}

export function notificationsState(): NotificationPermission | 'unsupported' {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}

export function readyAlert(title: string, body: string) {
  chime();
  try { navigator.vibrate?.([200, 100, 200]); } catch { /* iOS no vibra desde la web */ }
  // Con la pestaña a la vista basta el aviso en pantalla; la notificación es para cuando está en segundo plano.
  if (notificationsState() === 'granted' && document.visibilityState !== 'visible') {
    try { new Notification(title, { body, tag: title }); } catch { /* algunos Android solo notifican vía service worker */ }
  }
}

function chime() {
  if (!audio || audio.state !== 'running') return;
  const now = audio.currentTime;
  [880, 1320].forEach((freq, i) => {
    const osc = audio!.createOscillator();
    const gain = audio!.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + i * 0.18);
    gain.gain.exponentialRampToValueAtTime(0.3, now + i * 0.18 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.35);
    osc.connect(gain).connect(audio!.destination);
    osc.start(now + i * 0.18);
    osc.stop(now + i * 0.18 + 0.4);
  });
}
