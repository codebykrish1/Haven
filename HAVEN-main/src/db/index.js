// IN-MEMORY MOCK DB — no real database needed
import { v4 as uuidv4 } from 'uuid';

// ── Tables ──────────────────────────────────────────────────────────────────
const db = {
  workers: [],
  policies: [],
  disruption_events: [],
  claims: [],
  active_hours: [],
  policy_streaks: [],
  sos_events: [],
  fraud_alerts: [],
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const now = () => new Date().toISOString();
const uuid = () => uuidv4();
const rows = (data) => Promise.resolve({ rows: data, rowCount: data.length });

// Tiny SQL parser — handles the patterns used in HAVEN controllers
export const query = (text, params = []) => {
  const sql = text.trim().replace(/\s+/g, ' ').toLowerCase();

  // ── SELECT NOW() ────────────────────────────────────────────────────────
  if (sql.includes('select now()')) {
    return rows([{ now: now() }]);
  }

  // ── Determine table ──────────────────────────────────────────────────────
  const table = detectTable(sql);
  if (!table) return rows([]);

  // ── INSERT ───────────────────────────────────────────────────────────────
  if (sql.startsWith('insert')) {
    const record = buildInsert(table, text, params);
    db[table].push(record);
    return rows([record]);
  }

  // ── UPDATE ───────────────────────────────────────────────────────────────
  if (sql.startsWith('update')) {
    return handleUpdate(table, text, params);
  }

  // ── SELECT ───────────────────────────────────────────────────────────────
  if (sql.startsWith('select')) {
    return handleSelect(table, text, params, sql);
  }

  return rows([]);
};

// ── Table detection ──────────────────────────────────────────────────────────
function detectTable(sql) {
  const tables = Object.keys(db);
  for (const t of tables) {
    if (sql.includes(t)) return t;
  }
  return null;
}

// ── INSERT builder ───────────────────────────────────────────────────────────
function buildInsert(table, text, params) {
  // Extract column names from INSERT INTO table (col1, col2, ...) VALUES
  const colMatch = text.match(/\(([^)]+)\)\s*(?:values|VALUES)/i);
  if (!colMatch) return { id: uuid(), created_at: now() };

  const cols = colMatch[1].split(',').map((c) => c.trim().replace(/\n/g, ''));
  const record = {};

  // Primary key
  const pkMap = {
    workers: 'worker_id', policies: 'policy_id', claims: 'claim_id',
    disruption_events: 'event_id', active_hours: 'session_id',
    policy_streaks: 'streak_id', sos_events: 'sos_id', fraud_alerts: 'alert_id',
  };
  record[pkMap[table]] = uuid();
  record.created_at = now();

  // Defaults
  const defaults = {
    workers: { risk_score: 50, kyc_verified: false },
    policies: { status: 'ACTIVE' },
    claims: { status: 'PENDING', auto_triggered: false, fraud_score: 0 },
    active_hours: { status: 'ACTIVE', started_at: now() },
    policy_streaks: { current_streak: 1, longest_streak: 1, total_weeks_covered: 1 },
    sos_events: { status: 'ACTIVE' },
    fraud_alerts: { status: 'OPEN' },
  };
  Object.assign(record, defaults[table] || {});

  cols.forEach((col, i) => {
    if (params[i] !== undefined) record[col] = params[i];
  });

  return record;
}

// ── UPDATE handler ───────────────────────────────────────────────────────────
function handleUpdate(table, text, params) {
  // Find WHERE clause with $N param — last param is usually the ID
  const whereMatch = text.match(/where\s+(\w+)\s*=\s*\$(\d+)/i);
  if (!whereMatch) return rows([]);

  const whereCol = whereMatch[1];
  const whereIdx = parseInt(whereMatch[2]) - 1;
  const whereVal = params[whereIdx];

  // Parse SET assignments
  const setMatch = text.match(/set\s+([\s\S]+?)\s+where/i);
  if (!setMatch) return rows([]);

  const setParts = setMatch[1].split(',').map((s) => s.trim());
  const updates = {};
  setParts.forEach((part) => {
    const m = part.match(/(\w+)\s*=\s*\$(\d+)/i);
    if (m) {
      const col = m[1];
      const idx = parseInt(m[2]) - 1;
      if (params[idx] !== undefined) updates[col] = params[idx];
    } else {
      // Handle literal assignments like status = 'APPROVED'
      const lit = part.match(/(\w+)\s*=\s*'([^']+)'/i);
      if (lit) updates[lit[1]] = lit[2];
    }
  });

  const updated = [];
  db[table] = db[table].map((r) => {
    if (String(r[whereCol]) === String(whereVal)) {
      const newR = { ...r, ...updates };
      updated.push(newR);
      return newR;
    }
    return r;
  });

  return rows(updated);
}

