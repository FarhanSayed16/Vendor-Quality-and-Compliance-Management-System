# Web Deployment & Phase-Wise Implementation Plan
## Interactive Presentation Dashboard for Precision Auto Parts (VQCMS - XII)

**Course:** SEM I – Data Science and Technology / Database Management Systems  
**Project Group:** Team 12  
**Domain:** Precision Auto Parts (Vendor Quality & Compliance Management System)  
**Deliverable Document:** `docs/05_deployment_and_web_implementation_plan.md`

---

## 1. Deployment Architecture Evaluation: Static vs. Vercel vs. Full-Stack

To allow professors to view and test the project from anywhere (via a public HTTPS link on their phone, laptop, or podium projector), we evaluated the primary hosting and execution architectures:

| Architecture Option | Platform / Hosting | How Database Queries Execute | Pros & Advantages | Cons & Risks | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Option 1: Static Web App + WebAssembly SQLite (sql.js)** | **Vercel / GitHub Pages / Netlify** | **Client-Side WebAssembly:** Browser compiles SQLite engine directly via `sql.js` (WASM). Queries run on the real `vqcms.db` directly inside the browser. | 🚀 **Instant Load (Zero Cold Starts)**<br>• Free 24/7 hosting<br>• Zero backend maintenance<br>• Works offline and online<br>• 1-click deployment | Requires modern browser (all Chrome, Edge, Safari, Firefox supported) | ⭐ **STRONGLY RECOMMENDED** (Best for College Defense) |
| **Option 2: Vercel Hybrid (Static Frontend + Python Serverless API)** | **Vercel** | **Serverless Function:** Python `api/query.py` reads `vqcms.db` and returns JSON | • Real server REST API endpoint<br>• Python executes SQLite on Vercel | Cold boot delay (1–2s on first hit if inactive) | **Great Alternative** |
| **Option 3: Full-Stack Cloud Server (Render / Railway / EC2)** | **Render / Railway** | Persistent Python/Node server process | • Traditional client-server model | ⚠️ Free tiers spin down after 15 min of inactivity (causes 40s lag during viva); credit card required | **Avoid for Viva** |

### The Winning Strategy: Hybrid Client-Side SQLite (WebAssembly) on Vercel / GitHub Pages
By using **WebAssembly SQLite (`sql.js`)** embedded in a static frontend:
1. **The Real Database Executes Live:** When the professor clicks *"Execute Query"* or types `SELECT * FROM suppliers;`, the genuine C-compiled SQLite engine processes the query and outputs the table in milliseconds.
2. **Zero Hosting Cost & Zero Cold Starts:** Hosted on **Vercel** or **GitHub Pages** (free forever, SSL enabled, custom domain like `https://vqcms-team12.vercel.app`).
3. **Dual Deployment:** You can deploy it to **Vercel** (for the public teacher link) AND run it locally via a 1-file Python script (`server.py`) on your presentation laptop as a zero-internet backup.

---

## 2. Directory Structure of the Web Interaction Application

We will build the entire web presentation in a dedicated, clean `web/` directory:

```
DBMS_Team_12/
├── web/
│   ├── index.html          <-- Modern Single-Page Dashboard (Tailwind CSS + 6 Interactive Tabs)
│   ├── css/
│   │   └── custom.css      <-- Polished automotive corporate styling (slate/navy/emerald accents)
│   ├── js/
│   │   ├── app.js          <-- UI navigation, tab switcher, Chart.js telemetry controller
│   │   ├── database.js     <-- WebAssembly SQLite (sql.js) runner executing queries against vqcms.db
│   │   └── queries_data.js <-- Formatted SQL definitions & explanation metadata for all 11 queries
│   ├── data/
│   │   └── vqcms.db        <-- Binary SQLite database file loaded into WebAssembly memory
│   └── vercel.json         <-- Vercel deployment configuration
├── server.py               <-- Optional 60-line Python local runner for offline presentation
└── docs/
    └── 05_deployment_and_web_implementation_plan.md
```

---

## 3. Phase-Wise Implementation Roadmap

```
+-------------------------------------------------------------------------------------------------+
|                                 6-PHASE IMPLEMENTATION TIMELINE                                 |
+-------------------------------------------------------------------------------------------------+
|  Phase 1: Data Preparation  -->  Phase 2: UI Dashboard Shell  -->  Phase 3: Live SQL Engine     |
|  Phase 4: Telemetry Charts  -->  Phase 5: Local Verification   -->  Phase 6: Vercel Deployment   |
+-------------------------------------------------------------------------------------------------+
```

### Phase 1: Database & Asset Packaging
- **Objective:** Prepare the binary SQLite database and seed data payload for web loading.
- **Tasks:**
  1. Generate a clean binary `vqcms.db` from `sql/schema.sql` and `sql/seed_data.sql`.
  2. Bundle the 11 business queries and their expected explanations into `web/js/queries_data.js`.
  3. Prepare sample offline fallback JSON in case WebAssembly loading is blocked on restrictive networks.

### Phase 2: Single-Page Application (SPA) Layout & Navigation
- **Objective:** Build the responsive, executive-tier web interface.
- **Tasks:**
  1. Set up `web/index.html` with Tailwind CSS CDN and custom corporate automotive styling.
  2. Implement top header: Project Title, Team 12 badge, Plant status pills (Detroit, Stuttgart, Chennai, Shanghai), and DB Connection status pill.
  3. Create responsive top navigation tabs:
     - **Tab 1:** Executive Overview & Crisis Analysis
     - **Tab 2:** Relational Data Model & Schema Dictionary
     - **Tab 3:** Live SQL Query Workbench (Interactive Runner)
     - **Tab 4:** Quality Telemetry & Penalty Analytics (Chart.js)
     - **Tab 5:** Batch Quarantine & RMA Audit Trail
     - **Tab 6:** Viva Defense Cheat-Sheet & Q&A Panel

