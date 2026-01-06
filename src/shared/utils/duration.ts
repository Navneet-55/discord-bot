export interface DurationParseResult {
  success: boolean;
  milliseconds?: number;
  error?: string;
}

const MIN_DURATION_MS = 10 * 1000; // 10 seconds
const MAX_DURATION_MS = 28 * 24 * 60 * 60 * 1000; // 28 days

export function parseDuration(input: string): DurationParseResult {
  const trimmed = input.trim().toLowerCase();

  // Match pattern: number + suffix
  const match = trimmed.match(/^(\d+)([smhd])$/);
  if (!match) {
    return {
      success: false,
      error: 'Invalid format. Use: 10s, 5m, 2h, 1d (min: 10s, max: 28d)',
    };
  }

  const value = parseInt(match[1], 10);
  const suffix = match[2];

  if (value <= 0) {
    return {
      success: false,
      error: 'Duration must be greater than 0',
    };
  }

  let milliseconds: number;

  switch (suffix) {
    case 's':
      milliseconds = value * 1000;
      break;
    case 'm':
      milliseconds = value * 60 * 1000;
      break;
    case 'h':
      milliseconds = value * 60 * 60 * 1000;
      break;
    case 'd':
      milliseconds = value * 24 * 60 * 60 * 1000;
      break;
    default:
      return {
        success: false,
        error: 'Invalid suffix. Use: s, m, h, d',
      };
  }

  if (milliseconds < MIN_DURATION_MS) {
    return {
      success: false,
      error: `Duration too short. Minimum is 10s`,
    };
  }

  if (milliseconds > MAX_DURATION_MS) {
    return {
      success: false,
      error: `Duration too long. Maximum is 28d`,
    };
  }

  return {
    success: true,
    milliseconds,
  };
}

