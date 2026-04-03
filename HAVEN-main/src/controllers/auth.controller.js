import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';

// Helper — generate JWT token
const generateToken = (worker) => {
  return jwt.sign(
    {
      worker_id: worker.worker_id,
      email: worker.email,
      platform: worker.platform,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register
export const registerWorker = async (req, res) => {
  const {
    full_name,
    email,
    phone_number,
    password,
    platform,
    city,
    zone_id,
    avg_daily_earning,
    upi_id,
  } = req.body;

  // Basic validation
  if (
    !full_name ||
    !email ||
    !phone_number ||
    !password ||
    !platform ||
    !city ||
    !zone_id
  ) {
    return res
      .status(400)
      .json({ error: 'All required fields must be filled' });
  }

  try {
    // Check if worker already exists
    const existing = await query(
      'SELECT worker_id FROM workers WHERE email = $1 OR phone_number = $2',
      [email, phone_number]
    );

    if (existing.rows.length > 0) {
      return res
        .status(409)
        .json({ error: 'Email or phone number already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert worker
    const result = await query(
      `INSERT INTO workers 
        (full_name, email, phone_number, password_hash, platform, city, zone_id, avg_daily_earning, upi_id)
       VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING worker_id, full_name, email, phone_number, platform, city, zone_id, risk_score, kyc_verified, created_at`,
      [
        full_name,
        email,
        phone_number,
        password_hash,
        platform,
        city,
        zone_id,
        avg_daily_earning || 500,
        upi_id || null,
      ]
    );

    const worker = result.rows[0];
    const token = generateToken(worker);

    res.status(201).json({
      message: 'Worker registered successfully',
      token,
      worker,
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// POST /api/auth/login
export const loginWorker = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find worker
    const result = await query('SELECT * FROM workers WHERE email = $1', [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const worker = result.rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, worker.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(worker);

    // Remove password_hash from response
    const { password_hash, ...workerData } = worker;

    res.json({
      message: 'Login successful',
      token,
      worker: workerData,
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const result = await query(
      'SELECT worker_id, full_name, email, phone_number, platform, city, zone_id, avg_daily_earning, upi_id, risk_score, kyc_verified, created_at FROM workers WHERE worker_id = $1',
      [req.worker.worker_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    res.json({ worker: result.rows[0] });
  } catch (err) {
    console.error('GetMe error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};
