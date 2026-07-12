import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url:      import.meta.env.VITE_KEYCLOAK_URL    || 'https://login.theofficialblacksheepco.com',
  realm:    import.meta.env.VITE_KEYCLOAK_REALM  || 'blacksheep',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT || 'diesel-tech-frontend',
  pkceMethod: 'S256',
});

export default keycloak;
