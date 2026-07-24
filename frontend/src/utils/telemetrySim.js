/**
 * Realistic CanSat telemetry simulator with state machine phases.
 * Timeline (seconds):
 *   [0,3)      LAUNCH     - motor ignition, altitude 0->10m
 *   [3,55)     ASCENT     - accelerate up to ~500m
 *   [55,68)    APOGEE     - plateau around apogee
 *   [68,72)    SEPARATION - payload separation event
 *   [72,140)   DESCENT    - parachute descent
 *   [140,150)  LANDING    - final approach
 *   [150,∞)    RECOVERY   - on ground
 */

export const PHASES = [
  "IDLE",
  "LAUNCH",
  "ASCENT",
  "APOGEE",
  "SEPARATION",
  "DESCENT",
  "LANDING",
  "RECOVERY",
];

const APOGEE_ALT = 520; // meters

function phaseForTime(t) {
  if (t < 3) return "LAUNCH";
  if (t < 55) return "ASCENT";
  if (t < 68) return "APOGEE";
  if (t < 72) return "SEPARATION";
  if (t < 140) return "DESCENT";
  if (t < 150) return "LANDING";
  return "RECOVERY";
}

function altitudeForTime(t) {
  if (t < 3) return 2 + t * 3; // 2..11m
  if (t < 55) {
    // ease-out ascent
    const p = (t - 3) / 52;
    return 11 + (APOGEE_ALT - 11) * (1 - Math.pow(1 - p, 1.7));
  }
  if (t < 68) {
    // plateau with small oscillation
    return APOGEE_ALT + Math.sin((t - 55) * 0.6) * 6;
  }
  if (t < 72) {
    // separation event: small dip
    const p = (t - 68) / 4;
    return APOGEE_ALT - 15 * p;
  }
  if (t < 140) {
    // parachute descent - slow steady
    const p = (t - 72) / 68;
    return Math.max(3, (APOGEE_ALT - 15) * (1 - p));
  }
  if (t < 150) {
    return Math.max(0, 8 * (1 - (t - 140) / 10));
  }
  return 0;
}

function noise(amp) {
  return (Math.random() - 0.5) * 2 * amp;
}

/**
 * Generate one telemetry packet.
 * @param {number} t - mission time in seconds
 * @param {number} packetNumber
 * @param {object} baseLocation - {lat, lon}
 * @param {object} flags - {emergencyParachute, manualSeparation}
 * @param {number} prevAlt - previous altitude to compute descent rate
 * @returns telemetry packet
 */
