import { spawnSync } from 'node:child_process';
import path from 'node:path';

const adminPhone = process.env.POSTMAN_ADMIN_PHONE ?? '+998900000001';
const command = path.join(
  process.cwd(),
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'newman.cmd' : 'newman',
);

const args = [
  'run',
  'postman/mahalla-yettiligi.postman_collection.json',
  '-e',
  'postman/mahalla-yettiligi-local.postman_environment.json',
  '--env-var',
  `adminPhone=${adminPhone}`,
  '--reporters',
  'cli',
  '--color',
  'off',
];

const result = spawnSync(command, args, {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
