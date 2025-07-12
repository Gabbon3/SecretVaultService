import express from 'express';
import { ClientController } from '../controllers/client.controller.js';
import { Authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();
const controller = new ClientController();

// Admin only can register server
router.post('/register', Authorize({ roles: ['*'] }), controller.register);

// Public routes
router.post('/login', controller.login);

// Protected routes
router.delete('/:clientId/revoke', Authorize(), controller.revoke);
router.get('/info/:clientId', Authorize(), controller.getClientInfo);

export default router;