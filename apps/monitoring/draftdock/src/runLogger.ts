import * as fs from 'fs';
import * as path from 'path';
import type { CheckResult } from './types';

const LOGS_DIR = path.join(__dirname, '..', 'logs');

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

let latestLogFile: string | null = null;

export function getLatestLogFile(): string | null {
  return latestLogFile;
}

export function writeRunLog(results: CheckResult[]): void {
  const now = new Date();
  const ts = now
    .toISOString()
    .replace(/:/g, '-')
    .replace(/\.\d+Z$/, '')
    .replace('T', 'T');

  const filename = `run-${ts}.json`;
  const filePath = path.join(LOGS_DIR, filename);

  const logEntry: Record<string, object> = {};
  for (const r of results) {
    logEntry[r.id] = {
      id: r.id,
      name: r.name,
      group: r.group,
      status: r.status,
      severity: r.severity,
      responseTimeMs: r.responseTimeMs,
      timestamp: r.timestamp,
      message: r.message,
      details: r.details || null,
    };
  }

  const payload = {
    runAt: now.toISOString(),
    totalChecks: results.length,
    summary: {
      up: results.filter((r) => r.status === 'UP').length,
      down: results.filter((r) => r.status === 'DOWN').length,
      warning: results.filter((r) => r.status === 'WARNING').length,
    },
    checks: logEntry,
  };

  try {
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
    latestLogFile = filePath;
    console.log(`📝 Run log written: ${filename}`);
    pruneOldLogs();
  } catch (err: any) {
    console.error(`❌ Failed to write run log: ${err.message}`);
  }
}

const MAX_LOG_FILES = 10;
const PRUNE_COUNT = 4;

function pruneOldLogs(): void {
  const files = getRunLogFiles();
  if (files.length <= MAX_LOG_FILES) return;

  const toDelete = files.slice(0, PRUNE_COUNT);
  for (const f of toDelete) {
    try {
      fs.unlinkSync(path.join(LOGS_DIR, f));
      console.log(`🗑️  Pruned old log: ${f}`);
    } catch (err: any) {
      console.error(`⚠️  Could not delete log ${f}: ${err.message}`);
    }
  }
}

export function getCheckLog(checkId: string): object | null {
  if (!latestLogFile || !fs.existsSync(latestLogFile)) {
    const files = getRunLogFiles();
    if (files.length === 0) return null;
    latestLogFile = path.join(LOGS_DIR, files[files.length - 1]);
  }

  try {
    const raw = fs.readFileSync(latestLogFile, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed.checks?.[checkId] || null;
  } catch {
    return null;
  }
}

export function getRunLogFiles(): string[] {
  try {
    return fs
      .readdirSync(LOGS_DIR)
      .filter((f) => f.startsWith('run-') && f.endsWith('.json'))
      .sort();
  } catch {
    return [];
  }
}

export function getRunLog(filename: string): object | null {
  const safe = path.basename(filename);
  if (!safe.startsWith('run-') || !safe.endsWith('.json')) return null;
  const filePath = path.join(LOGS_DIR, safe);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
