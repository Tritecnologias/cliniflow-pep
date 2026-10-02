import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/audit
router.get('/', async (req, res) => {
  const clinicId = (req as any).clinicId;
  try {
    const { rows } = await pool.query(
      `SELECT a.* FROM medical_audit_trail a
       JOIN medical_records r ON r.id = a.record_id
       WHERE r.clinic_id = $1
       ORDER BY a.timestamp DESC LIMIT 500`,
      [clinicId]
    );
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/audit
router.post('/', async (req, res) => {
  const log = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO medical_audit_trail (id, record_id, patient_name, user_id, user_name,
         user_role, action, details, ip_address, user_agent, timestamp)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, COALESCE($11, NOW()))
       ON CONFLICT (id) DO NOTHING RETURNING *`,
      [log.id, log.record_id, log.patient_name, log.user_id, log.user_name,
       log.user_role, log.action, log.details, log.ip_address, log.user_agent, log.timestamp]
    );
    res.json(rows[0] || log);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
