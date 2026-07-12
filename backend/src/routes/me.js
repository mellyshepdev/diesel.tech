import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/me', requireAuth, (req, res) => {
  const { preferred_username, email, realm_access } = req.auth;
  res.json({
    preferredUsername: preferred_username,
    email,
    roles: realm_access?.roles || [],
  });
});

export default router;
