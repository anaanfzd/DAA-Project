# ❄️ FrostRoute: High-Performance Cyber-Logistics Command Center

**FrostRoute** is an immersive, high-performance logistics command and pathfinding platform tailored for severe Arctic environments. It bridges an optimized, native compiled C-pathfinding engine with a premium, holographic-themed React dashboard powered by **A.U.R.A.** (Arctic Utility & Routing Assistant)—a voice-synthesized, vocal-enabled AI Tactical Copilot.

---

## 🛰️ Hybrid Architecture & Data Flow

FrostRoute solves the performance and memory constraints of traditional web-based engines by offloading complex pathfinding to a native binary core.

```
  ┌──────────────────────────────────────────────────────────┐
  │              Operator Command HUD (React + TS)           │
  └──────────────────────────┬───────────────────▲───────────┘
               Voice Command │                   │ Dynamic Telemetry,
              & Telemetry    │                   │ Paths & Vocal TTS
                             ▼                   │
  ┌──────────────────────────────────────────────┴───────────┐
  │                 REST API Bridge (Express.js)             │
  │        (Memory caching + Child-process spawning)         │
  └──────────────────────────┬───────────────────▲───────────┘
                STDIN Pipes  │                   │ STDOUT JSON
                             ▼                   │
  ┌──────────────────────────────────────────────┴───────────┐
  │                 Native C Dijkstra Core (GCC)             │
  │        (Adjacency list representations & Binary Min-Heaps)│
  └──────────────────────────────────────────────────────────┘
```

* **High-Speed Pathfinding Core (C):** Core routing logic implemented in pure C (`dijkstra.c`) utilizing binary min-heaps to solve optimal routes instantly, completely offloading intensive calculations from Node.js/browser event loops.
* **API Bridge (Express):** A Node.js backend acting as a middleware proxy. It interfaces with the compiled C executable via standard streams, adding a query caching layer for sub-millisecond response times.
* **Holographic HUD (React + TS):** An interactive tactical frontend dashboard featuring smooth hardware-accelerated micro-animations, real-time threat calculators, and modular operational displays.

---

## ⚡ Core Capabilities

* **🎙️ A.U.R.A. AI Copilot (v3.2):** Features full Text-to-Speech (TTS) vocal responses and integrates WebSpeech Speech-to-Text (STT) mic controls with a dynamic visualizer for hands-free routing overrides.
* **🧠 Dual Cognitive Cores:** Interfaces with a **Local NLP Core** for fast offline command processing and a **Gemini Satellite Core** (via the Gemini API) for advanced deep-space cognitive analysis of operator prompts.
* **🛡️ Biometric Auth & Role-Based Security:** Restricts operation based on operator clearance level:
  * *Commander (Gold):* Unrestricted dispatching and override authorization.
  * *Courier (Amber):* Mobilization and navigation under safety guides.
  * *Analyst (Cyan):* Read-only telemetry access (calculators are strictly locked).
* **⚠️ Automated Safety Overrides:** Actively enforces real-time safety protocols. If a Courier attempts to dispatch a delivery drone during a severe active Blizzard, A.U.R.A. instantly overrides the fleet to an **Ice Crawler**, calculates the safest ground route, and issues a vocal hazard alert.
* **📊 Tactical HUD Route Briefing:** Automatically generates and vocally reads real-time contextual route analysis (hazard levels, step counts, environmental friction index) once a path is calculated.

---

## 🛠️ Getting Started

### Prerequisites
* A C Compiler (e.g., `gcc` or MSVC) installed and added to your system's Environment Variables (`PATH`).
* [Node.js](https://nodejs.org/) (v18+) & `npm`.

### Setup & Installation

1. **Clone & Open Project:**
   ```bash
   git clone https://github.com/anaanfzd/DAA-Project.git
   cd DAA-Project
   ```

2. **Initialize Backend (Server & C Compilation):**
   ```bash
   cd backend
   npm install
   npm run build:c   # Compiles dijkstra.c into a native binary executable
   npm run dev       # Starts local backend API on http://localhost:5000
   ```

3. **Initialize Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev       # Starts Vite development server on http://localhost:5173
   ```

---

## 💻 Tech Stack
* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Lucide-React.
* **Backend API:** Node.js, Express, Child Process STDIO API.
* **Algorithms Core:** Pure C, Dijkstra Pathfinding (Binary Min-Heap).
