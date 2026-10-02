import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/patients
router.get('/', async (req, res) => {
  const clinicId = (req as any).clinicId;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM patients WHERE clinic_id = $1 ORDER BY created_at DESC',
      [clinicId]
    );
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/patients
router.post('/', async (req, res) => {
  const clinicId = (req as any).clinicId;
  const p = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO patients (id, clinic_id, name, cpf, birth_date, phone, email,
         health_insurance, insurance_card_number, address, blood_type, allergies, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, COALESCE($13, NOW()))
       ON CONFLICT (id) DO UPDATE SET
         name=$3, cpf=$4, birth_date=$5, phone=$6, email=$7,
         health_insurance=$8, insurance_card_number=$9, address=$10,
         blood_type=$11, allergies=$12
       RETURNING *`,
      [p.id, clinicId, p.name, p.cpf, p.birth_date, p.phone, p.email,
       p.health_insurance, p.insurance_card_number, p.address,
       p.blood_type, p.allergies, p.created_at]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/patients/:id
router.put('/:id', async (req, res) => {
  const clinicId = (req as any).clinicId;
  const p = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE patients SET
         name=$3, cpf=$4, birth_date=$5, phone=$6, email=$7,
         health_insurance=$8, insurance_card_number=$9, address=$10,
         blood_type=$11, allergies=$12
       WHERE id=$1 AND clinic_id=$2 RETURNING *`,
      [req.params.id, clinicId, p.name, p.cpf, p.birth_date, p.phone, p.email,
       p.health_insurance, p.insurance_card_number, p.address, p.blood_type, p.allergies]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/patients/:id
router.delete('/:id', async (req, res) => {
  const clinicId = (req as any).clinicId;
  try {
    await pool.query('DELETE FROM patients WHERE id=$1 AND clinic_id=$2', [req.params.id, clinicId]);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