export function generatePacket(t, packetNumber, baseLocation, flags = {}, prevAlt = null) {
  const phase = phaseForTime(t);
  let altitude = altitudeForTime(t);
  altitude += noise(0.6);
  if (altitude < 0) altitude = 0;

  // Pressure: standard atmosphere approx (hPa) at altitude
  const pressure = 1013.25 * Math.pow(1 - (0.0065 * altitude) / 288.15, 5.255) + noise(0.3);

  // Temperature: 25C at ground, decreases with altitude ~6.5C/km
  const temperature = 25 - 0.0065 * altitude + noise(0.3);

  // Humidity varies inversely with altitude
  const humidity = Math.max(20, Math.min(85, 65 - altitude * 0.04 + noise(1.5)));

  // Battery voltage drops slowly over mission
  const voltage = Math.max(6.8, 8.4 - t * 0.005 + noise(0.02));
  const battery = Math.max(0, Math.min(100, ((voltage - 6.8) / (8.4 - 6.8)) * 100));

  // GPS - drift small random circle around base
  const drift = 0.0004 * (altitude / APOGEE_ALT);
  const lat = baseLocation.lat + Math.sin(t * 0.05) * drift + noise(0.00005);
  const lon = baseLocation.lon + Math.cos(t * 0.05) * drift + noise(0.00005);
  const satellites = phase === "RECOVERY" && Math.random() < 0.1 ? 3 : 6 + Math.floor(Math.random() * 6);
  const gpsLost = satellites < 4;

  // Orientation
  let roll = Math.sin(t * 0.9) * 12 + noise(1.5);
  let pitch = Math.cos(t * 0.7) * 10 + noise(1.5);
  let yaw = (t * 6) % 360;
  if (phase === "DESCENT") {
    roll += Math.sin(t * 1.6) * 8;
    pitch += Math.cos(t * 1.8) * 6;
  }
  if (phase === "RECOVERY") {
    roll = noise(2);
    pitch = noise(2);
  }

  // Descent rate: dAlt/dt (m/s). Positive when descending.
  const descentRate = prevAlt != null ? (prevAlt - altitude) / 1 : 0;
  // Velocity (upward positive)
  const velocity = -descentRate;

  // Acceleration
  const accel_x = noise(0.5);
  const accel_y = noise(0.5);
  let accel_z = 9.81 + noise(0.3);
  if (phase === "LAUNCH" || phase === "ASCENT") accel_z += 5 + noise(0.5);

  // Statuses
  const containerStatus =
    phase === "LAUNCH" || phase === "ASCENT" || phase === "APOGEE"
      ? "SEALED"
      : "DEPLOYED";
  const payloadStatus =
    phase === "LAUNCH" || phase === "ASCENT" || phase === "APOGEE"
      ? "STOWED"
      : flags.manualSeparation || phase !== "SEPARATION"
      ? "RELEASED"
      : "SEPARATING";

  // Error code (4 digits)
  const d1 = descentRate > 25 ? 1 : 0; // descent rate fault
  const d2 = gpsLost ? 1 : 0; // gps lost
  const d3 =
    phase === "DESCENT" && payloadStatus !== "RELEASED" ? 1 : 0; // separation failure
  const d4 = flags.emergencyParachute ? 1 : 0;
  const errorCode = `${d1}${d2}${d3}${d4}`;

  return {
    packet_number: packetNumber,
    mission_time: parseFloat(t.toFixed(1)),
    phase,
    altitude: parseFloat(altitude.toFixed(2)),
    pressure: parseFloat(pressure.toFixed(2)),
    temperature: parseFloat(temperature.toFixed(2)),
    humidity: parseFloat(humidity.toFixed(2)),
    voltage: parseFloat(voltage.toFixed(2)),
    battery: parseFloat(battery.toFixed(1)),
    latitude: parseFloat(lat.toFixed(6)),
    longitude: parseFloat(lon.toFixed(6)),
    satellites,
    roll: parseFloat(roll.toFixed(2)),
    pitch: parseFloat(pitch.toFixed(2)),
    yaw: parseFloat(yaw.toFixed(2)),
    descent_rate: parseFloat(descentRate.toFixed(2)),
    velocity: parseFloat(velocity.toFixed(2)),
    accel_x: parseFloat(accel_x.toFixed(3)),
    accel_y: parseFloat(accel_y.toFixed(3)),
    accel_z: parseFloat(accel_z.toFixed(3)),
    container_status: containerStatus,
    payload_status: payloadStatus,
    error_code: errorCode,
  };
}

/**
 * Parse serial packet string.
 * Format: packetNum,alt,pressure,temp,voltage,lat,lon,sats,roll,pitch,yaw,descentRate
 */
export function parseSerialPacket(line) {
  const parts = line.trim().split(",").map((s) => s.trim());
  if (parts.length < 12) return null;
  const [pn, alt, pres, temp, volt, lat, lon, sats, roll, pitch, yaw, dr] = parts;
  return {
    packet_number: parseInt(pn, 10),
    mission_time: 0,
    phase: "UNKNOWN",
    altitude: parseFloat(alt),
    pressure: parseFloat(pres),
    temperature: parseFloat(temp),
    humidity: 0,
    voltage: parseFloat(volt),
    battery: 0,
    latitude: parseFloat(lat),
    longitude: parseFloat(lon),
    satellites: parseInt(sats, 10),
    roll: parseFloat(roll),
    pitch: parseFloat(pitch),
    yaw: parseFloat(yaw),
    descent_rate: parseFloat(dr),
    velocity: -parseFloat(dr),
    accel_x: 0,
    accel_y: 0,
    accel_z: 9.81,
    container_status: "UNKNOWN",
    payload_status: "UNKNOWN",
    error_code: "0000",
  };
}
