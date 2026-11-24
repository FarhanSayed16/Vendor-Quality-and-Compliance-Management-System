// ==============================================================================
// VQCMS - XII | WebAssembly SQLite Database Engine
// Loads vqcms.db into browser memory via sql.js and exposes executeQuery()
// ==============================================================================

let db = null;
let dbReady = false;

async function initDatabase() {
  const statusEl = document.getElementById('db-status');
  if (!statusEl) return;

  try {
    statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span> <span>Initializing WASM…</span>';
    statusEl.className = 'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-600/40 shadow-inner';

    const SQL = await initSqlJs({
      locateFile: f => `https://sql.js.org/dist/${f}`
    });

    let buf = null;
    try {
      const resp = await fetch('data/vqcms.db');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      buf = await resp.arrayBuffer();
    } catch (fetchErr) {
      console.warn('Direct binary DB fetch failed (often due to file:// CORS restriction):', fetchErr);
      if (window.location.protocol === 'file:') {
        statusEl.title = 'Running on file:// protocol. For live database queries, run "python server.py"';
      }
    }

    if (buf) {
      db = new SQL.Database(new Uint8Array(buf));
      dbReady = true;
      statusEl.innerHTML = '<span class="pulse-dot"></span> <span>SQLite WASM Connected</span>';
      statusEl.className = 'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 shadow-inner';
      statusEl.title = '14 tables loaded into WebAssembly memory';
    } else {
      // Empty DB initialized
      db = new SQL.Database();
      dbReady = true;
      statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-400"></span> <span>Local Mode (Run server.py)</span>';
      statusEl.className = 'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-600/40 shadow-inner';
      statusEl.title = 'Database binary not loaded via CORS. Start local server with: python server.py';
    }

    document.dispatchEvent(new Event('db-ready'));
  } catch (err) {
    statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-rose-500"></span> <span>WASM Error</span>';
    statusEl.className = 'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-600/40 shadow-inner';
    console.error('Database initialization error:', err);
  }
}

function executeQuery(sql) {
  if (!db) return { columns: [], rows: [], error: 'Database engine not initialized', ms: 0 };
  const t0 = performance.now();
  try {
    const results = db.exec(sql);
    const ms = (performance.now() - t0).toFixed(1);
    if (!results || results.length === 0) return { columns: [], rows: [], error: null, ms };
    return { columns: results[0].columns, rows: results[0].values, error: null, ms };
  } catch (e) {
    const ms = (performance.now() - t0).toFixed(1);
    return { columns: [], rows: [], error: e.message, ms };
  }
}
