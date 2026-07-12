import { useState, useEffect } from 'react';
import keycloak from './keycloak';
import { getMakes, getModels, getEngines, getVehicles, createVehicle, deleteVehicle } from './services/api';
import './App.css';

function App() {
  const [authReady, setAuthReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [engines, setEngines] = useState([]);

  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedEngine, setSelectedEngine] = useState('');

  const [vehicles, setVehicles] = useState([]);
  const [newVehicle, setNewVehicle] = useState({ year: '', vin: '', unitNumber: '', mileage: '', owner: '' });

  useEffect(() => {
    keycloak
      .init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
        pkceMethod: 'S256',
      })
      .then(auth => {
        setAuthenticated(auth);
        setAuthReady(true);
      })
      .catch(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    getMakes().then(res => setMakes(res.data));
    reloadVehicles();
  }, []);

  useEffect(() => {
    setSelectedModel('');
    setModels([]);
    setSelectedEngine('');
    setEngines([]);
    if (selectedMake) {
      getModels(selectedMake).then(res => setModels(res.data));
    }
  }, [selectedMake]);

  useEffect(() => {
    setSelectedEngine('');
    setEngines([]);
    if (selectedModel) {
      getEngines(selectedModel).then(res => setEngines(res.data));
    }
  }, [selectedModel]);

  function reloadVehicles() {
    getVehicles().then(res => setVehicles(res.data));
  }

  async function handleAddVehicle(e) {
    e.preventDefault();
    await createVehicle({
      engineId: Number(selectedEngine),
      year: Number(newVehicle.year),
      vin: newVehicle.vin || undefined,
      unitNumber: newVehicle.unitNumber || undefined,
      mileage: newVehicle.mileage ? Number(newVehicle.mileage) : undefined,
      owner: newVehicle.owner || undefined,
    });
    setNewVehicle({ year: '', vin: '', unitNumber: '', mileage: '', owner: '' });
    reloadVehicles();
  }

  async function handleDeleteVehicle(id) {
    await deleteVehicle(id);
    reloadVehicles();
  }

  const engine = engines.find(e => String(e.id) === String(selectedEngine));
  const visibleVehicles = selectedEngine
    ? vehicles.filter(v => String(v.engineId) === String(selectedEngine))
    : vehicles;

  return (
    <section id="center">
      <div className="auth-bar">
        {authReady && (authenticated ? (
          <button onClick={() => keycloak.logout({ redirectUri: window.location.origin })}>
            Sign Out
          </button>
        ) : (
          <button onClick={() => keycloak.login()}>Sign In</button>
        ))}
      </div>

      <h1>Diesel.tech</h1>

      <div className="dropdowns">
        <label>
          Make
          <select value={selectedMake} onChange={e => setSelectedMake(e.target.value)}>
            <option value="">Select a make</option>
            {makes.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </label>

        <label>
          Model
          <select
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
            disabled={!selectedMake}
          >
            <option value="">Select a model</option>
            {models.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </label>

        <label>
          Engine
          <select
            value={selectedEngine}
            onChange={e => setSelectedEngine(e.target.value)}
            disabled={!selectedModel}
          >
            <option value="">Select an engine</option>
            {engines.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </label>
      </div>

      {engine && (
        <dl className="engine-specs">
          <div><dt>Horsepower</dt><dd>{engine.horsepower ? `${engine.horsepower} hp` : '—'}</dd></div>
          <div><dt>Torque</dt><dd>{engine.torqueLbFt ? `${engine.torqueLbFt} lb-ft` : '—'}</dd></div>
          <div><dt>Displacement</dt><dd>{engine.displacementLiters ? `${engine.displacementLiters} L` : '—'}</dd></div>
          <div><dt>Fuel</dt><dd>{engine.fuelType}</dd></div>
        </dl>
      )}

      <div className="vehicles">
        <h2>{selectedEngine ? 'Vehicles with this engine' : 'All vehicles'}</h2>
        {visibleVehicles.length === 0 && <p>No vehicles recorded yet.</p>}
        <ul className="vehicle-list">
          {visibleVehicles.map(v => (
            <li key={v.id}>
              <span>{v.year} {v.makeName} {v.modelName} ({v.engineName})</span>
              {v.unitNumber && <span> · Unit {v.unitNumber}</span>}
              {v.mileage != null && <span> · {v.mileage.toLocaleString()} mi</span>}
              {v.owner && <span> · {v.owner}</span>}
              {authenticated && (
                <button onClick={() => handleDeleteVehicle(v.id)}>Remove</button>
              )}
            </li>
          ))}
        </ul>

        {authenticated && selectedEngine && (
          <form className="add-vehicle" onSubmit={handleAddVehicle}>
            <h3>Add a vehicle for this engine</h3>
            <input
              type="number" placeholder="Year" required
              value={newVehicle.year}
              onChange={e => setNewVehicle({ ...newVehicle, year: e.target.value })}
            />
            <input
              type="text" placeholder="VIN"
              value={newVehicle.vin}
              onChange={e => setNewVehicle({ ...newVehicle, vin: e.target.value })}
            />
            <input
              type="text" placeholder="Unit #"
              value={newVehicle.unitNumber}
              onChange={e => setNewVehicle({ ...newVehicle, unitNumber: e.target.value })}
            />
            <input
              type="number" placeholder="Mileage"
              value={newVehicle.mileage}
              onChange={e => setNewVehicle({ ...newVehicle, mileage: e.target.value })}
            />
            <input
              type="text" placeholder="Owner"
              value={newVehicle.owner}
              onChange={e => setNewVehicle({ ...newVehicle, owner: e.target.value })}
            />
            <button type="submit">Add Vehicle</button>
          </form>
        )}
      </div>
    </section>
  );
}

export default App;
