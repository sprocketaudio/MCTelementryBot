import { ServerConfig } from '../config/servers';
import { logger } from '../utils/logger';

export interface PlayerInfo {
  name: string;
  uuid: string;
}

export interface TelemetryResponse {
  mc: string;
  loader: string;
  mspt: number;
  tps: number;
  players: PlayerInfo[];
}

interface CacheEntry {
  data: TelemetryResponse;
  timestamp: number;
}

const CACHE_TTL_MS = 10_000;
const cache = new Map<string, CacheEntry>();
const REQUEST_TIMEOUT_MS = 2_000;

const validateTelemetry = (payload: unknown): payload is TelemetryResponse => {
  if (!payload || typeof payload !== 'object') return false;
  const data = payload as Partial<TelemetryResponse>;

  return (
    typeof data.mc === 'string' &&
    typeof data.loader === 'string' &&
    typeof data.mspt === 'number' &&
    typeof data.tps === 'number' &&
    Array.isArray(data.players) &&
    data.players.every(
      (player) => player && typeof player.name === 'string' && typeof player.uuid === 'string'
    )
  );
};

export async function fetchTelemetry(
  server: ServerConfig,
  options: { forceRefresh?: boolean } = {}
): Promise<TelemetryResponse> {
  const cached = cache.get(server.id);
  const now = Date.now();

  if (!options.forceRefresh && cached && now - cached.timestamp < CACHE_TTL_MS) {
    logger.debug(`Serving cached telemetry for ${server.name}`);
    return cached.data;
  }

  logger.info(`Fetching telemetry for ${server.name}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(server.telemetryUrl, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = (await response.json()) as unknown;

    if (!validateTelemetry(payload)) {
      throw new Error('Invalid telemetry payload');
    }

    const data: TelemetryResponse = {
      ...payload,
      mspt: Number(payload.mspt),
      tps: Number(payload.tps),
    };

    cache.set(server.id, { data, timestamp: now });
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export function clearTelemetryCache(): void {
  cache.clear();
}
