import express from 'express';
import authController from '../../controllers/auth.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = express.Router();

router.get('/google-login', authController.initiateGoogleAuth);
router.get('/callback', authController.googleCallback);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

export default router;