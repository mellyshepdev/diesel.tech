import { Router } from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Mechanic career progression, keyed on the verified JWT's `sub` claim.
// GET returns a fresh player's zeroed state rather than 404 — the frontend
// treats "never played" and "played, has nothing" identically.
router.get('/progress', requireAuth, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT coins, owned_tools AS "ownedTools" FROM player_progress WHERE user_sub = $1',
    [req.auth.sub]
  );
  res.json(rows[0] || { coins: 0, ownedTools: [] });
});

// Full-state upsert, not a delta — the frontend always sends its complete
// current coins + ownedTools (same values it already persists to
// localStorage), so this is a last-write-wins sync rather than a ledger of
// individual earn/spend events.
router.put('/progress', requireAuth, async (req, res) => {
  const { coins, ownedTools } = req.body;
  if (typeof coins !== 'number' || !Number.isFinite(coins) || !Array.isArray(ownedTools)) {
    return res.status(400).json({ error: 'coins (number) and ownedTools (array) are required' });
  }
  const { rows: [row] } = await pool.query(
    `INSERT INTO player_progress (user_sub, coins, owned_tools, updated_at)
     VALUES ($1, $2, $3::jsonb, now())
     ON CONFLICT (user_sub) DO UPDATE
       SET coins = EXCLUDED.coins, owned_tools = EXCLUDED.owned_tools, updated_at = now()
     RETURNING coins, owned_tools AS "ownedTools"`,
    [req.auth.sub, Math.max(0, Math.round(coins)), JSON.stringify(ownedTools)]
  );
  res.json(row);
});

export default router;
