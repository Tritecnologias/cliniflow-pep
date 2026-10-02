import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/records
router.get('/', async (req, res) => {
  const clinicId = (req as any).clinicId;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM medical_records WHERE clinic_id = $1 ORDER BY created_at DESC',
      [clinicId]
    );
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/records (upsert)
router.post('/', async (req, res) => {
  const clinicId = (req as any).clinicId;
  const r = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO medical_records (
         id, clinic_id, patient_id, professional_id, appointment_id,
         anamnese_data, diagnosis_cid10, diagnosis_description,
         prescription, prescription_items, certificate_days,
         is_signed, signature_hash, signature_provider, signature_tsa_stamp,
         signed_at, signed_by_name, signed_by_council,
         biometric_verified, biometric_auth_type, biometric_credential_id, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21, COALESCE($22, NOW()))
       ON CONFLICT (id) DO UPDATE SET
         anamnese_data=$6, diagnosis_cid10=$7, diagnosis_description=$8,
         prescription=$9, prescription_items=$10, certificate_days=$11,
         is_signed=$12, signature_hash=$13, signature_provider=$14,
         signature_tsa_stamp=$15, signed_at=$16, signed_by_name=$17,
         signed_by_council=$18, biometric_verified=$19,
         biometric_auth_type=$20, biometric_credential_id=$21
       RETURNING *`,
      [
        r.id, clinicId, r.patient_id, r.professional_id, r.appointment_id,
        JSON.stringify(r.anamnese_data || {}),
        r.diagnosis_cid10, r.diagnosis_description,
        r.prescription, r.prescription_items ? JSON.stringify(r.prescription_items) : null,
        r.certificate_days || 0,
        r.is_signed || false, r.signature_hash, r.signature_provider,
        r.signature_tsa_stamp, r.signed_at, r.signed_by_name, r.signed_by_council,
        r.biometric_verified || false, r.biometric_auth_type, r.biometric_credential_id,
        r.created_at
      ]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
