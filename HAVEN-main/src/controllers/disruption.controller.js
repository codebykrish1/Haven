import { query } from '../db/index.js';

// Disruption thresholds
const DISRUPTION_THRESHOLDS = {
  rain: { threshold: 50, unit: 'mm/hr' },
  flood: { threshold: 3, unit: 'flood_level' },
  heatwave: { threshold: 42, unit: 'celsius' },
  storm: { threshold: 80, unit: 'km/hr wind' },
  strike: { threshold: 1, unit: 'event' },
  road_closure: { threshold: 1, unit: 'event' },
};

// Helper — auto trigger claims for all active policies in zone
const triggerClaimsForEvent = async (event) => {
  try {
    // Find all active policies in the same zone that cover this disruption type
    const activePolicies = await query(
      `SELECT p.*, w.worker_id, w.full_name 
       FROM policies p
       JOIN workers w ON p.worker_id = w.worker_id
       WHERE p.zone_id = $1
       AND p.status = 'ACTIVE'
       AND p.week_start_date <= CURRENT_DATE
       AND p.week_end_date >= CURRENT_DATE
       AND $2 = ANY(p.disruption_types)`,
      [event.zone_id, event.event_type]
    );

    console.log(
      `🔍 Found ${activePolicies.rows.length} active policies in zone ${event.zone_id} for ${event.event_type}`
    );

    // Create a claim for each active policy
    const claimPromises = activePolicies.rows.map(async (policy) => {
      // Check if claim already exists for this policy + event
      const existingClaim = await query(
        `SELECT claim_id FROM claims 
         WHERE policy_id = $1 AND event_id = $2`,
        [policy.policy_id, event.event_id]
      );

      if (existingClaim.rows.length > 0) {
        console.log(`⚠️ Claim already exists for policy ${policy.policy_id}`);
        return null;
      }

      // Calculate claim amount based on severity
      let claim_amount = parseFloat(policy.coverage_amount);
      if (event.severity === 'LOW') claim_amount = claim_amount * 0.5;
      if (event.severity === 'MEDIUM') claim_amount = claim_amount * 0.75;
      if (event.severity === 'HIGH') claim_amount = claim_amount * 1.0;

      // Create claim
      const claim = await query(
        `INSERT INTO claims 
          (policy_id, worker_id, event_id, claim_amount, status, auto_triggered)
         VALUES ($1, $2, $3, $4, 'PENDING', true)
         RETURNING *`,
        [
          policy.policy_id,
          policy.worker_id,
          event.event_id,
          claim_amount.toFixed(2),
        ]
      );

      console.log(
        `✅ Auto-claim created for worker ${policy.full_name} — ₹${claim_amount}`
      );

      return claim.rows[0];
    });

    const claims = await Promise.all(claimPromises);
    return claims.filter(Boolean);
  } catch (err) {
    console.error('❌ Error triggering claims:', err.message);
    return [];
  }
};

// POST /api/disruptions
export const createDisruptionEvent = async (req, res) => {
  const {
    event_type,
    zone_id,
    city,
    severity,
    trigger_value,
    raw_data,
    event_timestamp,
  } = req.body;

  // Validation
  if (!event_type || !zone_id || !city || !severity || !trigger_value) {
    return res.status(400).json({
      error:
        'event_type, zone_id, city, severity and trigger_value are required',
    });
  }

  if (!['LOW', 'MEDIUM', 'HIGH'].includes(severity)) {
    return res.status(400).json({
      error: 'severity must be LOW, MEDIUM or HIGH',
    });
  }

  if (!DISRUPTION_THRESHOLDS[event_type]) {
    return res.status(400).json({
      error: `Invalid event_type. Must be one of: ${Object.keys(DISRUPTION_THRESHOLDS).join(', ')}`,
    });
  }

  const threshold = DISRUPTION_THRESHOLDS[event_type].threshold;

  // Check if trigger value exceeds threshold
  if (parseFloat(trigger_value) < threshold) {
    return res.status(400).json({
      error: `Trigger value ${trigger_value} is below threshold ${threshold} for ${event_type}`,
      threshold,
      trigger_value,
    });
  }

  try {
    // Create disruption event
    const result = await query(
      `INSERT INTO disruption_events
        (event_type, zone_id, city, severity, trigger_value, threshold_value, raw_data, event_timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        event_type,
        zone_id,
        city,
        severity,
        trigger_value,
        threshold,
        raw_data ? JSON.stringify(raw_data) : null,
        event_timestamp || new Date().toISOString(),
      ]
    );

    const event = result.rows[0];

    console.log(
      `🌧️ Disruption event created: ${event_type} in ${city} (${zone_id}) — ${severity}`
    );

    // Auto-trigger claims for all active policies in this zone
    const triggeredClaims = await triggerClaimsForEvent(event);

    res.status(201).json({
      message: 'Disruption event logged successfully',
      event,
      claims_triggered: triggeredClaims.length,
      claims: triggeredClaims,
    });
  } catch (err) {
    console.error('Create disruption error:', err.message);
    res.status(500).json({ error: 'Server error while logging disruption' });
  }
};

// GET /api/disruptions
export const getAllDisruptions = async (req, res) => {
  const { zone_id, event_type, severity } = req.query;

  try {
    let queryText = 'SELECT * FROM disruption_events WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (zone_id) {
      queryText += ` AND zone_id = $${paramCount++}`;
      params.push(zone_id);
    }

    if (event_type) {
      queryText += ` AND event_type = $${paramCount++}`;
      params.push(event_type);
    }

    if (severity) {
      queryText += ` AND severity = $${paramCount++}`;
      params.push(severity);
    }

    queryText += ' ORDER BY event_timestamp DESC LIMIT 50';

    const result = await query(queryText, params);

    res.json({
      count: result.rows.length,
      disruptions: result.rows,
    });
  } catch (err) {
    console.error('Get disruptions error:', err.message);
    res.status(500).json({ error: 'Server error while fetching disruptions' });
  }
};

// GET /api/disruptions/:id
export const getDisruptionById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query(
      'SELECT * FROM disruption_events WHERE event_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Disruption event not found' });
    }

    // Also get claims triggered by this event
    const claims = await query(
      `SELECT c.*, w.full_name, w.phone_number 
       FROM claims c
       JOIN workers w ON c.worker_id = w.worker_id
       WHERE c.event_id = $1`,
      [id]
    );

    res.json({
      disruption: result.rows[0],
      claims_triggered: claims.rows.length,
      claims: claims.rows,
    });
  } catch (err) {
    console.error('Get disruption error:', err.message);
    res.status(500).json({ error: 'Server error while fetching disruption' });
  }
};
