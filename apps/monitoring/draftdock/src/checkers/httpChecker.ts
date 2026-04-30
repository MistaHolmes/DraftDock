import axios from 'axios';
import https from 'https';
import type { CheckResult, ServiceGroup, Severity } from '../types';

interface HttpCheckOptions {
  id: string;
  name: string;
  group: ServiceGroup;
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  severity?: Severity;
  noRetry?: boolean;
  slowThresholdMs?: number;
  validate?: (status: number, data: any) => string | null;
}

const HTTP_RETRY_COUNT = 2;
const HTTP_RETRY_DELAY_MS = 1500;
const DEFAULT_TIMEOUT = 10_000;
const DEFAULT_SLOW_THRESHOLD = 8_000;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function httpCheck(opts: HttpCheckOptions): Promise<CheckResult> {
  const method = opts.method || 'GET';
  const timeout = opts.timeout ?? DEFAULT_TIMEOUT;
  const slowThreshold = opts.slowThresholdMs ?? DEFAULT_SLOW_THRESHOLD;
  let maxAttempts = opts.noRetry ? 1 : HTTP_RETRY_COUNT + 1;

  let lastError: string | null = null;
  let lastHttpStatus: number | undefined;
  let totalElapsed = 0;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await sleep(HTTP_RETRY_DELAY_MS);

    const start = Date.now();
    try {
      const resp = await axios({
        method,
        url: opts.url,
        headers: opts.headers || {},
        data: opts.body,
        timeout,
        validateStatus: () => true,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      });

      const elapsed = Date.now() - start;
      totalElapsed += elapsed;

      const validator = opts.validate || defaultValidator;
      const error = validator(resp.status, resp.data);

      if (!error) {
        const isSlow = elapsed > slowThreshold;
        const retryNote = attempt > 0
          ? ` (recovered after ${attempt} retr${attempt === 1 ? 'y' : 'ies'})`
          : '';
        const slowNote = isSlow ? `⚠️ Slow (${elapsed}ms) — ` : '';

        return {
          id: opts.id,
          name: opts.name,
          group: opts.group,
          status: 'UP',
          responseTimeMs: elapsed,
          message: `${slowNote}${method} ${resp.status} OK${retryNote}`,
          timestamp: new Date().toISOString(),
          severity: opts.severity || 'CRITICAL',
          details: { httpStatus: resp.status, attempts: attempt + 1, slow: isSlow },
        };
      }

      lastError = error;
      lastHttpStatus = resp.status;
    } catch (err: any) {
      const elapsed = Date.now() - start;
      totalElapsed += elapsed;

      if (err.code === 'ECONNABORTED') {
        lastError = `Timeout after ${timeout}ms`;
      } else if (err.code === 'ECONNRESET') {
        lastError = 'Connection reset by peer (ECONNRESET)';
        if (opts.noRetry && attempt === 0) {
          maxAttempts = 2;
        }
      } else {
        lastError = err.message || 'Connection failed';
      }
    }
  }

  return {
    id: opts.id,
    name: opts.name,
    group: opts.group,
    status: 'DOWN',
    responseTimeMs: totalElapsed,
    message: maxAttempts > 1
      ? `${lastError} (failed after ${maxAttempts} attempts)`
      : `${lastError}`,
    timestamp: new Date().toISOString(),
    severity: opts.severity || 'CRITICAL',
    details: { httpStatus: lastHttpStatus, attempts: maxAttempts },
  };
}

function defaultValidator(status: number, _data: any): string | null {
  if (status >= 500) return `Server error: ${status}`;
  return null;
}

export function successJsonValidator(status: number, data: any): string | null {
  if (status >= 500) return `Server error: ${status}`;
  if (status !== 200) return `Unexpected status: ${status}`;
  if (data && data.success === false) return `API returned success: false`;
  return null;
}

export function aliveValidator(status: number, _data: any): string | null {
  if (status >= 500) return `Server error: ${status}`;
  return null;
}

export function okValidator(status: number, _data: any): string | null {
  if (status >= 500) return `Server error: ${status}`;
  if (status !== 200 && status !== 404) return `Expected 200/404, got ${status}`;
  return null;
}
