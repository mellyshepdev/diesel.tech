import pool from './pool.js';

const FLEET = [
  { make: 'Volvo',        model: 'VNL',      engine: 'D13',           horsepower: 500, torqueLbFt: 1850, displacementLiters: 12.8 },
  { make: 'Volvo',        model: 'VNR',      engine: 'D11',           horsepower: 425, torqueLbFt: 1550, displacementLiters: 10.8 },
  { make: 'Volvo',        model: '9700',     engine: 'D13 Coach',     horsepower: 425, torqueLbFt: 1650, displacementLiters: 12.8 },
  { make: 'Freightliner', model: 'Cascadia', engine: 'Detroit DD15',  horsepower: 505, torqueLbFt: 1850, displacementLiters: 14.8 },
  { make: 'Peterbilt',    model: '579',      engine: 'PACCAR MX-13',  horsepower: 510, torqueLbFt: 1850, displacementLiters: 12.9 },
  { make: 'Kenworth',     model: 'T680',     engine: 'PACCAR MX-13',  horsepower: 510, torqueLbFt: 1850, displacementLiters: 12.9 },
  { make: 'International', model: 'LT',      engine: 'Cummins X15',   horsepower: 565, torqueLbFt: 1850, displacementLiters: 15.0 },
  { make: 'Mack',         model: 'Anthem',   engine: 'Mack MP8',      horsepower: 445, torqueLbFt: 1660, displacementLiters: 12.8 },
];

const VEHICLES = [
  { make: 'Volvo', model: 'VNL', engine: 'D13', year: 2022, vin: '4V4NC9EJ0NN123456', unitNumber: 'BS-101', mileage: 182000, owner: 'Black Sheep Logistics' },
  { make: 'Freightliner', model: 'Cascadia', engine: 'Detroit DD15', year: 2023, vin: '3AKJHHDR8PSNA1234', unitNumber: 'BS-102', mileage: 94500, owner: 'Black Sheep Logistics' },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const engineIds = {};
    for (const { make, model, engine, horsepower, torqueLbFt, displacementLiters } of FLEET) {
      const { rows: [makeRow] } = await client.query(
        `INSERT INTO makes (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [make]
      );

      const { rows: [modelRow] } = await client.query(
        `INSERT INTO models (make_id, name) VALUES ($1, $2)
         ON CONFLICT (make_id, name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [makeRow.id, model]
      );

      const { rows: [engineRow] } = await client.query(
        `INSERT INTO engines (model_id, name, horsepower, torque_lb_ft, displacement_liters)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (model_id, name) DO UPDATE
           SET horsepower = EXCLUDED.horsepower,
               torque_lb_ft = EXCLUDED.torque_lb_ft,
               displacement_liters = EXCLUDED.displacement_liters
         RETURNING id`,
        [modelRow.id, engine, horsepower, torqueLbFt, displacementLiters]
      );

      engineIds[`${make}|${model}|${engine}`] = engineRow.id;
    }

    for (const { make, model, engine, year, vin, unitNumber, mileage, owner } of VEHICLES) {
      await client.query(
        `INSERT INTO vehicles (engine_id, year, vin, unit_number, mileage, owner)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (vin) DO UPDATE
           SET mileage = EXCLUDED.mileage,
               owner = EXCLUDED.owner`,
        [engineIds[`${make}|${model}|${engine}`], year, vin, unitNumber, mileage, owner]
      );
    }

    await client.query('COMMIT');
    console.log(`Seeded ${FLEET.length} make/model/engine combos and ${VEHICLES.length} vehicles.`);
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