// ── SELECT handler ───────────────────────────────────────────────────────────
function handleSelect(table, text, params, sql) {
  let results = [...db[table]];

  // Handle aggregate COUNT queries (dashboard stats)
  if (sql.includes('count(*)') || sql.includes('coalesce(sum')) {
    return rows([buildAggregates(table, params[0])]);
  }

  // Filter by WHERE $1, $2 params
  const whereMatches = [...text.matchAll(/(\w+)\s*=\s*\$(\d+)/gi)];
  whereMatches.forEach((m) => {
    const col = m[1];
    const idx = parseInt(m[2]) - 1;
    const val = params[idx];
    if (val !== undefined) {
      results = results.filter((r) => String(r[col]) === String(val));
    }
  });

  // JOIN enrichment — attach related data
  if (sql.includes('join policies') || sql.includes('join workers')) {
    results = results.map((r) => enrich(r, table));
  }

  // LIMIT
  const limitMatch = sql.match(/limit\s+(\d+)/);
  if (limitMatch) results = results.slice(0, parseInt(limitMatch[1]));

  // ORDER BY created_at DESC (default)
  if (sql.includes('order by') && sql.includes('desc')) {
    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  return rows(results);
}

// ── Aggregate builder for dashboard ─────────────────────────────────────────
function buildAggregates(table, worker_id) {
  if (table === 'claims') {
    const workerClaims = worker_id
      ? db.claims.filter((c) => c.worker_id === worker_id)
      : db.claims;
    return {
      pending_claims: workerClaims.filter((c) => c.status === 'PENDING').length,
      approved_claims: workerClaims.filter((c) => c.status === 'APPROVED').length,
      paid_claims: workerClaims.filter((c) => c.status === 'PAID').length,
      flagged_claims: workerClaims.filter((c) => c.status === 'FLAGGED').length,
      total_paid_out: workerClaims
        .filter((c) => c.status === 'PAID')
        .reduce((s, c) => s + parseFloat(c.claim_amount || 0), 0),
      total_claims: workerClaims.length,
      total_paid: workerClaims
        .filter((c) => c.status === 'PAID')
        .reduce((s, c) => s + parseFloat(c.claim_amount || 0), 0),
    };
  }
  if (table === 'policies') {
    return {
      total_policies: worker_id
        ? db.policies.filter((p) => p.worker_id === worker_id).length
        : db.policies.length,
    };
  }
  return {};
}

// ── Enrich records with joined data ─────────────────────────────────────────
function enrich(record, table) {
  const r = { ...record };
  if (table === 'claims') {
    const policy = db.policies.find((p) => p.policy_id === r.policy_id) || {};
    const event = db.disruption_events.find((e) => e.event_id === r.event_id) || {};
    const worker = db.workers.find((w) => w.worker_id === r.worker_id) || {};
    Object.assign(r, {
      coverage_tier: policy.coverage_tier,
      week_start_date: policy.week_start_date,
      week_end_date: policy.week_end_date,
      premium_amount: policy.premium_amount,
      event_type: event.event_type,
      city: event.city,
      zone_id: event.zone_id,
      severity: event.severity,
      trigger_value: event.trigger_value,
      threshold_value: event.threshold_value,
      event_timestamp: event.event_timestamp,
      full_name: worker.full_name,
      phone_number: worker.phone_number,
      upi_id: worker.upi_id,
    });
  }
  return r;
}

// ── Pool mock (server.js calls pool.query directly for health check) ─────────
const poolMock = {
  query: (text) => query(text),
};

export const initPool = () => {
  console.log('✅ Mock in-memory DB initialized');
  return poolMock;
};

export default () => poolMock;
