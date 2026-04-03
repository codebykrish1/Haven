import { query } from '../db/index.js';

// GET /api/workers/profile
export const getProfile = async (req, res) => {
  const worker_id = req.worker.worker_id;

  try {
    const result = await query(
      `SELECT 
        worker_id, full_name, email, phone_number, platform,
        city, zone_id, avg_daily_earning, upi_id, risk_score,
        kyc_verified, created_at
       FROM workers WHERE worker_id = $1`,
      [worker_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    res.json({ worker: result.rows[0] });
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).json({ error: 'Server error while fetching profile' });
  }
};

// PATCH /api/workers/profile
export const updateProfile = async (req, res) => {
  const worker_id = req.worker.worker_id;
  const { full_name, upi_id, city, zone_id, avg_daily_earning, platform } =
    req.body;

  // Build dynamic update query — only update fields that are provided
  const updates = [];
  const params = [];
  let paramCount = 1;

  if (full_name) {
    updates.push(`full_name = $${paramCount++}`);
    params.push(full_name);
  }
  if (upi_id) {
    updates.push(`upi_id = $${paramCount++}`);
    params.push(upi_id);
  }
  if (city) {
    updates.push(`city = $${paramCount++}`);
    params.push(city);
  }
  if (zone_id) {
    updates.push(`zone_id = $${paramCount++}`);
    params.push(zone_id);
  }
  if (avg_daily_earning) {
    updates.push(`avg_daily_earning = $${paramCount++}`);
    params.push(avg_daily_earning);
  }
  if (platform) {
    updates.push(`platform = $${paramCount++}`);
    params.push(platform);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields provided to update' });
  }

  params.push(worker_id);

  try {
    const result = await query(
      `UPDATE workers SET ${updates.join(', ')} 
       WHERE worker_id = $${paramCount}
       RETURNING worker_id, full_name, email, phone_number, platform,
                 city, zone_id, avg_daily_earning, upi_id, risk_score,
                 kyc_verified, created_at`,
      params
    );

    res.json({
      message: 'Profile updated successfully',
      worker: result.rows[0],
    });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ error: 'Server error while updating profile' });
  }
};

