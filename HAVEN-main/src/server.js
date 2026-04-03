import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

import cors from 'cors';
import express from 'express';
import { initPool, query } from './db/index.js';
import authRoutes from './routes/auth.routes.js';
import claimRoutes from './routes/claim.routes.js';
import disruptionRoutes from './routes/disruption.routes.js';
import policyRoutes from './routes/policy.routes.js';
import sosRoutes from './routes/sos.routes.js';
import workerRoutes from './routes/worker.routes.js';

// Initialize pool AFTER dotenv has loaded
const pool = initPool(process.env.DATABASE_URL);

// Test connection on startup
pool
  .query('SELECT NOW()')
  .then((r) => console.log('✅ DB connected:', r.rows[0].now))
  .catch((e) => console.log('❌ DB connection failed:', e.message));

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/disruptions', disruptionRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/sos', sosRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({
    status: 'HAVEN API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// DB test route
app.get('/health', async (req, res) => {
  try {
    const result = await query('SELECT NOW()');
    res.json({
      status: 'healthy',
      db: '✅ Supabase connected',
      time: result.rows[0].now,
    });
  } catch (err) {
    res.status(500).json({
      status: 'unhealthy',
      db: '❌ DB connection failed',
      error: err.message,
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 HAVEN server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});
