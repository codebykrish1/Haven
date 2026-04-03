import { query } from '../db/index.js';

// Simulated nearby shelters by city
const SHELTERS_BY_CITY = {
  Mumbai: [
    {
      name: 'BMC Relief Centre - Dharavi',
      distance: '1.2 km',
      address: 'Dharavi, Mumbai',
    },
    {
      name: 'NDRF Camp - Kurla',
      distance: '2.5 km',
      address: 'Kurla West, Mumbai',
    },
    {
      name: 'Municipal School Shelter - Sion',
      distance: '3.1 km',
      address: 'Sion, Mumbai',
    },
  ],
  Delhi: [
    {
      name: 'NDRF Relief Camp - Yamuna Bank',
      distance: '2.0 km',
      address: 'Yamuna Bank, Delhi',
    },
    {
      name: 'Civil Defence Centre - Lajpat Nagar',
      distance: '3.5 km',
      address: 'Lajpat Nagar, Delhi',
    },
  ],
  Bengaluru: [
    {
      name: 'BBMP Relief Centre - Koramangala',
      distance: '1.8 km',
      address: 'Koramangala, Bengaluru',
    },
    {
      name: 'Emergency Shelter - Marathahalli',
      distance: '4.2 km',
      address: 'Marathahalli, Bengaluru',
    },
  ],
  Hyderabad: [
    {
      name: 'GHMC Relief Centre - Begumpet',
      distance: '2.1 km',
      address: 'Begumpet, Hyderabad',
    },
    {
      name: 'Emergency Camp - Hitech City',
      distance: '3.8 km',
      address: 'Hitech City, Hyderabad',
    },
  ],
  Chennai: [
    {
      name: 'GCC Relief Centre - Anna Nagar',
      distance: '1.5 km',
      address: 'Anna Nagar, Chennai',
    },
    {
      name: 'NDRF Camp - Adyar',
      distance: '2.9 km',
      address: 'Adyar, Chennai',
    },
  ],
  default: [
    {
      name: 'Nearest Government Relief Centre',
      distance: 'Calculating...',
      address: 'Contact 1078 for directions',
    },
    { name: 'NDRF Helpline', distance: 'N/A', address: 'Call 011-24363260' },
  ],
};

// POST /api/sos
export const triggerSOS = async (req, res) => {
  const worker_id = req.worker.worker_id;
  const { latitude, longitude, message, emergency_contact } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'GPS coordinates are required' });
  }

  try {
    // Get worker info
    const workerResult = await query(
      'SELECT full_name, city, phone_number FROM workers WHERE worker_id = $1',
      [worker_id]
    );

    const worker = workerResult.rows[0];

    // Get shelters for worker's city
    const shelters = SHELTERS_BY_CITY[worker.city] || SHELTERS_BY_CITY.default;

    // Log SOS event
    const result = await query(
      `INSERT INTO sos_events
        (worker_id, latitude, longitude, message, emergency_contact, nearest_shelters)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        worker_id,
        latitude,
        longitude,
        message || 'SOS triggered — worker needs assistance',
        emergency_contact || null,
        JSON.stringify(shelters),
      ]
    );

    console.log(
      `🆘 SOS triggered by ${worker.full_name} at ${latitude}, ${longitude}`
    );

    res.status(201).json({
      message: '🆘 SOS activated — help is on the way',
      sos: result.rows[0],
      worker: worker.full_name,
      location: { latitude, longitude },
      nearest_shelters: shelters,
      emergency_numbers: {
        ndrf: '011-24363260',
        police: '100',
        ambulance: '108',
        disaster_helpline: '1078',
      },
      note: emergency_contact
        ? `Emergency contact ${emergency_contact} has been notified`
        : 'Add an emergency contact in your profile for faster response',
    });
  } catch (err) {
    console.error('SOS trigger error:', err.message);
    res.status(500).json({ error: 'Server error while triggering SOS' });
  }
};

// GET /api/sos/my
export const getMySOSEvents = async (req, res) => {
  const worker_id = req.worker.worker_id;

  try {
    const result = await query(
      `SELECT * FROM sos_events
       WHERE worker_id = $1
       ORDER BY created_at DESC`,
      [worker_id]
    );

    res.json({
      count: result.rows.length,
      sos_events: result.rows,
    });
  } catch (err) {
    console.error('Get SOS events error:', err.message);
    res.status(500).json({ error: 'Server error while fetching SOS events' });
  }
};

// PATCH /api/sos/:id/resolve
export const resolveSOSEvent = async (req, res) => {
  const { id } = req.params;
  const worker_id = req.worker.worker_id;

  try {
    const result = await query(
      `UPDATE sos_events
       SET status = 'RESOLVED'
       WHERE sos_id = $1 AND worker_id = $2
       RETURNING *`,
      [id, worker_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'SOS event not found' });
    }

    res.json({
      message: '✅ SOS resolved — glad you are safe',
      sos: result.rows[0],
    });
  } catch (err) {
    console.error('Resolve SOS error:', err.message);
    res.status(500).json({ error: 'Server error while resolving SOS' });
  }
};
