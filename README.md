# Diesel.tech

A lookup tool for finding the make, model, and engine of a diesel vehicle through cascading dropdowns. Part of the Black Sheep ecosystem, authenticating against the shared `blacksheep` Keycloak realm.

## Stack

- **Backend:** Node.js (Express), PostgreSQL, JWT auth via Keycloak (`express-jwt` + `jwks-rsa`)
- **Frontend:** React + Vite, `keycloak-js` for SSO

## Project structure

```
backend/
  src/
    db/          schema, migration, and seed scripts
    middleware/   Keycloak JWT verification
    routes/       /api/v1/makes, /models, /engines, /me
frontend/
  src/
    App.jsx       cascading make/model/engine dropdown UI
    keycloak.js    Keycloak client config
    services/api.js  axios client for the backend
```

## Getting started

### Backend

```
cd backend
cp .env.example .env   # fill in DATABASE_URL and Keycloak settings
npm install
npm run migrate        # creates makes/models/engines tables
npm run seed            # seeds a sample Volvo VNL D13
npm run dev
```

### Frontend

```
cd frontend
npm install
npm run dev
```

The frontend expects the backend at the URL configured in `frontend/src/services/api.js`, and a Keycloak client (`diesel-tech-frontend`) registered in the `blacksheep` realm.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v1/makes` | List all makes |
| GET | `/api/v1/makes/:makeId/models` | List models for a make |
| GET | `/api/v1/models/:modelId/engines` | List engines for a model |
| GET | `/api/v1/me` | Current authenticated user (requires bearer token) |

## Status

Make/model/engine lookup and Keycloak SSO work end to end. The seed covers 14 makes, 33 models, and 46 engine combos (Class 8 trucks, vocational, pickups, medium duty) with representative max factory hp/torque ratings.

## Roadmap

- Real vehicle data set beyond the single seeded sample
- Actual vehicle records (specs, part compatibility) beyond the make/model/engine lookup chain
