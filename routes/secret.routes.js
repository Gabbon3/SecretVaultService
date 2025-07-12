import express from 'express';
import { SecretController } from '../controllers/secret.controller.js';
import { Authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();
const controller = new SecretController();

router.use(Authorize());
router.post('/', controller.create);
router.get('/:identifier', controller.get);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.get('/', controller.list);
router.get('/:name/exists', controller.exists);

export default router;