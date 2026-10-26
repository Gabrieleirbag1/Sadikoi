/** Random id of this browser / phone, kept in localStorage (sent at login and with the push token). */
export function getDeviceId(): string {
  const saved = localStorage.getItem('device_id');
  if (saved) {
    return saved;
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const deviceId = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  localStorage.setItem('device_id', deviceId);
  return deviceId;
}
