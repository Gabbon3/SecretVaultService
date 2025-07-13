import express from "express";
import { DEKController } from "../controllers/dek.controller.js";
import { Authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();
const controller = new DEKController();

// Admin only routes
router.use(Authorize({ roles: ['*'] }));
router.post("/", controller.create);
router.get("/", controller.list);
router.get("/:id", controller.get);
router.delete("/:id", controller.delete);

export default router;