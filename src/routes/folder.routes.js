import express from 'express';
import { FolderController } from '../controllers/folder.controller.js';
import { Authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();
const controller = new FolderController();

router.use(Authorize());
router.post('/', controller.create);
router.get('/:id/path', controller.getPath);
router.get('/:id', controller.get);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);
router.get('/', controller.list);

export default router;