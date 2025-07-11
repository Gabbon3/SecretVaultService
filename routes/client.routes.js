import express from 'express';
import { ClientController } from '../controllers/client.controller.js';
import { Authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();
const controller = new ClientController();

// Public routes
router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/validate', controller.validate);

// Protected routes
router.get('/me', Authorize, controller.getClientInfo);
router.delete('/:clientId/revoke', Authorize, controller.revoke);

export default router;