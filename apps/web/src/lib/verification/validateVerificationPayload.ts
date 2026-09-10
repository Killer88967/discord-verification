export interface VerificationPayload {
  deviceId: string;

  signals: {
    timezone: string;
    language: string;
    languages: string[];
    platform: string;

    screen: {
      width: number;
      height: number;
      colorDepth: number;
      pixelRatio: number;
    };

    hardwareConcurrency: number;
    maxTouchPoints: number;
  };
}

const MAX_DEVICE_ID_LENGTH = 128;
const MAX_STRING_LENGTH = 256;
const MAX_LANGUAGES = 16;

export function validateVerificationPayload(
  value: unknown,
): VerificationPayload | null {
  if (!isRecord(value)) {
    return null;
  }

  const { deviceId, signals } = value;

  if (
    typeof deviceId !== "string" ||
    deviceId.length === 0 ||
    deviceId.length > MAX_DEVICE_ID_LENGTH
  ) {
    return null;
  }

  if (!isRecord(signals)) {
    return null;
  }

  const {
    timezone,
    language,
    languages,
    platform,
    screen,
    hardwareConcurrency,
    maxTouchPoints,
  } = signals;

  if (
    !isValidString(timezone) ||
    !isValidString(language) ||
    !isValidString(platform)
  ) {
    return null;
  }

  if (
    !Array.isArray(languages) ||
    languages.length > MAX_LANGUAGES ||
    !languages.every(isValidString)
  ) {
    return null;
  }

  if (!isRecord(screen)) {
    return null;
  }

  const { width, height, colorDepth, pixelRatio } = screen;

  if (
    !isFiniteNumber(width) ||
    !isFiniteNumber(height) ||
    !isFiniteNumber(colorDepth) ||
    !isFiniteNumber(pixelRatio)
  ) {
    return null;
  }

  if (width <= 0 || height <= 0 || colorDepth <= 0 || pixelRatio <= 0) {
    return null;
  }

  if (
    !isFiniteNumber(hardwareConcurrency) ||
    hardwareConcurrency < 0 ||
    !Number.isInteger(hardwareConcurrency)
  ) {
    return null;
  }

  if (
    !isFiniteNumber(maxTouchPoints) ||
    maxTouchPoints < 0 ||
    !Number.isInteger(maxTouchPoints)
  ) {
    return null;
  }

  return {
    deviceId,
    signals: {
      timezone,
      language,
      languages,
      platform,
      screen: {
        width,
        height,
        colorDepth,
        pixelRatio,
      },
      hardwareConcurrency,
      maxTouchPoints,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_STRING_LENGTH
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
