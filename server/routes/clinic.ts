import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/clinic
router.get('/', async (req, res) => {
  const clinicId = (req as any).clinicId;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM clinics WHERE id = $1',
      [clinicId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Clínica não encontrada' });
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/clinic
router.put('/', async (req, res) => {
  const clinicId = (req as any).clinicId;
  const { plan } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE clinics SET plan = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [plan, clinicId]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
