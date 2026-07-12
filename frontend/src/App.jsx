import { useState, useEffect } from 'react';
import keycloak from './keycloak';
import { getMakes, getModels, getEngines } from './services/api';
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
    </section>
  );
}

export default App;
