import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import vehiclesRouter from './routes/vehicles.js';
import meRouter from './routes/me.js';
import progressRouter from './routes/progress.js';

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.use('/api/v1', vehiclesRouter);
app.use('/api/v1', meRouter);
app.use('/api/v1', progressRouter);

app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'invalid_token' });
  }
  console.error(err);
  res.status(500).json({ error: 'internal_error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`diesel.tech backend listening on :${port}`));
