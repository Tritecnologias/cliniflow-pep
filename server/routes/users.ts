import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/users
router.get('/', async (req, res) => {
  const clinicId = (req as any).clinicId;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE clinic_id = $1 ORDER BY created_at ASC',
      [clinicId]
    );
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
