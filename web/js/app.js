// ==============================================================================
// VQCMS - XII | Advanced Enterprise Dashboard Controller
// Professional UX: Tab routing, keyboard shortcuts, live filtering, CSV export,
// Chart.js telemetry, interactive schema preview, lot containment stepper
// ==============================================================================

// ---- Tab Navigation & Routing ----------------------------------------------
const TABS = ['overview', 'schema', 'workbench', 'telemetry', 'audit', 'viva'];
let activeTab = 'overview';

function switchTab(tabId) {
  if (!TABS.includes(tabId)) return;
  activeTab = tabId;
  TABS.forEach(t => {
    const section = document.getElementById(`tab-${t}`);
    const btn = document.getElementById(`btn-${t}`);
    if (section) section.classList.toggle('hidden', t !== tabId);
    if (btn) btn.classList.toggle('active', t === tabId);
  });

  // Lazy renderers
  if (tabId === 'telemetry' && !chartsRendered) renderCharts();
  if (tabId === 'audit' && !auditRendered) renderAuditTrail();
  if (tabId === 'workbench' && !workbenchReady) initWorkbench();
  if (tabId === 'schema' && !schemaRendered) renderSchemaExplorer();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Global Keyboard Shortcuts (1-6 for Tabs, Ctrl+Enter to Run SQL)
document.addEventListener('keydown', (e) => {
  // If typing inside an input/textarea, only listen for Ctrl+Enter
  const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    if (activeTab === 'workbench') runQuery();
    return;
  }
  if (!isInput && !e.ctrlKey && !e.altKey && !e.metaKey) {
    const keyNum = parseInt(e.key);
    if (keyNum >= 1 && keyNum <= 6) {
      e.preventDefault();
      switchTab(TABS[keyNum - 1]);
    }
  }
});

// Toast Notification
function showToast(message, type = 'info') {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg text-sm font-medium shadow-2xl transition-all duration-300 transform translate-y-10 opacity-0 pointer-events-none flex items-center gap-2';
    document.body.appendChild(toast);
  }
  const bg = type === 'success' ? 'bg-emerald-900 text-emerald-100 border border-emerald-500' :
             type === 'error' ? 'bg-rose-900 text-rose-100 border border-rose-500' :
             'bg-slate-900 text-slate-100 border border-slate-700';
  toast.className = `fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg text-sm font-medium shadow-2xl transition-all duration-300 transform translate-y-0 opacity-100 ${bg}`;
  toast.innerHTML = message;
  setTimeout(() => {
    toast.className += ' translate-y-10 opacity-0';
  }, 2500);
}

// ---- Executive Overview KPI Cards ------------------------------------------
function updateOverviewKPIs() {
  if (!dbReady) return;
  const metrics = [
    { id: 'kpi-components',  sql: 'SELECT COUNT(*) FROM components' },
    { id: 'kpi-suppliers',   sql: 'SELECT COUNT(*) FROM suppliers' },
    { id: 'kpi-plants',      sql: 'SELECT COUNT(*) FROM plants' },
    { id: 'kpi-quarantines', sql: 'SELECT COUNT(*) FROM batch_quarantines' },
  ];
  metrics.forEach(m => {
    const r = executeQuery(m.sql);
    const el = document.getElementById(m.id);
    if (el && r.rows.length) el.textContent = r.rows[0][0].toLocaleString();
  });

  const fin = executeQuery('SELECT SUM(claimed_amount), SUM(settled_amount) FROM rma_claims');
  if (fin.rows.length) {
    const elC = document.getElementById('kpi-claimed');
    const elS = document.getElementById('kpi-settled');
    if (elC) elC.textContent = '$' + Number(fin.rows[0][0] || 0).toLocaleString();
    if (elS) elS.textContent = '$' + Number(fin.rows[0][1] || 0).toLocaleString();
  }

  const pen = executeQuery('SELECT SUM(total_penalty_amount) FROM penalty_invoices');
  if (pen.rows.length) {
    const elP = document.getElementById('kpi-penalties');
    if (elP) elP.textContent = '$' + Number(pen.rows[0][0] || 0).toLocaleString();
  }

  const dt = executeQuery('SELECT SUM(downtime_minutes) FROM downtime_incidents');
  if (dt.rows.length) {
    const elD = document.getElementById('kpi-downtime');
    if (elD) elD.textContent = (dt.rows[0][0] || 0) + ' min';
  }
}

