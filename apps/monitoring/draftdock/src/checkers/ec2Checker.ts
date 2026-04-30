import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'ssh2';
import { config } from '../config';
import type { CheckResult } from '../types';

/**
 * EC2 checks via pure-JS SSH (ssh2) — no exec() / shell spawn needed.
 * Instance IPs come from EC2_INSTANCE_IPS in .env.
 */
export async function runEc2Checks(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const ips = config.ec2.instanceIps;
  const now = new Date().toISOString();

  if (ips.length === 0) {
    results.push({ id: 'ec2-status', name: 'EC2 Instance Status', group: 'ec2', status: 'WARNING', responseTimeMs: 0, message: 'EC2_INSTANCE_IPS not set in .env — skipping EC2 checks', timestamp: now, severity: 'WARNING' });
    results.push({ id: 'ec2-checks', name: 'EC2 System/Instance Checks', group: 'ec2', status: 'UNKNOWN', responseTimeMs: 0, message: 'No IPs configured', timestamp: now, severity: 'WARNING' });
    results.push({ id: 'ec2-ssh', name: 'EC2 SSH Reachability', group: 'ec2', status: 'UNKNOWN', responseTimeMs: 0, message: 'No IPs configured', timestamp: now, severity: 'WARNING' });
    return results;
  }

  const primaryIp = ips[0];
  const sshResult = await sshPing(primaryIp);
  const status = sshResult.ok ? 'UP' : 'DOWN';

  results.push({ id: 'ec2-status', name: 'EC2 Instance Status', group: 'ec2', status, responseTimeMs: sshResult.elapsed, message: sshResult.ok ? `Instance reachable via SSH at ${primaryIp}` : `Instance unreachable: ${sshResult.error}`, timestamp: new Date().toISOString(), severity: 'CRITICAL', details: { publicIp: primaryIp, allIps: ips } });
  results.push({ id: 'ec2-checks', name: 'EC2 System/Instance Checks', group: 'ec2', status, responseTimeMs: sshResult.elapsed, message: sshResult.ok ? 'SSH handshake OK — instance healthy' : `SSH failed: ${sshResult.error}`, timestamp: new Date().toISOString(), severity: 'CRITICAL', details: { publicIp: primaryIp } });
  results.push({ id: 'ec2-ssh', name: 'EC2 SSH Reachability', group: 'ec2', status, responseTimeMs: sshResult.elapsed, message: sshResult.ok ? `SSH OK: ${primaryIp}` : `SSH failed: ${sshResult.error}`, timestamp: new Date().toISOString(), severity: 'CRITICAL', details: { publicIp: primaryIp } });

  return results;
}

function resolveKeyPath(): string {
  const raw = config.ec2Ssh.keyPath;
  return raw.startsWith('/') ? raw : path.resolve(process.cwd(), raw);
}

function sshPing(host: string): Promise<{ ok: boolean; elapsed: number; error?: string }> {
  const start = Date.now();
  return new Promise((resolve) => {
    let keyBuf: Buffer;
    try { keyBuf = fs.readFileSync(resolveKeyPath()); }
    catch (e: any) { return resolve({ ok: false, elapsed: 0, error: `Cannot read key: ${e.message}` }); }

    const conn = new Client();
    const timer = setTimeout(() => { conn.end(); resolve({ ok: false, elapsed: Date.now() - start, error: 'Connection timeout' }); }, 12000);

    conn.on('ready', () => {
      clearTimeout(timer);
      conn.exec('echo ok', (err, stream) => {
        conn.end();
        resolve({ ok: !err, elapsed: Date.now() - start, error: err?.message });
        stream?.resume();
      });
    });

    conn.on('error', (err) => {
      clearTimeout(timer);
      resolve({ ok: false, elapsed: Date.now() - start, error: err.message });
    });

    conn.connect({ host, port: 22, username: config.ec2Ssh.user, privateKey: keyBuf, readyTimeout: 10000 });
  });
}
