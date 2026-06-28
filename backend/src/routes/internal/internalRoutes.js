import express from 'express';
import { authenticateJWT } from '../../middleware/auth.js';
import * as internalController from '../../controllers/internal/internalController.js';

const router = express.Router();

router.use(authenticateJWT);

router.get('/guide', internalController.getInternalGuide);

export default router;
