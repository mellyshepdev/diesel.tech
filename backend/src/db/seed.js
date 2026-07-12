import pool from './pool.js';

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [make] } = await client.query(
      `INSERT INTO makes (name) VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['Volvo']
    );

    const { rows: [model] } = await client.query(
      `INSERT INTO models (make_id, name) VALUES ($1, $2)
       ON CONFLICT (make_id, name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [make.id, 'VNL']
    );

    await client.query(
      `INSERT INTO engines (model_id, name) VALUES ($1, $2)
       ON CONFLICT (model_id, name) DO NOTHING`,
      [model.id, 'D13']
    );

    await client.query('COMMIT');
    console.log('Seeded Volvo -> VNL -> D13');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
