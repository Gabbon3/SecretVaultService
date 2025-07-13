import express from "express";
import { DEKController } from "../controllers/dek.controller.js";
import { Authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();
const controller = new DEKController();

// Admin only routes
router.use(Authorize({ roles: ['*'] }));
router.post("/", controller.create);
router.get("/:includeKeys", controller.list);
router.get("/:id", controller.get);
router.get("/by-kek/:kekId/:includeKeys", controller.getByKek);
router.delete("/:id", controller.delete);
// 
router.post("/rotate-kek", controller.rotateToNewKek);
export default router;