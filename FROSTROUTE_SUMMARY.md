# FrostRoute: High-Performance Cyber-Logistics Command Center

**FrostRoute** is an immersive, high-performance logistics command and pathfinding platform tailored for severe Arctic conditions. It bridges a native, high-speed compiled backend engine with a premium, holographic-themed operator dashboard powered by a vocal-enabled AI Tactical Copilot (**A.U.R.A.**).

---

## 🛰️ Core Concept
In extreme environments like the Arctic, logistical routing must be instantaneous, resilient, and adaptive. FrostRoute solves the computational limitations of browser-based calculations by offloading heavy pathfinding to an optimized native C engine. It wraps this speed inside an immersive, dark-cyberpunk tactical interface that enforces safety, processes spoken vocal overrides, and leverages satellite AI for real-time risk briefings.

---

## 🛠️ Hybrid Architecture
FrostRoute uses a layered, high-performance architectural split:

```
  [ Operator Interface (React + TS) ]
                │  ▲
    Voice / UI  │  │ Dynamic Telemetry, Paths, & Voice
                ▼  │
      [ Express.js REST API ]
                │  ▲
    STDIN Pipes │  │ STDOUT JSON
                ▼  │
       [ Native C Dijkstra Core ]
```

1. **High-Speed Pathfinding Core (C Backend):** 
   - Written in pure, highly-optimized **C (`dijkstra.c`)** using custom adjacency arrays and a binary min-heap Dijkstra solver.
   - Offloads resource-intensive calculations from the main execution thread.
2. **REST API Bridge (Node.js/Express):**
   - An Express server (`server.js`) interfaces with the C backend through standard I/O stream spawning.
   - Features built-in memory caching to retrieve frequent route queries instantly without recalculating.
3. **Cybernetic Command HUD (React Frontend):**
   - Built on React, TypeScript, and Vanilla CSS/Tailwind, with hardware-accelerated animations using Framer Motion.
   - Delivers a tactile, responsive grid-scanner aesthetic with custom military-grade telemetry components.

---

## ⚡ Key Functionalities & Features

### 1. Biometric Authentication & Clearances
Secures the deck using a mock-biometric login and satellite handshake verification. It implements a strict role-based access control (RBAC) hierarchy:
*   **Tactical Commander (Gold Badge - Level 5):** Unrestricted override capabilities and full route dispatching permissions.
*   **Field Courier (Amber Badge - Level 2):** Ground mobilization clearance; executes dispatching under automated safety guidance.
*   **Logistics Analyst (Cyan Badge - Level 3):** Read-only telemetry access. A.U.R.A. actively intercepts and blocks any route-solving or dispatch modifications.

### 2. A.U.R.A. AI Tactical Copilot (v3.2)
The **Arctic Utility & Routing Assistant (A.U.R.A.)** is an interactive, voice-synthesized AI companion featuring:
*   **Speech Synthesis (TTS):** Vocally greets operators by name and rank upon authorization and reads telemetry hazard briefs aloud.
*   **Dual Cognitive Cores:**
    *   *Local Core:* Fallback regex natural language processing (NLP) to parse command inputs (e.g., *"dispatch crawler to sector 4"*).
    *   *Gemini Satellite Core:* Deep-space AI reasoning utilizing the Gemini API to analyze complex operator directives and generate structural action logs.
*   **Vocal Command Overrides (STT):** Integrates WebSpeech microphone controls. Activating the mic triggers an active, dark-red cyberwave audio visualizer, allowing operators to verbally submit routing overrides.

### 3. Automated Safety Overrides
FrostRoute actively enforces operational policies in response to real-time telemetry and user roles:
*   *Analyst Solver Lock:* Blocks attempts by Analyst roles to solve paths, notifying: *"Analyst profiles hold read-only clearance. Solver locked."*
*   *Courier Blizzard Drone Override:* If a Courier attempts to dispatch a delivery drone during an active Blizzard, A.U.R.A. automatically overrides the vehicle to an **Ice Crawler**, calculates the safest ground route, and broadcasts a safety alert.

### 4. Tactical Route Briefing HUD
*   **Telemetry Panel:** Appears automatically upon completing a path query, highlighting hop count, computed distance, and threat levels.
*   **Contextual AI Summaries:** Generates natural language terrain and safety briefings (e.g., rotor drag cautions for drones during heavy snows or ice-sheet speed warnings for crawlers).
*   **Vocal Delivery:** Reads the tactical summary aloud as soon as a route is locked.

---

## 🚀 Quick Start
1. **Initialize Backend:**
   ```bash
   cd backend && npm install && npm run dev
   ```
2. **Initialize Frontend:**
   ```bash
   cd frontend && npm install && npm run dev
   ```
3. Access the dashboard locally at `http://localhost:5173/`.
