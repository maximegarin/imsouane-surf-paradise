import express from "express";
import {
  getPrestations,
  getPrestation,
  createPrestation,
  updatePrestation,
  deletePrestation,
} from "../4_controllers/prestation.controller.js";
import { validatePrestation } from "../3_middlewares/validation.middleware.js";
import { authMiddleware } from "../3_middlewares/auth.middleware.js";
import { roleMiddleware } from "../3_middlewares/role.middleware.js";

const router = express.Router();


// Lecture : publique (le client voit les options lors de la réservation)
router.get("/", getPrestations);

router.get("/:id", getPrestation);

// Écriture : super_admin + admin (gestion des offres)
router.post(
  "/",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  validatePrestation,
  createPrestation
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  validatePrestation,
  updatePrestation
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  deletePrestation
);


export default router;
