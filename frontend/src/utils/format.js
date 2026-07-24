export function formatMissionTime(seconds) {
  const sign = seconds < 0 ? "-" : "+";
  const s = Math.abs(Math.floor(seconds));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `T${sign}${hh}:${mm}:${ss}`;
}

export function formatClock(date = new Date()) {
  return date.toTimeString().slice(0, 8);
}

export function formatDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function pad(n, w = 2) {
  return String(n).padStart(w, "0");
}