// ---- Schema Explorer -------------------------------------------------------
let schemaRendered = false;
let currentTableCategory = 'ALL';
let currentSearchTerm = '';

const TABLE_META = {
  plants: { desc: 'Manufacturing facilities with dock capacities and location data', cat: 'MASTER', color: 'blue' },
  suppliers: { desc: 'Global Tier-1 & Tier-2 suppliers with ISO certs & ratings', cat: 'MASTER', color: 'blue' },
  supplier_contracts: { desc: 'SLAs, PPM limits, and hourly line stoppage penalties', cat: 'MASTER', color: 'blue' },
  components: { desc: 'Engine & Transmission catalog with criticality tiers (A/B/C)', cat: 'MASTER', color: 'blue' },
  purchase_orders: { desc: 'Multi-plant procurement contracts & expected deliveries', cat: 'PROCUREMENT', color: 'amber' },
  po_line_items: { desc: 'Detailed bill-of-materials breakdown linking parts to POs', cat: 'PROCUREMENT', color: 'amber' },
  shipment_receipts: { desc: 'Physical dock arrivals, lot numbers, carriers & bays', cat: 'PROCUREMENT', color: 'amber' },
  qc_inspectors: { desc: 'Quality control personnel across plants with cert levels', cat: 'QUALITY', color: 'emerald' },
  inspection_records: { desc: 'Sample tests, defect types, CoA validation & PPM math', cat: 'QUALITY', color: 'emerald' },
  batch_quarantines: { desc: 'Physical isolation of suspect lots into holding bays', cat: 'QUALITY', color: 'emerald' },
  downtime_incidents: { desc: 'Assembly line stoppages, downtime minutes & root cause', cat: 'FINANCIAL', color: 'rose' },
  rma_claims: { desc: 'Warranty refund & replacement claims filed with vendors', cat: 'FINANCIAL', color: 'rose' },
  penalty_invoices: { desc: 'Automated debit memos debited against supplier payables', cat: 'FINANCIAL', color: 'rose' },
  compliance_audit_log: { desc: 'Immutable regulatory ledger tracking quarantine transitions', cat: 'AUDIT', color: 'slate' }
};