// GET /api/workers/dashboard
export const getDashboard = async (req, res) => {
  const worker_id = req.worker.worker_id;

  try {
    // Get worker
    const workerResult = await query(
      `SELECT worker_id, full_name, platform, city, zone_id,
              avg_daily_earning, risk_score, kyc_verified
       FROM workers WHERE worker_id = $1`,
      [worker_id]
    );

    if (workerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const worker = workerResult.rows[0];

    // Get active policy this week
    const activePolicyResult = await query(
      `SELECT * FROM policies
       WHERE worker_id = $1
       AND status = 'ACTIVE'
       AND week_start_date <= CURRENT_DATE
       AND week_end_date >= CURRENT_DATE`,
      [worker_id]
    );

    // Get claims summary
    const claimsSummaryResult = await query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'PENDING') AS pending_claims,
        COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved_claims,
        COUNT(*) FILTER (WHERE status = 'PAID') AS paid_claims,
        COUNT(*) FILTER (WHERE status = 'FLAGGED') AS flagged_claims,
        COALESCE(SUM(claim_amount) FILTER (WHERE status = 'PAID'), 0) AS total_paid_out
       FROM claims
       WHERE worker_id = $1`,
      [worker_id]
    );

    // Get total policies purchased
    const policiesCountResult = await query(
      `SELECT COUNT(*) AS total_policies
       FROM policies WHERE worker_id = $1`,
      [worker_id]
    );

    // Get recent claims (last 5)
    const recentClaimsResult = await query(
      `SELECT 
        c.claim_id,
        c.claim_amount,
        c.status,
        c.created_at,
        c.payout_at,
        de.event_type,
        de.city,
        de.severity
       FROM claims c
       LEFT JOIN disruption_events de ON c.event_id = de.event_id
       WHERE c.worker_id = $1
       ORDER BY c.created_at DESC
       LIMIT 5`,
      [worker_id]
    );

    // Calculate GigScore (1.0 - 5.0)
    // Formula: base 3.0, +/- based on claim history and risk score
    const risk = worker.risk_score;
    const gigScore = Math.max(
      1.0,
      Math.min(5.0, (5.0 - (risk / 100) * 4).toFixed(1))
    );

    const claims = claimsSummaryResult.rows[0];

    res.json({
      worker: {
        ...worker,
        gig_score: parseFloat(gigScore),
      },
      active_policy: activePolicyResult.rows[0] || null,
      stats: {
        total_policies: parseInt(policiesCountResult.rows[0].total_policies),
        pending_claims: parseInt(claims.pending_claims),
        approved_claims: parseInt(claims.approved_claims),
        paid_claims: parseInt(claims.paid_claims),
        flagged_claims: parseInt(claims.flagged_claims),
        total_income_protected: `₹${parseFloat(claims.total_paid_out).toFixed(2)}`,
      },
      recent_claims: recentClaimsResult.rows,
    });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.status(500).json({ error: 'Server error while fetching dashboard' });
  }
};

// F-06 — GET /api/workers/calendar
export const getIncomeCalendar = async (req, res) => {
  const worker_id = req.worker.worker_id;
  const { month, year } = req.query;

  // Default to current month/year
  const targetMonth = parseInt(month) || new Date().getMonth() + 1;
  const targetYear = parseInt(year) || new Date().getFullYear();

  try {
    const worker = await query(
      'SELECT avg_daily_earning, city, zone_id FROM workers WHERE worker_id = $1',
      [worker_id]
    );

    if (worker.rows.length === 0) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const { avg_daily_earning, zone_id } = worker.rows[0];

    // Get all claims for this month with their event dates
    const claimsResult = await query(
      `SELECT 
        c.claim_id,
        c.claim_amount,
        c.status,
        c.payout_at,
        c.created_at,
        de.event_type,
        de.event_timestamp,
        de.severity
       FROM claims c
       LEFT JOIN disruption_events de ON c.event_id = de.event_id
       WHERE c.worker_id = $1
       AND EXTRACT(MONTH FROM c.created_at) = $2
       AND EXTRACT(YEAR FROM c.created_at) = $3`,
      [worker_id, targetMonth, targetYear]
    );

    // Get all active_hours sessions for this month
    const hoursResult = await query(
      `SELECT 
        DATE(started_at) as work_date,
        SUM(duration_minutes) as total_minutes,
        SUM(premium_charged) as total_premium
       FROM active_hours
       WHERE worker_id = $1
       AND status = 'ENDED'
       AND EXTRACT(MONTH FROM started_at) = $2
       AND EXTRACT(YEAR FROM started_at) = $3
       GROUP BY DATE(started_at)`,
      [worker_id, targetMonth, targetYear]
    );

    // Get disruption events in worker's zone this month
    const disruptionsResult = await query(
      `SELECT 
        DATE(event_timestamp) as disruption_date,
        event_type,
        severity,
        city
       FROM disruption_events
       WHERE zone_id = $1
       AND EXTRACT(MONTH FROM event_timestamp) = $2
       AND EXTRACT(YEAR FROM event_timestamp) = $3`,
      [zone_id, targetMonth, targetYear]
    );

    // Build calendar
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    const calendar = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(targetYear, targetMonth - 1, day));
      const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isFuture = date > new Date();

      // Find work session for this day
      const workSession = hoursResult.rows.find((r) => r.work_date === dateStr);

      // Find disruption for this day
      const disruption = disruptionsResult.rows.find(
        (r) => r.disruption_date === dateStr
      );

      // Find claim for this day
      const claim = claimsResult.rows.find((r) => {
        const claimDate = new Date(r.created_at).toISOString().split('T')[0];
        return claimDate === dateStr;
      });

      // Determine day status
      let status = 'NO_DATA';
      let earned = 0;
      let color = 'grey';

      if (isFuture) {
        status = 'FUTURE';
        color = 'grey';
      } else if (isWeekend) {
        status = 'WEEKEND';
        color = 'grey';
      } else if (claim && claim.status === 'PAID') {
        status = 'PAYOUT_RECEIVED';
        color = 'gold';
        earned = parseFloat(claim.claim_amount);
      } else if (disruption) {
        status = 'DISRUPTION';
        color = 'red';
        earned = 0;
      } else if (workSession) {
        status = 'WORKED';
        color = 'green';
        earned = parseFloat(avg_daily_earning);
      }

      calendar.push({
        date: dateStr,
        day,
        status,
        color,
        earned: `₹${earned}`,
        disruption: disruption
          ? {
              type: disruption.event_type,
              severity: disruption.severity,
            }
          : null,
        claim: claim
          ? {
              claim_id: claim.claim_id,
              amount: `₹${claim.claim_amount}`,
              status: claim.status,
            }
          : null,
        work_session: workSession
          ? {
              hours: (workSession.total_minutes / 60).toFixed(1),
              premium: `₹${parseFloat(workSession.total_premium).toFixed(2)}`,
            }
          : null,
      });
    }

    // Summary stats
    const greenDays = calendar.filter((d) => d.status === 'WORKED').length;
    const redDays = calendar.filter((d) => d.status === 'DISRUPTION').length;
    const goldDays = calendar.filter(
      (d) => d.status === 'PAYOUT_RECEIVED'
    ).length;
    const totalEarned = calendar.reduce(
      (sum, d) => sum + parseFloat(d.earned.replace('₹', '')),
      0
    );

    res.json({
      month: targetMonth,
      year: targetYear,
      calendar,
      summary: {
        green_days: greenDays,
        red_days: redDays,
        gold_days: goldDays,
        total_earned: `₹${totalEarned.toFixed(2)}`,
        legend: {
          green: 'Worked — earned normally',
          red: 'Disruption — could not work',
          gold: 'Disruption — payout received',
          grey: 'Weekend or no data',
        },
      },
    });
  } catch (err) {
    console.error('Income calendar error:', err.message);
    res.status(500).json({ error: 'Server error while fetching calendar' });
  }
};

// F-08 — GET /api/workers/badges
export const getBadges = async (req, res) => {
  const worker_id = req.worker.worker_id;

  try {
    // Get worker
    const workerResult = await query(
      'SELECT * FROM workers WHERE worker_id = $1',
      [worker_id]
    );

    if (workerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    const worker = workerResult.rows[0];

    // Get streak info
    const streakResult = await query(
      'SELECT * FROM policy_streaks WHERE worker_id = $1',
      [worker_id]
    );

    const streak = streakResult.rows[0] || {
      current_streak: 0,
      total_weeks_covered: 0,
    };

    // Get claims stats
    const claimsResult = await query(
      `SELECT
        COUNT(*) AS total_claims,
        COUNT(*) FILTER (WHERE status = 'PAID') AS paid_claims,
        COUNT(*) FILTER (WHERE status = 'FLAGGED') AS flagged_claims,
        COALESCE(SUM(claim_amount) FILTER (WHERE status = 'PAID'), 0) AS total_paid
       FROM claims WHERE worker_id = $1`,
      [worker_id]
    );

    const claims = claimsResult.rows[0];
    const totalWeeks = streak.total_weeks_covered;
    const paidClaims = parseInt(claims.paid_claims);
    const flaggedClaims = parseInt(claims.flagged_claims);

    // Calculate GigScore (1.0 - 5.0)
    const risk = worker.risk_score;
    const gigScore = parseFloat(
      Math.max(1.0, Math.min(5.0, 5.0 - (risk / 100) * 4)).toFixed(1)
    );

    // Determine badge level
    let badge = null;
    let nextBadge = null;

    if (totalWeeks >= 12 || paidClaims >= 3) {
      badge = {
        level: 3,
        name: 'ShieldMaster',
        emoji: '🛡️',
        benefit: 'Permanent 10% premium reduction',
        unlocked: true,
      };
      nextBadge = null;
    } else if (totalWeeks >= 8 || paidClaims >= 2) {
      badge = {
        level: 2,
        name: 'Guardian',
        emoji: '⚔️',
        benefit: 'One free premium week per quarter',
        unlocked: true,
      };
      nextBadge = {
        level: 3,
        name: 'ShieldMaster',
        emoji: '🛡️',
        requirement: `${Math.max(0, 12 - totalWeeks)} more weeks of coverage OR ${Math.max(0, 3 - paidClaims)} more paid claims`,
      };
    } else if (totalWeeks >= 4 || paidClaims >= 1) {
      badge = {
        level: 1,
        name: 'Protector',
        emoji: '🔰',
        benefit: 'Priority customer support',
        unlocked: true,
      };
      nextBadge = {
        level: 2,
        name: 'Guardian',
        emoji: '⚔️',
        requirement: `${Math.max(0, 8 - totalWeeks)} more weeks of coverage OR ${Math.max(0, 2 - paidClaims)} more paid claims`,
      };
    } else {
      badge = null;
      nextBadge = {
        level: 1,
        name: 'Protector',
        emoji: '🔰',
        requirement: `${Math.max(0, 4 - totalWeeks)} more weeks of coverage OR 1 paid claim`,
      };
    }

    res.json({
      worker: {
        name: worker.full_name,
        platform: worker.platform,
        city: worker.city,
        gig_score: gigScore,
        risk_score: worker.risk_score,
        kyc_verified: worker.kyc_verified,
      },
      current_badge: badge,
      next_badge: nextBadge,
      stats: {
        total_weeks_covered: totalWeeks,
        current_streak: streak.current_streak,
        total_claims: parseInt(claims.total_claims),
        paid_claims: paidClaims,
        flagged_claims: flaggedClaims,
        total_income_protected: `₹${parseFloat(claims.total_paid).toFixed(2)}`,
      },
      all_badges: [
        {
          level: 1,
          name: 'Protector',
          emoji: '🔰',
          benefit: 'Priority customer support',
          unlocked: totalWeeks >= 4 || paidClaims >= 1,
        },
        {
          level: 2,
          name: 'Guardian',
          emoji: '⚔️',
          benefit: 'One free premium week per quarter',
          unlocked: totalWeeks >= 8 || paidClaims >= 2,
        },
        {
          level: 3,
          name: 'ShieldMaster',
          emoji: '🛡️',
          benefit: 'Permanent 10% premium reduction',
          unlocked: totalWeeks >= 12 || paidClaims >= 3,
        },
      ],
    });
  } catch (err) {
    console.error('Badges error:', err.message);
    res.status(500).json({ error: 'Server error while fetching badges' });
  }
};
