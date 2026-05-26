import { spawn } from 'child_process';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { graphNodes, graphEdges, NODE_COUNT, restaurants } from './data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// In-memory cache for computed routes
const routeCache = new Map();

function binaryPath() {
  const win = process.platform === 'win32';
  const name = win ? 'dijkstra.exe' : 'dijkstra';
  return path.join(__dirname, name);
}

/**
 * Run Dijkstra (C executable) asynchronously. Input: n, source, target, edges with integer weights.
 */
function runDijkstra(n, source, target, edges) {
  return new Promise((resolve, reject) => {
    const exe = binaryPath();
    if (!fs.existsSync(exe)) {
      return resolve({
        ok: false,
        error: 'Dijkstra binary not found. Run: npm run build:c (requires gcc in PATH) from the backend folder.',
      });
    }
    const lines = [`${n} ${source} ${target} ${edges.length}`];
    for (const e of edges) {
      lines.push(`${e.u} ${e.v} ${e.w}`);
    }
    const input = lines.join('\n') + '\n';
    
    const child = spawn(exe, [], { windowsHide: true });
    
    let stdoutData = '';
    let stderrData = '';
    
    child.stdout.on('data', (chunk) => { stdoutData += chunk; });
    child.stderr.on('data', (chunk) => { stderrData += chunk; });
    
    child.on('error', (err) => {
      resolve({ ok: false, error: String(err.message || err) });
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        return resolve({ ok: false, error: stderrData || stdoutData || 'dijkstra exited with error' });
      }
      try {
        const out = JSON.parse(stdoutData.trim());
        resolve(out);
      } catch (e) {
        resolve({ ok: false, error: 'Invalid JSON from dijkstra', raw: stdoutData });
      }
    });
    
    child.stdin.write(input);
    child.stdin.end();
  });
}

/** Scale float weights to integers for C */
const SCALE = 1000;

function buildEdges(edgeList, trafficIntensity, mode, vehicleType, weatherLevel) {
  const edges = [];
  
  const weatherPenalty = { clear: 0, snow: 0.5, blizzard: 2.5 };
  const wPen = weatherPenalty[weatherLevel] || 0;

  for (const e of edgeList) {
    const dist = Number(e.distance) || 1;
    const tr = Number(e.traffic ?? 0.35);
    
    let cost = dist;
    
    if (vehicleType === 'drone') {
      // Drone ignores traffic, high weather penalty
      if (weatherLevel === 'blizzard') {
        cost += 1000; // basically disabled
      } else {
        cost += cost * (wPen * 1.5);
      }
    } else if (vehicleType === 'crawler') {
      // Crawler is slow (base distance * 1.5), but ignores weather and traffic
      cost *= 1.5;
    } else {
      // Hoverbike/Courier is affected by traffic and weather
      if (mode === 'least_traffic') {
        cost += tr * trafficIntensity * 12;
      } else {
        cost *= (1 + tr * trafficIntensity * 1.2);
      }
      cost += cost * wPen;
    }
    
    const wi = Math.max(1, Math.round(cost * SCALE));
    edges.push({ u: e.from, v: e.to, w: wi });
  }
  return edges;
}

app.get('/api/graph', (req, res) => {
  res.json({
    ok: true,
    nodes: graphNodes,
    edges: graphEdges,
    restaurants: restaurants,
    nodeCount: NODE_COUNT
  });
});

app.post('/api/route', async (req, res) => {
  try {
    const {
      source,
      target,
      trafficIntensity = 0.35,
      mode = 'fastest',
      vehicleType = 'hoverbike',
      weatherLevel = 'clear',
    } = req.body;
    
    if (typeof source !== 'number' || typeof target !== 'number') {
      return res.status(400).json({ ok: false, error: 'Invalid body' });
    }
    
    const cacheKey = `${source}_${target}_${trafficIntensity}_${mode}_${vehicleType}_${weatherLevel}`;
    if (routeCache.has(cacheKey)) {
      return res.json(routeCache.get(cacheKey));
    }

    const edges = buildEdges(
      graphEdges,
      Number(trafficIntensity) || 0,
      mode === 'least_traffic' ? 'least_traffic' : 'fastest',
      vehicleType,
      weatherLevel
    );
    
    const result = await runDijkstra(NODE_COUNT, source, target, edges);
    if (!result.ok && result.error) {
      return res.status(500).json(result);
    }
    
    const responseData = {
      ...result,
      meta: { trafficIntensity, mode, vehicleType, weatherLevel, scale: SCALE },
    };
    
    routeCache.set(cacheKey, responseData);
    // basic cache eviction to prevent memory leak
    if (routeCache.size > 1000) {
      const firstKey = routeCache.keys().next().value;
      routeCache.delete(firstKey);
    }
    
    res.json(responseData);
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    dijkstra: fs.existsSync(binaryPath()),
  });
});

const PORT = process.env.PORT || 3847;
app.listen(PORT, () => {
  console.log(`FrostRoute API on http://localhost:${PORT}`);
});
