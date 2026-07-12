import { Router } from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

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
    `SELECT id, name, horsepower, torque_lb_ft AS "torqueLbFt",
            displacement_liters AS "displacementLiters", fuel_type AS "fuelType"
     FROM engines WHERE model_id = $1 ORDER BY name`,
    [req.params.modelId]
  );
  res.json(rows);
});

router.get('/vehicles', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT v.id, v.year, v.vin, v.unit_number AS "unitNumber", v.mileage, v.owner,
            e.id AS "engineId", e.name AS "engineName",
            mo.name AS "modelName", ma.name AS "makeName"
     FROM vehicles v
     JOIN engines e ON e.id = v.engine_id
     JOIN models mo ON mo.id = e.model_id
     JOIN makes ma ON ma.id = mo.make_id
     ORDER BY v.created_at DESC`
  );
  res.json(rows);
});

router.post('/vehicles', requireAuth, async (req, res) => {
  const { engineId, year, vin, unitNumber, mileage, owner } = req.body;
  if (!engineId || !year) {
    return res.status(400).json({ error: 'engineId and year are required' });
  }
  const { rows: [vehicle] } = await pool.query(
    `INSERT INTO vehicles (engine_id, year, vin, unit_number, mileage, owner)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, year, vin, unit_number AS "unitNumber", mileage, owner`,
    [engineId, year, vin || null, unitNumber || null, mileage || null, owner || null]
  );
  res.status(201).json(vehicle);
});

router.patch('/vehicles/:id', requireAuth, async (req, res) => {
  const { mileage, owner, unitNumber } = req.body;
  const { rows: [vehicle] } = await pool.query(
    `UPDATE vehicles
     SET mileage = COALESCE($1, mileage),
         owner = COALESCE($2, owner),
         unit_number = COALESCE($3, unit_number)
     WHERE id = $4
     RETURNING id, year, vin, unit_number AS "unitNumber", mileage, owner`,
    [mileage ?? null, owner ?? null, unitNumber ?? null, req.params.id]
  );
  if (!vehicle) return res.status(404).json({ error: 'not_found' });
  res.json(vehicle);
});

router.delete('/vehicles/:id', requireAuth, async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM vehicles WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'not_found' });
  res.status(204).end();
});

export default router;
