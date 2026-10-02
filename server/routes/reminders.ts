import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/reminders
router.get('/', async (req, res) => {
  const clinicId = (req as any).clinicId;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM reminder_settings WHERE clinic_id = $1',
      [clinicId]
    );
    res.json(rows[0] || null);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/reminders
router.put('/', async (req, res) => {
  const clinicId = (req as any).clinicId;
  const s = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO reminder_settings (id, clinic_id, enabled, send_working_hours_only,
         working_hours_start, working_hours_end, auto_confirm_keyword, auto_reschedule_keyword,
         api_gateway, notify_reception_on_cancel, rules)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (clinic_id) DO UPDATE SET
         enabled=$2, send_working_hours_only=$3, working_hours_start=$4,
         working_hours_end=$5, auto_confirm_keyword=$6, auto_reschedule_keyword=$7,
         api_gateway=$8, notify_reception_on_cancel=$9, rules=$10
       RETURNING *`,
      [clinicId, s.enabled, s.send_working_hours_only, s.working_hours_start,
       s.working_hours_end, s.auto_confirm_keyword, s.auto_reschedule_keyword,
       s.api_gateway, s.notify_reception_on_cancel, JSON.stringify(s.rules || [])]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
