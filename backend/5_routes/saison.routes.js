import express from "express";
import {
  getSaisons,
  getSaison,
  createSaison,
  updateSaison,
  deleteSaison,
} from "../4_controllers/saison.controller.js";
import { validateSaison } from "../3_middlewares/validation.middleware.js";
import { authMiddleware } from "../3_middlewares/auth.middleware.js";
import { roleMiddleware } from "../3_middlewares/role.middleware.js";

const router = express.Router();


// Lecture : publique
router.get("/", getSaisons);

router.get("/:id", getSaison);

// Écriture : super_admin + admin (gestion des tarifs)
router.post(
  "/",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  validateSaison,
  createSaison
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  validateSaison,
  updateSaison
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("super_admin", "admin"),
  deleteSaison
);


export default router;
