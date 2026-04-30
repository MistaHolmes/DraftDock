import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'ssh2';
import { config } from '../config';
import type { CheckResult } from '../types';

const EC2_SERVICES = [
  {
    name: 'draftdock-be',
    logCmd: 'sudo docker logs draftdock-be --tail 100 2>&1 || docker logs draftdock-be --tail 100 2>&1 || echo "Container draftdock-be not found or permission denied"',
  },
  {
    name: 'nginx',
    logCmd: 'sudo journalctl -u nginx.service --no-pager -n 50 2>/dev/null || sudo tail -n 50 /var/log/nginx/error.log 2>/dev/null || echo "No nginx logs found"',
  },
  {
    name: 'system',
    logCmd: 'top -b -n 1 | head -n 20 && echo "---" && df -h && echo "---" && free -h',
  },
];

let cachedLogs: Record<string, { logs: string; timestamp: string; error?: string }> = {};

export function getCachedLogs() {
  return cachedLogs;
}

export async function fetchEc2Logs(publicIp: string): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  for (const svc of EC2_SERVICES) {
    const start = Date.now();
    try {
      const logs = await sshExec(publicIp, svc.logCmd);
      cachedLogs[svc.name] = { logs: logs.substring(0, 10000), timestamp: new Date().toISOString() };
      results.push({ id: `ec2-logs-${svc.name}`, name: `EC2 Logs: ${svc.name}`, group: 'ec2', status: 'UP', responseTimeMs: Date.now() - start, message: `Retrieved ${logs.length} chars of logs`, timestamp: new Date().toISOString(), severity: 'NOTICE', details: { preview: logs.substring(0, 200) } });
    } catch (err: any) {
      cachedLogs[svc.name] = { logs: '', timestamp: new Date().toISOString(), error: err.message };
      results.push({ id: `ec2-logs-${svc.name}`, name: `EC2 Logs: ${svc.name}`, group: 'ec2', status: 'WARNING', responseTimeMs: Date.now() - start, message: `Failed to fetch logs: ${err.message}`, timestamp: new Date().toISOString(), severity: 'NOTICE' });
    }
  }

  return results;
}

function resolveKeyPath(): string {
  const raw = config.ec2Ssh.keyPath;
  return raw.startsWith('/') ? raw : path.resolve(process.cwd(), raw);
}

function sshExec(host: string, command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let keyBuf: Buffer;
    try { keyBuf = fs.readFileSync(resolveKeyPath()); }
    catch (e: any) { return reject(new Error(`Cannot read SSH key: ${e.message}`)); }

    const conn = new Client();
    let output = '';
    const timer = setTimeout(() => { conn.end(); reject(new Error('SSH exec timeout')); }, 30000);

    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) { clearTimeout(timer); conn.end(); reject(err); return; }
        stream.on('data', (d: Buffer) => { output += d.toString(); });
        stream.stderr.on('data', (d: Buffer) => { output += d.toString(); });
        stream.on('close', () => { clearTimeout(timer); conn.end(); resolve(output); });
      });
    });

    conn.on('error', (err) => { clearTimeout(timer); reject(err); });

    conn.connect({ host, port: 22, username: config.ec2Ssh.user, privateKey: keyBuf, readyTimeout: 10000 });
  });
}