function renderSchemaExplorer() {
  schemaRendered = true;
  const container = document.getElementById('schema-tables');
  if (!dbReady || !container) return;

  const tables = executeQuery("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
  let html = '';

  tables.rows.forEach(([tbl]) => {
    const meta = TABLE_META[tbl] || { desc: '', cat: 'OTHER', color: 'slate' };
    const matchesCat = currentTableCategory === 'ALL' || meta.cat === currentTableCategory;
    const matchesSearch = !currentSearchTerm || tbl.toLowerCase().includes(currentSearchTerm) || meta.desc.toLowerCase().includes(currentSearchTerm);

    if (!matchesCat || !matchesSearch) return;

    const info = executeQuery(`PRAGMA table_info('${tbl}')`);
    const fks = executeQuery(`PRAGMA foreign_key_list('${tbl}')`);
    const fkCols = new Set(fks.rows.map(r => r[3]));
    const count = executeQuery(`SELECT COUNT(*) FROM "${tbl}"`);
    const rowCount = count.rows[0] ? count.rows[0][0] : 0;

    html += `
    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors">
      <div class="px-5 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 cursor-pointer select-none" onclick="toggleTableDetails('${tbl}')">
        <div class="flex items-center gap-2.5">
          <span class="text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-${meta.color}-500/20 text-${meta.color}-300 border border-${meta.color}-400/30">${meta.cat}</span>
          <span class="font-mono font-bold text-sm text-slate-100">${tbl}</span>
          <span class="hidden sm:inline text-xs text-slate-400 font-normal">· ${meta.desc}</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full font-mono border border-slate-700">${rowCount} records</span>
          <button onclick="event.stopPropagation(); previewTableData('${tbl}')" class="text-xs px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow">
            Preview 5 Rows ▶
          </button>
          <span id="chevron-${tbl}" class="text-slate-400 text-xs transition-transform duration-200">▾</span>
        </div>
      </div>
      <div id="details-${tbl}" class="p-4 bg-slate-50 border-t border-slate-200">
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Column</th>
                <th>Type</th>
                <th>Not Null</th>
                <th>Default</th>
                <th>PK</th>
                <th>Key Constraint</th>
              </tr>
            </thead>
            <tbody>`;
    info.rows.forEach(r => {
      const isPK = r[5] === 1;
      const isFK = fkCols.has(r[1]);
      const keyBadge = isPK ? '<span class="badge-pill bg-amber-100 text-amber-900 border border-amber-300">🔑 Primary Key</span>' :
                       isFK ? '<span class="badge-pill bg-blue-100 text-blue-900 border border-blue-300">🔗 Foreign Key</span>' : '—';
      html += `
              <tr class="${isPK ? 'bg-amber-50/50' : isFK ? 'bg-blue-50/40' : ''}">
                <td class="font-mono font-semibold text-slate-800">${r[1]}</td>
                <td class="font-mono text-xs text-slate-500">${r[2] || 'TEXT'}</td>
                <td>${r[3] ? '<span class="text-emerald-600 font-bold">✓</span>' : '<span class="text-slate-300">nullable</span>'}</td>
                <td class="font-mono text-xs text-slate-400">${r[4] !== null ? r[4] : '—'}</td>
                <td>${isPK ? '🔑' : '—'}</td>
                <td>${keyBadge}</td>
              </tr>`;
    });
    html += `
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
  });

  if (!html) {
    html = `<div class="p-8 text-center bg-white rounded-xl border text-slate-400 text-sm">No tables match your filter "${currentSearchTerm}".</div>`;
  }
  container.innerHTML = html;
}

function toggleTableDetails(tbl) {
  const details = document.getElementById(`details-${tbl}`);
  const chevron = document.getElementById(`chevron-${tbl}`);
  if (!details) return;
  const isHidden = details.classList.contains('hidden');
  details.classList.toggle('hidden', !isHidden);
  if (chevron) chevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
}

function filterTablesByCategory(cat, btn) {
  currentTableCategory = cat;
  document.querySelectorAll('.cat-filter-btn').forEach(b => {
    b.classList.remove('bg-slate-900', 'text-white', 'shadow');
    b.classList.add('bg-white', 'text-slate-600', 'border');
  });
  btn.classList.add('bg-slate-900', 'text-white', 'shadow');
  btn.classList.remove('bg-white', 'text-slate-600');
  renderSchemaExplorer();
}

function handleTableSearch(term) {
  currentSearchTerm = term.trim().toLowerCase();
  renderSchemaExplorer();
}

function previewTableData(tbl) {
  switchTab('workbench');
  const sql = `SELECT * FROM ${tbl} LIMIT 10;`;
  document.getElementById('sql-input').value = sql;
  document.getElementById('query-title-display').textContent = `Live Table Preview: ${tbl}`;
  document.getElementById('query-intent').textContent = `Direct inspection of rows currently stored in the ${tbl} table.`;
  runQuery();
  showToast(`Loaded preview for <strong>${tbl}</strong>`, 'info');
}

// ---- Live SQL Workbench ----------------------------------------------------
let workbenchReady = false;
let activeQueryId = null;
let lastQueryResult = null;

function initWorkbench() {
  workbenchReady = true;
  const sidebar = document.getElementById('query-sidebar');
  if (!sidebar) return;
  let html = '';
  QUERIES.forEach(q => {
    html += `
    <button class="query-btn w-full text-left p-3 rounded-xl transition-all border border-transparent hover:border-slate-200 hover:bg-slate-100 group" data-qid="${q.id}" onclick="loadQuery(${q.id})">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 group-hover:bg-slate-300">${q.category}</span>
        <span class="text-xs text-slate-400">Q${q.id}</span>
      </div>
      <div class="font-semibold text-sm text-slate-800 mt-1.5 flex items-center gap-1.5">
        <span>${q.icon}</span> <span>${q.title}</span>
      </div>
      <p class="text-xs text-slate-500 mt-1 line-clamp-2">${q.businessIntent}</p>
    </button>`;
  });
  sidebar.innerHTML = html;

  // Load first query by default if none loaded
  if (!activeQueryId) loadQuery(1);
}

function loadQuery(id) {
  const q = QUERIES.find(x => x.id === id);
  if (!q) return;
  activeQueryId = id;
  document.getElementById('sql-input').value = q.sql;
  document.getElementById('query-intent').innerHTML = `<strong>Business Context:</strong> ${q.businessIntent}`;
  document.getElementById('query-title-display').innerHTML = `<span class="text-blue-500 mr-2">${q.icon}</span> Query ${q.id}: ${q.title}`;

  document.querySelectorAll('.query-btn').forEach(b => {
    const isThis = Number(b.dataset.qid) === id;
    b.classList.toggle('bg-slate-900', isThis);
    b.classList.toggle('text-white', isThis);
    b.classList.toggle('shadow-md', isThis);
    b.querySelectorAll('span, p').forEach(el => {
      if (isThis) {
        if (el.tagName === 'P') el.classList.replace('text-slate-500', 'text-slate-300');
      }
    });
  });

  runQuery();
}

function runQuery() {
  const sql = document.getElementById('sql-input').value.trim();
  if (!sql) return;
  const result = executeQuery(sql);
  lastQueryResult = result;

  const output = document.getElementById('query-output');
  const meta = document.getElementById('query-meta');

  if (result.error) {
    output.innerHTML = `
      <div class="p-6 bg-rose-50 border-t border-rose-200 text-rose-800">
        <div class="flex items-center gap-2 font-bold text-sm mb-1 text-rose-900">
          <span>⚠️</span> SQL Execution Error
        </div>
        <pre class="font-mono text-xs bg-rose-100/60 p-3 rounded text-rose-950 overflow-x-auto">${escHtml(result.error)}</pre>
      </div>`;
    meta.innerHTML = `<span class="text-rose-600 font-semibold">Failed (${result.ms} ms)</span>`;
    return;
  }

  if (result.columns.length === 0) {
    output.innerHTML = `
      <div class="p-8 text-center text-slate-500 text-sm">
        <div class="text-2xl mb-2">✅</div>
        Query executed successfully. 0 rows returned.
      </div>`;
    meta.innerHTML = `<span class="text-emerald-600 font-semibold">0 rows · ${result.ms} ms</span>`;
    return;
  }

  let html = `
    <div class="data-table-container max-h-[460px] overflow-y-auto">
      <table class="data-table">
        <thead>
          <tr>`;
  result.columns.forEach(c => {
    html += `<th>${escHtml(c)}</th>`;
  });
  html += `
          </tr>
        </thead>
        <tbody>`;

  result.rows.forEach(row => {
    html += '<tr>';
    row.forEach((val, i) => {
      let cell = val === null ? '<span class="text-slate-300 font-mono italic">NULL</span>' : escHtml(String(val));
      const col = result.columns[i].toLowerCase();

      // Smart automotive badge coloring
      if (col.includes('compliance') || col.includes('status') || col.includes('action')) {
        const v = String(val).toUpperCase();
        if (v.includes('BREACH') || v.includes('SUSPEND') || v.includes('FAILED') || v.includes('BLACKLIST'))
          cell = `<span class="badge-pill badge-breach">● ${cell}</span>`;
        else if (v.includes('COMPLIANT') || v.includes('PASSED') || v.includes('ACTIVE') || v.includes('SETTLED'))
          cell = `<span class="badge-pill badge-compliant">✓ ${cell}</span>`;
        else if (v.includes('PENDING') || v.includes('PROBATION') || v.includes('CONDITIONAL') || v.includes('HELD') || v.includes('ISSUED'))
          cell = `<span class="badge-pill badge-warning">⏳ ${cell}</span>`;
        else
          cell = `<span class="badge-pill badge-info">${cell}</span>`;
      } else if (typeof val === 'number' && (col.includes('ppm') || col.includes('cost') || col.includes('penalty') || col.includes('amount') || col.includes('fee'))) {
        cell = `<span class="font-mono font-medium">${val.toLocaleString()}</span>`;
      }

      html += `<td>${cell}</td>`;
    });
    html += '</tr>';
  });

  html += `
        </tbody>
      </table>
    </div>`;

  output.innerHTML = html;
  meta.innerHTML = `
    <span class="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
      <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
      <strong>${result.rows.length}</strong> record${result.rows.length !== 1 ? 's' : ''} retrieved in 
      <strong class="text-slate-700">${result.ms} ms</strong>
    </span>`;
}

function copyQuerySQL() {
  const sql = document.getElementById('sql-input').value;
  navigator.clipboard.writeText(sql).then(() => {
    showToast('SQL copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy SQL', 'error');
  });
}

function resetQuerySQL() {
  if (activeQueryId) {
    loadQuery(activeQueryId);
    showToast('Query reset to default', 'info');
  }
}

function exportQueryCSV() {
  if (!lastQueryResult || !lastQueryResult.columns || lastQueryResult.columns.length === 0) {
    showToast('No query data to export', 'error');
    return;
  }
  const cols = lastQueryResult.columns;
  const rows = lastQueryResult.rows;
  let csv = cols.map(c => `"${c.replace(/"/g, '""')}"`).join(',') + '\n';
  rows.forEach(r => {
    csv += r.map(v => v === null ? '' : `"${String(v).replace(/"/g, '""')}"`).join(',') + '\n';
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vqcms_query_${activeQueryId || 'custom'}_export.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported results to CSV', 'success');
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ---- Telemetry Charts (Chart.js) -------------------------------------------
let chartsRendered = false;

function renderCharts() {
  chartsRendered = true;
  if (!dbReady) return;

  // PPM Bar Chart
  const ppmCanvas = document.getElementById('chart-ppm');
  if (ppmCanvas) {
    const ppmData = executeQuery(`
      SELECT s.company_name, sc.max_allowable_ppm,
      ROUND((CAST(SUM(ir.defect_count) AS REAL) / SUM(ir.sample_size)) * 1000000.0, 0) AS ppm
      FROM suppliers s
      JOIN supplier_contracts sc ON s.supplier_id = sc.supplier_id
      JOIN purchase_orders po ON s.supplier_id = po.supplier_id
      JOIN po_line_items pli ON po.po_id = pli.po_id
      JOIN shipment_receipts sr ON pli.po_line_id = sr.po_line_id
      JOIN inspection_records ir ON sr.receipt_id = ir.receipt_id
      GROUP BY s.company_name, sc.max_allowable_ppm
      ORDER BY ppm DESC;
    `);

    if (ppmData.rows.length) {
      const labels = ppmData.rows.map(r => r[0].replace(/ (Precision|Thermal|Drivetrain|Friedrichshafen|Seiki|Turbo|Heavy|Roller).*/, ''));
      const actuals = ppmData.rows.map(r => r[2]);
      const limits = ppmData.rows.map(r => r[1]);
      const barColors = actuals.map((v, i) => v > limits[i] ? 'rgba(239, 68, 68, 0.85)' : 'rgba(16, 185, 129, 0.85)');

      new Chart(ppmCanvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Calculated Defect PPM',
              data: actuals,
              backgroundColor: barColors,
              borderRadius: 8,
              borderSkipped: false
            },
            {
              label: 'Contract SLA Maximum Limit',
              data: limits,
              type: 'line',
              borderColor: '#f59e0b',
              borderWidth: 2.5,
              borderDash: [6, 4],
              pointRadius: 5,
              pointBackgroundColor: '#f59e0b',
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 14, font: { weight: 'bold' } } },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              titleFont: { size: 13, weight: 'bold' },
              padding: 12,
              cornerRadius: 8
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(226, 232, 240, 0.6)' },
              title: { display: true, text: 'Parts-Per-Million (PPM)', font: { weight: 'bold' } }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }
  }

  // Downtime Losses Doughnut Chart
  const dtCanvas = document.getElementById('chart-downtime');
  if (dtCanvas) {
    const dtData = executeQuery(`
      SELECT p.plant_name, SUM(di.line_stoppage_cost) AS cost
      FROM downtime_incidents di
      JOIN plants p ON di.plant_id = p.plant_id
      GROUP BY p.plant_name
      ORDER BY cost DESC;
    `);

    if (dtData.rows.length) {
      new Chart(dtCanvas, {
        type: 'doughnut',
        data: {
          labels: dtData.rows.map(r => r[0].replace(/ (Assembly|Powertrain|Engine|High-Tech).*/, '')),
          datasets: [{
            data: dtData.rows.map(r => r[1]),
            backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#38bdf8'],
            borderWidth: 3,
            borderColor: '#ffffff',
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 14, font: { weight: 'bold' } } },
            tooltip: {
              callbacks: {
                label: ctx => ` ${ctx.label}: $${Number(ctx.raw).toLocaleString()} financial loss`
              }
            }
          },
          cutout: '65%'
        }
      });
    }
  }

  // Financial Telemetry Cards
  const finQ = executeQuery('SELECT SUM(claimed_amount), SUM(settled_amount) FROM rma_claims;');
  const penQ = executeQuery('SELECT SUM(total_penalty_amount) FROM penalty_invoices;');
  if (finQ.rows.length) {
    const elC = document.getElementById('tel-claimed');
    const elS = document.getElementById('tel-settled');
    if (elC) elC.textContent = '$' + Number(finQ.rows[0][0] || 0).toLocaleString();
    if (elS) elS.textContent = '$' + Number(finQ.rows[0][1] || 0).toLocaleString();
  }
  if (penQ.rows.length) {
    const elP = document.getElementById('tel-penalties');
    if (elP) elP.textContent = '$' + Number(penQ.rows[0][0] || 0).toLocaleString();
  }
}

// ---- Audit Trail & Lot Containment -----------------------------------------
let auditRendered = false;

function renderAuditTrail() {
  auditRendered = true;
  if (!dbReady) return;

  // Stepper for suspect batch LOT-2026-BORG-7890
  const timeline = [
    {
      step: '1. Dock Delivery at Detroit Bay 01',
      date: '2026-03-03 · 08:30 AM',
      desc: 'Carrier DHL arrives with 1,000 turbo actuators under BOL-DET-00341. Logged into shipment_receipts with clean exterior.',
      status: 'active',
      badge: 'RECEIVED'
    },
    {
      step: '2. QC Lab Dimensional Inspection',
      date: '2026-03-04 · 09:15 AM',
      desc: 'Lead Auditor Robert Miller pulls sample of 200 units. Discovers 14 out-of-tolerance linkage pins (70,000 PPM vs 90 PPM SLA limit). FAILED.',
      status: 'danger',
      badge: 'INSPECTION FAILED'
    },
    {
      step: '3. Engine Trigger Fires & Bay Quarantine',
      date: '2026-03-04 · 09:45 AM',
      desc: 'Automatic trigger updates calculated_ppm to 70,000. Full batch of 1,000 units isolated into holding bay BAY-Q-DET-04.',
      status: 'warning',
      badge: 'QUARANTINE HOLD'
    },
    {
      step: '4. Detroit Engine Line 1 Stoppage',
      date: '2026-03-04 · 10:15 AM',
      desc: 'Assembly feeder jams on defective actuator. 150 minutes of factory downtime accrued ($15,000 direct stoppage fee).',
      status: 'danger',
      badge: 'LINE DOWNTIME'
    },
    {
      step: '5. Automated RMA Refund Claim Filed',
      date: '2026-03-05 · 11:00 AM',
      desc: 'RMA-2026-BORG-002 initiated for 100% full refund of $88,000 under contract CTR-2025-BORG-01. Status: APPROVED.',
      status: 'warning',
      badge: 'RMA CLAIM'
    },
    {
      step: '6. Penalty Debit Memo Issued',
      date: '2026-03-06 · 02:00 PM',
      desc: 'Debit memo DEBIT-2026-002 automatically debited against BorgWarner payables: $10,000 base + $15,000 downtime = $25,000 total penalty.',
      status: 'danger',
      badge: 'DEBIT MEMO $25,000'
    }
  ];

  const timelineEl = document.getElementById('audit-timeline');
  if (timelineEl) {
    timelineEl.innerHTML = timeline.map(t => `
      <div class="timeline-card-step ${t.status}">
        <div class="timeline-node"></div>
        <div class="flex items-center justify-between gap-2 mb-1">
          <span class="text-xs font-mono font-semibold text-slate-400">${t.date}</span>
          <span class="text-xs font-bold px-2 py-0.5 rounded ${t.status === 'danger' ? 'bg-rose-100 text-rose-800' : t.status === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">${t.badge}</span>
        </div>
        <div class="font-bold text-sm text-slate-900">${t.step}</div>
        <div class="text-xs text-slate-600 mt-1 leading-relaxed">${t.desc}</div>
      </div>
    `).join('');
  }

  // Compliance Audit Log Table
  filterAuditLog('');
}

function filterAuditLog(term) {
  const logEl = document.getElementById('audit-log-table');
  if (!logEl || !dbReady) return;

  const logs = executeQuery(`
    SELECT audit_id, table_name, record_id, action_type, previous_state, new_state, changed_by, changed_at
    FROM compliance_audit_log
    ORDER BY changed_at ASC;
  `);

  if (!logs.rows.length) {
    logEl.innerHTML = '<div class="p-6 text-center text-slate-400 text-xs">No audit records found.</div>';
    return;
  }

  const query = term.toLowerCase();
  const filtered = logs.rows.filter(r => 
    !query || 
    r[1].toLowerCase().includes(query) || 
    r[3].toLowerCase().includes(query) || 
    r[6].toLowerCase().includes(query)
  );

  let html = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Audit ID</th>
          <th>Table</th>
          <th>Record ID</th>
          <th>Action Type</th>
          <th>Previous State</th>
          <th>New State</th>
          <th>Author</th>
          <th>Timestamp</th>
        </tr>
      </thead>
      <tbody>`;

  filtered.forEach(r => {
    html += `
      <tr>
        <td class="font-mono text-xs text-slate-400 font-bold">#${r[0]}</td>
        <td class="font-mono text-xs font-semibold text-slate-800">${r[1]}</td>
        <td class="font-mono text-xs text-slate-600">${r[2]}</td>
        <td><span class="badge-pill badge-warning">${r[3]}</span></td>
        <td class="text-xs text-slate-500">${r[4] || '—'}</td>
        <td class="text-xs font-semibold text-slate-800">${r[5] || '—'}</td>
        <td class="text-xs text-slate-600">${r[6]}</td>
        <td class="font-mono text-xs text-slate-400">${r[7]}</td>
      </tr>`;
  });

  html += '</tbody></table>';
  logEl.innerHTML = html;
}

// ---- Viva Defense Accordion ------------------------------------------------
function toggleViva(el) {
  const answer = el.nextElementSibling;
  const arrow = el.querySelector('.arrow');
  if (!answer) return;
  const isHidden = answer.classList.contains('hidden');
  answer.classList.toggle('hidden', !isHidden);
  if (arrow) arrow.textContent = isHidden ? '▾' : '▸';
}

// ---- Initialization --------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initDatabase();
  document.addEventListener('db-ready', () => {
    updateOverviewKPIs();
    if (activeTab === 'schema') renderSchemaExplorer();
    if (activeTab === 'telemetry') renderCharts();
    if (activeTab === 'audit') renderAuditTrail();
    if (activeTab === 'workbench') initWorkbench();
  });
});
