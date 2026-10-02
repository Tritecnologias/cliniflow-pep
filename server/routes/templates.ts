import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /api/templates
router.get('/', async (req, res) => {
  const clinicId = (req as any).clinicId;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM document_templates WHERE clinic_id = $1 ORDER BY created_at DESC',
      [clinicId]
    );
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/templates (upsert)
router.post('/', async (req, res) => {
  const clinicId = (req as any).clinicId;
  const t = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO document_templates (id, clinic_id, title, category, council_target,
         description, content, requires_cid, requires_days, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, COALESCE($10, NOW()), NOW())
       ON CONFLICT (id) DO UPDATE SET
         title=$3, category=$4, council_target=$5, description=$6,
         content=$7, requires_cid=$8, requires_days=$9, updated_at=NOW()
       RETURNING *`,
      [t.id, clinicId, t.title, t.category, t.council_target,
       t.description, t.content, t.requires_cid, t.requires_days, t.created_at]
    );
    res.json(rows[0]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/templates/:id
router.delete('/:id', async (req, res) => {
  const clinicId = (req as any).clinicId;
  try {
    await pool.query('DELETE FROM document_templates WHERE id=$1 AND clinic_id=$2', [req.params.id, clinicId]);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
