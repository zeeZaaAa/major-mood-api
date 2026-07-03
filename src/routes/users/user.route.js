import express from 'express';
import userController from '../../controllers/user.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';

const router = express.Router();

router.use(authenticate);

router.get('/me', userController.getMe);
router.get("/banned-users", authorize('users:read'), userController.getBannedUsers);
router.post("/:id/ban", authorize('users:write'), userController.banUser);
router.post("/:id/unban", authorize('users:write'), userController.unbanUser);

export default router;