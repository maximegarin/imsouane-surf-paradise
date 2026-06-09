import express from "express";
import { login, register } from "../4_controllers/auth.controller.js";
import { validateRegisterAdmin } from "../3_middlewares/validation.middleware.js";
import { authMiddleware } from "../3_middlewares/auth.middleware.js";
import { roleMiddleware } from "../3_middlewares/role.middleware.js";

const router = express.Router();


router.post("/login", login);

// Inscription d'un admin : réservé au super_admin connecté
router.post(
  "/register",
  authMiddleware,
  roleMiddleware("super_admin"),
  validateRegisterAdmin,
  register
);


export default router;
