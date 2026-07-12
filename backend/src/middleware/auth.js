import { expressjwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';

const { KEYCLOAK_URL, KEYCLOAK_REALM } = process.env;
const issuer = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}`;

// Matches the welcome/hub backend's Spring OAuth2 resource server config:
// validates against the realm issuer only, no audience check (Keycloak
// access tokens don't carry the requesting client in `aud` by default).
export const requireAuth = expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksUri: `${issuer}/protocol/openid-connect/certs`,
  }),
  issuer,
  algorithms: ['RS256'],
});
