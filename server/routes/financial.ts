import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/financial
router.get('/', async (req, res) => {
  const clinicId = (req as any).clinicId;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM financial_transactions WHERE clinic_id = $1 ORDER BY created_at DESC',
      [clinicId]
    );
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/financial (upsert)
router.post('/', async (req, res) => {
  const clinicId = (req as any).clinicId;
  const t = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO financial_transactions (id, clinic_id, patient_id, patient_name,
         appointment_id, professional_id, professional_name, description, category,
         amount, type, payment_method, status, payment_date, due_date,
         convenio_name, invoice_number, notes, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18, COALESCE($19, NOW()), NOW())
       ON CONFLICT (id) DO UPDATE SET
         status=$13, payment_date=$14, due_date=$15, notes=$18, updated_at=NOW()
       RETURNING *`,
      [t.id, clinicId, t.patient_id, t.patient_name, t.appointment_id,
       t.professional_id, t.professional_name, t.description, t.category,
       t.amount, t.type, t.payment_method, t.status || 'pendente',
       t.payment_date, t.due_date, t.convenio_name, t.invoice_number, t.notes, t.created_at]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/financial/:id
router.put('/:id', async (req, res) => {
  const clinicId = (req as any).clinicId;
  const t = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE financial_transactions SET
         description=$3, category=$4, amount=$5, type=$6, payment_method=$7,
         status=$8, payment_date=$9, due_date=$10, notes=$11, updated_at=NOW()
       WHERE id=$1 AND clinic_id=$2 RETURNING *`,
      [req.params.id, clinicId, t.description, t.category, t.amount,
       t.type, t.payment_method, t.status, t.payment_date, t.due_date, t.notes]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/financial/:id
router.delete('/:id', async (req, res) => {
  const clinicId = (req as any).clinicId;
  try {
    await pool.query('DELETE FROM financial_transactions WHERE id=$1 AND clinic_id=$2', [req.params.id, clinicId]);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
