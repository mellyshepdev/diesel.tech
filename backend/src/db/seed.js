import pool from './pool.js';

// Representative max factory ratings; hp/torque vary by model year and spec.
const FLEET = [
  // Volvo
  { make: 'Volvo',        model: 'VNL',      engine: 'D13',              horsepower: 500, torqueLbFt: 1850, displacementLiters: 12.8 },
  { make: 'Volvo',        model: 'VNL',      engine: 'D13TC',            horsepower: 455, torqueLbFt: 1850, displacementLiters: 12.8 },
  { make: 'Volvo',        model: 'VNL',      engine: 'D11',              horsepower: 425, torqueLbFt: 1550, displacementLiters: 10.8 },
  { make: 'Volvo',        model: 'VNR',      engine: 'D11',              horsepower: 425, torqueLbFt: 1550, displacementLiters: 10.8 },
  { make: 'Volvo',        model: 'VNR',      engine: 'D13',              horsepower: 455, torqueLbFt: 1850, displacementLiters: 12.8 },
  { make: 'Volvo',        model: 'VHD',      engine: 'D13',              horsepower: 500, torqueLbFt: 1850, displacementLiters: 12.8 },
  { make: 'Volvo',        model: '9700',     engine: 'D13 Coach',        horsepower: 425, torqueLbFt: 1650, displacementLiters: 12.8 },
  // Freightliner
  { make: 'Freightliner', model: 'Cascadia', engine: 'Detroit DD13',     horsepower: 525, torqueLbFt: 1850, displacementLiters: 12.8 },
  { make: 'Freightliner', model: 'Cascadia', engine: 'Detroit DD15',     horsepower: 505, torqueLbFt: 1850, displacementLiters: 14.8 },
  { make: 'Freightliner', model: 'Cascadia', engine: 'Cummins X15',      horsepower: 500, torqueLbFt: 1850, displacementLiters: 15.0 },
  { make: 'Freightliner', model: 'M2 106',   engine: 'Cummins B6.7',     horsepower: 300, torqueLbFt: 660,  displacementLiters: 6.7 },
  { make: 'Freightliner', model: 'M2 112',   engine: 'Detroit DD13',     horsepower: 450, torqueLbFt: 1650, displacementLiters: 12.8 },
  { make: 'Freightliner', model: '122SD',    engine: 'Detroit DD16',     horsepower: 600, torqueLbFt: 2050, displacementLiters: 15.6 },
  // Peterbilt
  { make: 'Peterbilt',    model: '579',      engine: 'PACCAR MX-13',     horsepower: 510, torqueLbFt: 1850, displacementLiters: 12.9 },
  { make: 'Peterbilt',    model: '579',      engine: 'PACCAR MX-11',     horsepower: 430, torqueLbFt: 1650, displacementLiters: 10.8 },
  { make: 'Peterbilt',    model: '579',      engine: 'Cummins X15',      horsepower: 565, torqueLbFt: 2050, displacementLiters: 15.0 },
  { make: 'Peterbilt',    model: '567',      engine: 'PACCAR MX-13',     horsepower: 510, torqueLbFt: 1850, displacementLiters: 12.9 },
  { make: 'Peterbilt',    model: '389',      engine: 'Cummins X15',      horsepower: 565, torqueLbFt: 2050, displacementLiters: 15.0 },
  // Kenworth
  { make: 'Kenworth',     model: 'T680',     engine: 'PACCAR MX-13',     horsepower: 510, torqueLbFt: 1850, displacementLiters: 12.9 },
  { make: 'Kenworth',     model: 'T680',     engine: 'PACCAR MX-11',     horsepower: 430, torqueLbFt: 1650, displacementLiters: 10.8 },
  { make: 'Kenworth',     model: 'T680',     engine: 'Cummins X15',      horsepower: 565, torqueLbFt: 2050, displacementLiters: 15.0 },
  { make: 'Kenworth',     model: 'T880',     engine: 'PACCAR MX-13',     horsepower: 510, torqueLbFt: 1850, displacementLiters: 12.9 },
  { make: 'Kenworth',     model: 'W900',     engine: 'Cummins X15',      horsepower: 605, torqueLbFt: 2050, displacementLiters: 15.0 },
  // International
  { make: 'International', model: 'LT',      engine: 'Cummins X15',      horsepower: 565, torqueLbFt: 1850, displacementLiters: 15.0 },
  { make: 'International', model: 'LT',      engine: 'International A26', horsepower: 475, torqueLbFt: 1750, displacementLiters: 12.4 },
  { make: 'International', model: 'HX',      engine: 'Cummins X15',      horsepower: 565, torqueLbFt: 2050, displacementLiters: 15.0 },
  { make: 'International', model: 'MV',      engine: 'Cummins B6.7',     horsepower: 300, torqueLbFt: 660,  displacementLiters: 6.7 },
  // Mack
  { make: 'Mack',         model: 'Anthem',   engine: 'Mack MP8',         horsepower: 505, torqueLbFt: 1860, displacementLiters: 12.8 },
  { make: 'Mack',         model: 'Anthem',   engine: 'Mack MP8HE',       horsepower: 445, torqueLbFt: 1860, displacementLiters: 12.8 },
  { make: 'Mack',         model: 'Granite',  engine: 'Mack MP7',         horsepower: 425, torqueLbFt: 1560, displacementLiters: 11.0 },
  { make: 'Mack',         model: 'Granite',  engine: 'Mack MP8',         horsepower: 505, torqueLbFt: 1860, displacementLiters: 12.8 },
  { make: 'Mack',         model: 'Pinnacle', engine: 'Mack MP8',         horsepower: 505, torqueLbFt: 1860, displacementLiters: 12.8 },
  // Western Star
  { make: 'Western Star', model: '49X',      engine: 'Detroit DD15',     horsepower: 505, torqueLbFt: 1850, displacementLiters: 14.8 },
  { make: 'Western Star', model: '49X',      engine: 'Detroit DD16',     horsepower: 600, torqueLbFt: 2050, displacementLiters: 15.6 },
  { make: 'Western Star', model: '57X',      engine: 'Detroit DD15',     horsepower: 505, torqueLbFt: 1850, displacementLiters: 14.8 },
  // Pickups
  { make: 'Ford',         model: 'F-250 Super Duty', engine: 'Power Stroke 6.7L V8',    horsepower: 475, torqueLbFt: 1050, displacementLiters: 6.7 },
  { make: 'Ford',         model: 'F-350 Super Duty', engine: 'Power Stroke 6.7L V8 HO', horsepower: 500, torqueLbFt: 1200, displacementLiters: 6.7 },
  { make: 'Ram',          model: '2500',     engine: 'Cummins 6.7L I6',    horsepower: 370, torqueLbFt: 850,  displacementLiters: 6.7 },
  { make: 'Ram',          model: '3500',     engine: 'Cummins 6.7L I6 HO', horsepower: 420, torqueLbFt: 1075, displacementLiters: 6.7 },
  { make: 'Chevrolet',    model: 'Silverado 2500HD', engine: 'Duramax 6.6L V8 L5P', horsepower: 470, torqueLbFt: 975, displacementLiters: 6.6 },
  { make: 'Chevrolet',    model: 'Silverado 1500',   engine: 'Duramax 3.0L I6',     horsepower: 305, torqueLbFt: 495, displacementLiters: 3.0 },
  { make: 'GMC',          model: 'Sierra 2500HD',    engine: 'Duramax 6.6L V8 L5P', horsepower: 470, torqueLbFt: 975, displacementLiters: 6.6 },
  { make: 'GMC',          model: 'Sierra 1500',      engine: 'Duramax 3.0L I6',     horsepower: 305, torqueLbFt: 495, displacementLiters: 3.0 },
  // Medium duty / vans
  { make: 'Isuzu',        model: 'NPR-HD',   engine: '4HK1-TC 5.2L',     horsepower: 215, torqueLbFt: 452, displacementLiters: 5.2 },
  { make: 'Hino',         model: 'L6',       engine: 'Hino J08E',        horsepower: 260, torqueLbFt: 660, displacementLiters: 7.7 },
  { make: 'Mercedes-Benz', model: 'Sprinter 2500', engine: 'OM654 2.0L I4', horsepower: 211, torqueLbFt: 332, displacementLiters: 2.0 },
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
