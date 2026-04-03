import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/index.js';

// GET /api/claims/my
export const getMyClaims = async (req, res) => {
  const worker_id = req.worker.worker_id;
  const { status } = req.query;

  try {
    let queryText = `
      SELECT 
        c.*,
        p.coverage_tier,
        p.week_start_date,
        p.week_end_date,
        de.event_type,
        de.city,
        de.severity,
        de.event_timestamp
      FROM claims c
      JOIN policies p ON c.policy_id = p.policy_id
      LEFT JOIN disruption_events de ON c.event_id = de.event_id
      WHERE c.worker_id = $1
    `;
    const params = [worker_id];

    if (status) {
      queryText += ` AND c.status = $2`;
      params.push(status.toUpperCase());
    }

    queryText += ' ORDER BY c.created_at DESC';

    const result = await query(queryText, params);

    res.json({
      count: result.rows.length,
      claims: result.rows,
    });
  } catch (err) {
    console.error('Get my claims error:', err.message);
    res.status(500).json({ error: 'Server error while fetching claims' });
  }
};

// GET /api/claims/:id
export const getClaimById = async (req, res) => {
  const { id } = req.params;
  const worker_id = req.worker.worker_id;

  try {
    const result = await query(
      `SELECT 
        c.*,
        p.coverage_tier,
        p.week_start_date,
        p.week_end_date,
        p.premium_amount,
        de.event_type,
        de.city,
        de.zone_id,
        de.severity,
        de.trigger_value,
        de.threshold_value,
        de.event_timestamp,
        w.full_name,
        w.phone_number,
        w.upi_id
       FROM claims c
       JOIN policies p ON c.policy_id = p.policy_id
       LEFT JOIN disruption_events de ON c.event_id = de.event_id
       JOIN workers w ON c.worker_id = w.worker_id
       WHERE c.claim_id = $1 AND c.worker_id = $2`,
      [id, worker_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    res.json({ claim: result.rows[0] });
  } catch (err) {
    console.error('Get claim error:', err.message);
    res.status(500).json({ error: 'Server error while fetching claim' });
  }
};

// PATCH /api/claims/:id/approve
export const approveClaim = async (req, res) => {
  const { id } = req.params;
  const worker_id = req.worker.worker_id;

  try {
    // Get claim
    const claimResult = await query(
      'SELECT * FROM claims WHERE claim_id = $1 AND worker_id = $2',
      [id, worker_id]
    );

    if (claimResult.rows.length === 0) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    const claim = claimResult.rows[0];

    if (claim.status !== 'PENDING') {
      return res.status(400).json({
        error: `Claim cannot be approved — current status is ${claim.status}`,
      });
    }

    if (claim.fraud_score > 70) {
      return res.status(400).json({
        error: 'Claim flagged for fraud review — cannot auto-approve',
        fraud_score: claim.fraud_score,
      });
    }

    // Approve claim
    const result = await query(
      `UPDATE claims 
       SET status = 'APPROVED'
       WHERE claim_id = $1
       RETURNING *`,
      [id]
    );

    res.json({
      message: 'Claim approved successfully',
      claim: result.rows[0],
    });
  } catch (err) {
    console.error('Approve claim error:', err.message);
    res.status(500).json({ error: 'Server error while approving claim' });
  }
};

// PATCH /api/claims/:id/pay
export const payClaim = async (req, res) => {
  const { id } = req.params;
  const worker_id = req.worker.worker_id;

  try {
    // Get claim with worker UPI
    const claimResult = await query(
      `SELECT c.*, w.upi_id, w.full_name 
       FROM claims c
       JOIN workers w ON c.worker_id = w.worker_id
       WHERE c.claim_id = $1 AND c.worker_id = $2`,
      [id, worker_id]
    );

    if (claimResult.rows.length === 0) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    const claim = claimResult.rows[0];

    if (claim.status !== 'APPROVED') {
      return res.status(400).json({
        error: `Claim must be APPROVED before payout — current status is ${claim.status}`,
      });
    }

    // Simulate UPI payout
    const payout_txn_id = `HAVEN-PAY-${uuidv4().split('-')[0].toUpperCase()}`;

    const result = await query(
      `UPDATE claims 
       SET status = 'PAID',
           payout_txn_id = $1,
           payout_at = NOW()
       WHERE claim_id = $2
       RETURNING *`,
      [payout_txn_id, id]
    );

    const paidClaim = result.rows[0];

    // Update worker risk score slightly positively
    await query(
      `UPDATE workers 
       SET risk_score = GREATEST(0, LEAST(100, risk_score - 2))
       WHERE worker_id = $1`,
      [worker_id]
    );

    res.json({
      message: 'Payout processed successfully',
      claim: paidClaim,
      payout: {
        txn_id: payout_txn_id,
        amount: `₹${paidClaim.claim_amount}`,
        upi_id: claim.upi_id,
        worker: claim.full_name,
        paid_at: paidClaim.payout_at,
        note: '💸 Simulated UPI payout — Razorpay sandbox in production',
      },
    });
  } catch (err) {
    console.error('Pay claim error:', err.message);
    res.status(500).json({ error: 'Server error while processing payout' });
  }
};

// PATCH /api/claims/:id/flag
export const flagClaim = async (req, res) => {
  const { id } = req.params;
  const { fraud_score, reason } = req.body;
  const worker_id = req.worker.worker_id;

  try {
    const claimResult = await query(
      'SELECT * FROM claims WHERE claim_id = $1 AND worker_id = $2',
      [id, worker_id]
    );

    if (claimResult.rows.length === 0) {
      return res.status(404).json({ error: 'Claim not found' });
    }

    const result = await query(
      `UPDATE claims 
       SET status = 'FLAGGED',
           fraud_score = $1,
           rejection_reason = $2
       WHERE claim_id = $3
       RETURNING *`,
      [fraud_score || 80, reason || 'Flagged for manual review', id]
    );

    // Create fraud alert
    await query(
      `INSERT INTO fraud_alerts
        (claim_id, worker_id, alert_type, fraud_score, evidence, status)
       VALUES ($1, $2, $3, $4, $5, 'OPEN')`,
      [
        id,
        worker_id,
        'MANUAL_FLAG',
        fraud_score || 80,
        JSON.stringify({ reason: reason || 'Flagged for manual review' }),
      ]
    );

    res.json({
      message: 'Claim flagged for fraud review',
      claim: result.rows[0],
    });
  } catch (err) {
    console.error('Flag claim error:', err.message);
    res.status(500).json({ error: 'Server error while flagging claim' });
  }
};

// F-10 — POST /api/claims/quick
export const quickClaim = async (req, res) => {
  const worker_id = req.worker.worker_id;
  const { latitude, longitude, event_type } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'GPS coordinates are required' });
  }

  try {
    // Get worker's active policy
    const policyResult = await query(
      `SELECT * FROM policies
       WHERE worker_id = $1
       AND status = 'ACTIVE'
       AND week_start_date <= CURRENT_DATE
       AND week_end_date >= CURRENT_DATE`,
      [worker_id]
    );

    if (policyResult.rows.length === 0) {
      return res.status(404).json({
        error: 'No active policy found for this week. Purchase a policy first.',
      });
    }

    const policy = policyResult.rows[0];

    // Check if claim already exists for this policy today
    const existingClaim = await query(
      `SELECT claim_id FROM claims
       WHERE policy_id = $1
       AND DATE(created_at) = CURRENT_DATE
       AND auto_triggered = false`,
      [policy.policy_id]
    );

    if (existingClaim.rows.length > 0) {
      return res.status(409).json({
        error: 'You already filed a quick claim today',
        claim_id: existingClaim.rows[0].claim_id,
      });
    }

    // Find most recent disruption event in worker's zone (last 6 hours)
    const eventResult = await query(
      `SELECT * FROM disruption_events
       WHERE zone_id = $1
       AND event_timestamp >= NOW() - INTERVAL '6 hours'
       ORDER BY event_timestamp DESC
       LIMIT 1`,
      [policy.zone_id]
    );

    const event = eventResult.rows[0] || null;

    // Create claim
    const result = await query(
      `INSERT INTO claims
        (policy_id, worker_id, event_id, claim_amount, status, auto_triggered)
       VALUES ($1, $2, $3, $4, 'PENDING', false)
       RETURNING *`,
      [
        policy.policy_id,
        worker_id,
        event ? event.event_id : null,
        policy.coverage_amount,
      ]
    );

    res.status(201).json({
      message: '⚡ Quick claim filed successfully',
      claim: result.rows[0],
      location_recorded: { latitude, longitude },
      timestamp: new Date().toISOString(),
      policy: {
        coverage_tier: policy.coverage_tier,
        coverage_amount: `₹${policy.coverage_amount}`,
        zone_id: policy.zone_id,
      },
      event_linked: event
        ? {
            type: event.event_type,
            city: event.city,
            severity: event.severity,
            time: event.event_timestamp,
          }
        : null,
      note: event
        ? '✅ Disruption event found in your zone — claim linked automatically'
        : '⚠️ No recent disruption found — claim will go to manual review',
    });
  } catch (err) {
    console.error('Quick claim error:', err.message);
    res.status(500).json({ error: 'Server error while filing quick claim' });
  }
};
