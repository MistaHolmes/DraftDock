import { config } from './config';
import { runAllChecks } from './scheduler';
import { initHistory } from './history';
import { startDashboard } from './dashboard';

const isOnce = process.argv.includes('--once');

async function main() {
  console.log('🚀 DraftDock Monitoring Service starting...');
  console.log(`   Backend:          ${config.urls.be}`);
  console.log(`   Frontend:         ${config.urls.fe}`);
  console.log(`   Check interval:   ${config.checkIntervalSeconds}s`);
  console.log(`   Dashboard:        http://localhost:${config.dashboardPort}`);
  console.log(`   Alerts to:        ${config.alertTo || '(not set)'}`);
  console.log(`   Database:         ${config.neonDbUrl ? 'configured' : '(not set)'}`);
  console.log(`   EC2 IPs:          ${config.ec2.instanceIps.join(', ') || '(not set)'}`);
  console.log(`   EC2 SSH key:      ${config.ec2Ssh.keyPath}`);
  console.log(`   EC2 SSH user:     ${config.ec2Ssh.user}`);

  initHistory();

  await runAllChecks();

  if (isOnce) {
    console.log('\n📋 Single run complete. Exiting.');
    process.exit(0);
  }

  startDashboard();

  setInterval(async () => {
    await runAllChecks();
  }, config.checkIntervalSeconds * 1000);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
