import { Pool } from 'pg';
import { config } from '../config';
import type { CheckResult } from '../types';

/** Simple Postgres health check using connection string from env */
export async function runDbChecks(): Promise<CheckResult[]> {
  const url = config.neonDbUrl;
  const now = new Date().toISOString();
  if (!url) {
    return [{ id: 'db-conn', name: 'Database (Postgres) — not configured', group: 'database', status: 'UNKNOWN', responseTimeMs: 0, message: 'No DATABASE_URL/NEONDB_URL provided', timestamp: now, severity: 'WARNING' }];
  }

  // Ensure we explicitly request the current behaviour for SSL. The pg-connection-string
  // package warns when sslmode is 'require'|'prefer'|'verify-ca' — convert those to
  // 'verify-full' to preserve the current behaviour and silence the deprecation warning.
  let conn = url;
  try {
    conn = url.replace(/(sslmode=)(require|prefer|verify-ca)/i, '$1verify-full');
  } catch (_) { conn = url; }

  const pool = new Pool({ connectionString: conn, max: 1, idleTimeoutMillis: 1000 });
  const start = Date.now();
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      const elapsed = Date.now() - start;
      return [{ id: 'db-conn', name: 'Database (Postgres)', group: 'database', status: 'UP', responseTimeMs: elapsed, message: 'Postgres reachable', timestamp: now, severity: 'CRITICAL' }];
    } finally {
      client.release();
    }
  } catch (err: any) {
    const elapsed = Date.now() - start;
    return [{ id: 'db-conn', name: 'Database (Postgres)', group: 'database', status: 'DOWN', responseTimeMs: elapsed, message: err.message || 'Connection failed', timestamp: now, severity: 'CRITICAL', details: { err: err.message } }];
  } finally {
    try { await pool.end(); } catch {}
  }
}
