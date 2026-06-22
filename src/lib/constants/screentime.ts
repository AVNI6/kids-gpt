export const SCREENTIME_HEARTBEAT_INTERVALS = {
  SAFE: 90,      // Sync interval in seconds when remaining time is > 20 mins (or limit is disabled)
  MEDIUM: 45,    // Sync interval in seconds when remaining time is between 10 and 20 mins
  WARNING: 30,   // Sync interval in seconds when remaining time is between 5 and 10 mins
  DANGER: 15,    // Sync interval in seconds when remaining time is <= 5 mins
  DEFAULT: 15,   // Fallback interval if adaptive heartbeat is disabled
};

export const SCREENTIME_THRESHOLDS = {
  SAFE_MINUTES: 20,
  MEDIUM_MINUTES: 10,
  WARNING_MINUTES: 5,
};

export const FEATURE_FLAGS = {
  ENABLE_ADAPTIVE_HEARTBEAT: true,
};
