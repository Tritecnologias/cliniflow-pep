import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/appointments
router.get('/', async (req, res) => {
  const clinicId = (req as any).clinicId;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM appointments WHERE clinic_id = $1 ORDER BY scheduled_at DESC',
      [clinicId]
    );
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/appointments (upsert)
router.post('/', async (req, res) => {
  const clinicId = (req as any).clinicId;
  const a = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO appointments (id, clinic_id, patient_id, professional_id, scheduled_at,
         duration_minutes, status, appointment_type, telemedicine_room_id, webrtc_provider,
         notes, whatsapp_sent_at, whatsapp_confirmed_at, triage, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, COALESCE($15, NOW()))
       ON CONFLICT (id) DO UPDATE SET
         status=$7, notes=$11, whatsapp_sent_at=$12, whatsapp_confirmed_at=$13, triage=$14
       RETURNING *`,
      [a.id, clinicId, a.patient_id, a.professional_id, a.scheduled_at,
       a.duration_minutes || 30, a.status || 'scheduled', a.appointment_type || 'presential',
       a.telemedicine_room_id, a.webrtc_provider, a.notes,
       a.whatsapp_sent_at, a.whatsapp_confirmed_at,
       a.triage ? JSON.stringify(a.triage) : null, a.created_at]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/appointments/:id/status
router.patch('/:id/status', async (req, res) => {
  const clinicId = (req as any).clinicId;
  const { status } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE appointments SET status=$1 WHERE id=$2 AND clinic_id=$3 RETURNING *`,
      [status, req.params.id, clinicId]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/appointments/:id/whatsapp
router.patch('/:id/whatsapp', async (req, res) => {
  const clinicId = (req as any).clinicId;
  const { sent, confirmed } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE appointments SET
         whatsapp_sent_at = CASE WHEN $3 THEN NOW() ELSE whatsapp_sent_at END,
         whatsapp_confirmed_at = CASE WHEN $4 THEN NOW() ELSE whatsapp_confirmed_at END,
         status = CASE WHEN $4 THEN 'confirmed' ELSE status END
       WHERE id=$1 AND clinic_id=$2 RETURNING *`,
      [req.params.id, clinicId, !!sent, !!confirmed]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
