import { config } from './config';
import { httpCheck, okValidator, aliveValidator, successJsonValidator } from './checkers/httpChecker';
import { runDbChecks } from './checkers/dbChecker';
import { runEc2Checks } from './checkers/ec2Checker';
import { fetchEc2Logs } from './checkers/ec2LogChecker';
import { processResults } from './alerter';
import { recordResults } from './history';
import { writeRunLog } from './runLogger';
import type { CheckResult } from './types';

const BE = config.urls.be;
const FE = config.urls.fe;

let latestResults: CheckResult[] = [];
let lastRunTime: string | null = null;
let isRunning = false;

export function getLatestResults(): CheckResult[] { return latestResults; }
export function getLastRunTime(): string | null { return lastRunTime; }
export function isCheckRunning(): boolean { return isRunning; }

export async function runAllChecks(): Promise<CheckResult[]> {
  if (isRunning) {
    console.log('⏳ Check cycle already in progress, skipping...');
    return latestResults;
  }

  isRunning = true;
  const start = Date.now();
  console.log(`\n🔍 Starting DraftDock health check cycle at ${new Date().toISOString()}`);

  const allResults: CheckResult[] = [];

  // ── 1. Backend core health ────────────────────────────────
  const beHealthChecks = await Promise.allSettled([
    httpCheck({ id: 'be-health',  name: 'Backend /health',  group: 'backend-health', url: `${BE}/health`,  validate: okValidator,    severity: 'CRITICAL' }),
    httpCheck({ id: 'be-version', name: 'Backend /version', group: 'backend-health', url: `${BE}/version`, validate: aliveValidator, severity: 'NOTICE'   }),
    httpCheck({ id: 'be-redis',   name: 'Backend /redis-test (Redis via BE)', group: 'backend-health', url: `${BE}/redis-test`, validate: aliveValidator, severity: 'WARNING' }),
  ]);
  allResults.push(...beHealthChecks.map(settledValue));

  // ── 2. Public blog API probes ─────────────────────────────
  const blogChecks = await Promise.allSettled([
    httpCheck({ id: 'api-blogs',          name: 'GET /api/blogs',          group: 'feature-api', url: `${BE}/api/blogs`,          validate: aliveValidator, severity: 'CRITICAL', noRetry: true }),
    httpCheck({ id: 'api-blogs-trending', name: 'GET /api/blogs/trending', group: 'feature-api', url: `${BE}/api/blogs/trending`, validate: aliveValidator, severity: 'WARNING',  noRetry: true }),
    httpCheck({ id: 'api-blogs-featured', name: 'GET /api/blogs/featured', group: 'feature-api', url: `${BE}/api/blogs/featured`, validate: aliveValidator, severity: 'WARNING',  noRetry: true }),
    httpCheck({ id: 'api-blogs-search',   name: 'GET /api/blogs/search',   group: 'feature-api', url: `${BE}/api/blogs/search?q=test`, validate: aliveValidator, severity: 'NOTICE', noRetry: true }),
  ]);
  allResults.push(...blogChecks.map(settledValue));

  // ── 3. Public tag & discovery probes ─────────────────────
  const tagChecks = await Promise.allSettled([
    httpCheck({ id: 'api-tags',          name: 'GET /api/tags',          group: 'feature-api', url: `${BE}/api/tags`,          validate: aliveValidator, severity: 'WARNING', noRetry: true }),
    httpCheck({ id: 'api-tags-trending', name: 'GET /api/tags/trending', group: 'feature-api', url: `${BE}/api/tags/trending`, validate: aliveValidator, severity: 'WARNING', noRetry: true }),
    httpCheck({ id: 'api-achievements',  name: 'GET /api/achievements/all', group: 'feature-api', url: `${BE}/api/achievements/all`, validate: aliveValidator, severity: 'NOTICE', noRetry: true }),
  ]);
  allResults.push(...tagChecks.map(settledValue));

  // ── 4. Auth-gated probes — 401 = server alive ────────────
  // We use aliveValidator (treats 401/403 as UP, only 5xx = DOWN)
  const authGatedChecks = await Promise.allSettled([
    httpCheck({ id: 'api-user',          name: 'GET /api/user (auth)',          group: 'feature-api', url: `${BE}/api/user`,          validate: aliveValidator, severity: 'CRITICAL', noRetry: true }),
    httpCheck({ id: 'api-bookmarks',     name: 'GET /api/user/bookmarks (auth)', group: 'feature-api', url: `${BE}/api/user/bookmarks`, validate: aliveValidator, severity: 'WARNING', noRetry: true }),
    httpCheck({ id: 'api-notifications', name: 'GET /api/user/notifications (auth)', group: 'feature-api', url: `${BE}/api/user/notifications`, validate: aliveValidator, severity: 'WARNING', noRetry: true }),
    httpCheck({ id: 'api-messaging',     name: 'GET /api/messaging/conversations (auth)', group: 'feature-api', url: `${BE}/api/messaging/conversations`, validate: aliveValidator, severity: 'WARNING', noRetry: true }),
    httpCheck({ id: 'api-analytics',     name: 'GET /api/analytics (auth)',     group: 'feature-api', url: `${BE}/api/analytics`,     validate: aliveValidator, severity: 'NOTICE',   noRetry: true }),
    httpCheck({ id: 'api-admin',         name: 'GET /api/admin (auth)',         group: 'feature-api', url: `${BE}/api/admin`,         validate: aliveValidator, severity: 'WARNING',  noRetry: true }),
    httpCheck({ id: 'api-collab',        name: 'GET /api/collab (auth)',        group: 'feature-api', url: `${BE}/api/collab`,        validate: aliveValidator, severity: 'NOTICE',   noRetry: true }),
  ]);
  allResults.push(...authGatedChecks.map(settledValue));

  // ── 5. Frontend reachability ──────────────────────────────
  const feChecks = await Promise.allSettled([
    httpCheck({ id: 'fe-home', name: 'Frontend Homepage', group: 'frontend-api', url: `${FE}`, validate: aliveValidator, severity: 'CRITICAL' }),
  ]);
  allResults.push(...feChecks.map(settledValue));

  // ── 6. Database (Postgres / NeonDB) ──────────────────────
  try {
    const dbResults = await runDbChecks();
    allResults.push(...dbResults);
  } catch (e: any) { console.error('DB checks failed:', e.message); }

  // ── 7. EC2 TCP health ────────────────────────────────────
  try {
    const ec2Results = await runEc2Checks();
    allResults.push(...ec2Results);

    const ec2Status = ec2Results.find(r => r.id === 'ec2-status' || r.id === 'ec2-status-0');
    const publicIp = ec2Status?.details?.publicIp || ec2Status?.details?.ip;
    if (publicIp) {
      const logResults = await fetchEc2Logs(publicIp);
      allResults.push(...logResults);
    }
  } catch (e: any) { console.error('EC2 checks failed:', e.message); }

  latestResults = allResults;
  lastRunTime = new Date().toISOString();

  await processResults(allResults);
  recordResults(allResults);
  writeRunLog(allResults);

  const elapsed = Date.now() - start;
  const up   = allResults.filter(r => r.status === 'UP').length;
  const down = allResults.filter(r => r.status === 'DOWN').length;
  const warn = allResults.filter(r => r.status === 'WARNING').length;
  console.log(`✅ Check cycle complete: ${allResults.length} checks in ${elapsed}ms — ✅${up} ❌${down} ⚠️  ${warn}`);

  isRunning = false;
  return latestResults;
}

function settledValue(r: PromiseSettledResult<CheckResult>): CheckResult {
  if (r.status === 'fulfilled') return r.value;
  return {
    id: 'unknown', name: 'Unknown', group: 'backend-health',
    status: 'DOWN', responseTimeMs: 0,
    message: (r as PromiseRejectedResult).reason?.message || 'Error',
    timestamp: new Date().toISOString(), severity: 'CRITICAL',
  };
}
