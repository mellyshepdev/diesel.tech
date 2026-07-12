import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

router.get('/makes', async (req, res) => {
  const { rows } = await pool.query('SELECT id, name FROM makes ORDER BY name');
  res.json(rows);
});

router.get('/makes/:makeId/models', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name FROM models WHERE make_id = $1 ORDER BY name',
    [req.params.makeId]
  );
  res.json(rows);
});

router.get('/models/:modelId/engines', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name FROM engines WHERE model_id = $1 ORDER BY name',
    [req.params.modelId]
  );
  res.json(rows);
});

export default router;
