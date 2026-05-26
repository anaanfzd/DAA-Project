import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const win = process.platform === 'win32';
const out = win ? 'dijkstra.exe' : 'dijkstra';
const cmd = `gcc -O2 -std=c99 -o ${out} dijkstra.c`;
execSync(cmd, { stdio: 'inherit', cwd: dir });