### Phase 3: Interactive Live SQL Execution Engine
- **Objective:** Give professors a working database console to test queries live.
- **Tasks:**
  1. Integrate `sql.js` (WebAssembly SQLite) via CDN in `web/js/database.js`.
  2. Build the **Live SQL Workbench**:
     - Sidebar listing the 11 core assignment queries with 1-click load buttons.
     - Formatted SQL code editor box with syntax styling.
     - **"Run Query" Action Button** executing SQL against the in-memory SQLite database.
     - Output data table with dynamic columns, row counts, and execution latency in milliseconds.
     - Custom SQL input mode: Professors can type their own `SELECT` queries to inspect any table.

### Phase 4: Data Visualizations & Telemetry (Chart.js)
- **Objective:** Provide executive charts proving business value.
- **Tasks:**
  1. Integrate `Chart.js` via CDN in `web/js/app.js`.
  2. **Bar Chart: Defect PPM vs. Contract SLA Limits:**
     - Plots actual PPM for each supplier with red threshold lines.
     - Visualizes BorgWarner (65,714 PPM) and ZF (30,000 PPM) in red breach vs. Bosch and Denso in green compliant.
  3. **Doughnut Chart: Line Downtime Financial Losses:**
     - Visualizes plant stoppage financial losses ($15,000 Detroit vs. $9,000 Stuttgart).
  4. **Financial Recovery Counter Cards:**
     - Live KPI metric cards for Total Claimed ($264,000), Total Settled ($88,000), and Total Penalties Debited ($78,000).

### Phase 5: Quarantine & Audit Trail Interactive Timeline
- **Objective:** Demonstrate end-to-end traceability for ISO 9001 / IATF 16949 audit compliance.
- **Tasks:**
  1. Interactive step-by-step lot containment card tracking suspect batch `LOT-2026-BORG-7890`.
  2. Dynamic table displaying entries from `compliance_audit_log` with timestamps, old state, new state, and user actions.

### Phase 6: Deployment & Professor Access (Vercel / GitHub Pages)
- **Objective:** Deploy to public HTTPS link and generate presentation assets.
- **Tasks:**
  1. Add `vercel.json` for zero-configuration static serving.
  2. Deploy via Vercel CLI or Git push to Vercel/GitHub Pages.
  3. Generate QR Code and short URL (e.g., `bit.ly/vqcms-team12`) to put on the presentation title slide so teachers can open it on their phones while you present!

---

## 4. Step-by-Step Deployment Guide for the Team

### Option A: 1-Click Deployment to Vercel (Recommended)
1. **Using Vercel CLI (Fastest - 2 minutes):**
   ```powershell
   # Install Vercel CLI globally (if not installed)
   npm install -g vercel

   # Navigate to web directory and deploy
   cd d:\DBMS_Team_12\web
   vercel deploy --prod
   ```
   *Vercel immediately outputs a live production URL: `https://vqcms-team12.vercel.app`.*

2. **Using GitHub + Vercel Dashboard:**
   - Push `DBMS_Team_12` to a GitHub repository.
   - Go to [vercel.com](https://vercel.com) $\to$ "Add New Project" $\to$ Select repo $\to$ Set Root Directory to `web` $\to$ Click "Deploy".

### Option B: Free Deployment to GitHub Pages
1. Push repository to GitHub.
2. In GitHub repository settings $\to$ **Pages** $\to$ Source: `Deploy from a branch` $\to$ Branch: `main`, Folder: `/web` $\to$ Save.
3. Your site goes live at `https://<username>.github.io/<repo-name>/`.

### Option C: Offline Classroom Backup (Zero Internet)
If the college projector room has no Wi-Fi or internet connection:
```powershell
# In project root, run local Python server
python server.py

# Open in Chrome / Edge
http://localhost:8000/web
```

---

## 5. Live Presentation Script & Feature Walkthrough

When presenting this web page to your teachers:

1. **Minute 0–2 (Title Slide + QR Code):**
   - Display project title and show the QR code / URL: *"Professors, you can open this link on your phones right now to inspect our live database while we present."*
2. **Minute 2–4 (Tab 1 & 2 - Problem & Schema):**
   - Show Tab 1 KPI cards: *"Precision Auto Parts suffered a 14% assembly downtime crisis."*
   - Switch to Tab 2: Show the normalized 14-table data dictionary and relational constraints.
3. **Minute 4–8 (Tab 3 - Live Query Console):**
   - Click **Query 1**: Show real-time Defect PPM calculation.
   - Click **Query 3**: Show line downtime stoppage calculation generating a $25,000 debit memo.
   - Invite teacher: *"Sir, you can select any table or type any custom SQL in this box and see it execute live on the database."*
4. **Minute 8–10 (Tab 4 & 5 - Telemetry & Audit):**
   - Show Chart.js PPM heatmaps and audit trail for batch `LOT-2026-BORG-7890`.
5. **Minute 10–12 (Tab 6 - Viva Q&A):**
   - Answer professor questions confidently using the built-in reference card.

---

## 6. Implementation Readiness

The technical requirements are lightweight, resilient, and ready to be built directly in the workspace. No external frameworks (Node, React, Django) are required; standard HTML5, modern Tailwind CSS, Chart.js, and WebAssembly SQLite will deliver an enterprise-grade interactive web experience.
